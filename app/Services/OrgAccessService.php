<?php

declare(strict_types=1);

namespace Omnify\SsoClient\Services;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Omnify\SsoClient\Models\OrganizationCache;
use Omnify\SsoClient\Models\TeamCache;

class OrgAccessService
{
    private const CACHE_KEY_PREFIX = 'sso:org_access';

    public function __construct(
        private readonly ConsoleApiService $consoleApi,
        private readonly ConsoleTokenService $tokenService,
        private readonly int $cacheTtl = 300
    ) {}

    /**
     * Check if user has access to organization.
     *
     * @return array{organization_id: string, organization_slug: string, org_role: string, service_role: string|null, service_role_level: int}|null
     */
    public function checkAccess(Model $user, string $orgId): ?array
    {
        $cacheKey = $this->getCacheKey($user->console_user_id, $orgId);

        return Cache::remember(
            $cacheKey,
            $this->cacheTtl,
            function () use ($user, $orgId) {
                $accessToken = $this->tokenService->getAccessToken($user);

                if (! $accessToken) {
                    // Fallback to local check for local development
                    return $this->checkAccessLocal($user, $orgId);
                }

                // Try console API with fallback to local check
                try {
                    $result = $this->consoleApi->getAccess($accessToken, $orgId);
                    if ($result !== null) {
                        return $result;
                    }
                } catch (\Throwable $e) {
                    // Log and fallback to local check
                    \Log::warning('Console API access check failed, using local fallback', [
                        'error' => $e->getMessage(),
                        'org_id' => $orgId,
                    ]);
                }

                // Fallback to local check
                return $this->checkAccessLocal($user, $orgId);
            }
        );
    }

    /**
     * Fallback access check for local development when no SSO token available.
     *
     * @return array{organization_id: string, organization_slug: string, organization_name: string, org_role: string, service_role: string|null, service_role_level: int}|null
     */
    private function checkAccessLocal(Model $user, string $orgId): ?array
    {
        // Check if org exists in cache
        $org = OrganizationCache::where('id', $orgId)
            ->orWhere('code', $orgId)
            ->orWhere('name', $orgId)
            ->first();

        if (! $org) {
            return null;
        }

        // For local dev, grant admin access to user's org
        $userOrgId = $user->console_org_id ?? null;

        // Allow access if:
        // 1. User's org matches
        // 2. Or no user org set (super admin mode for dev)
        if ($userOrgId && $org->id !== $userOrgId && $org->console_org_id !== $userOrgId) {
            return null;
        }

        return [
            'organization_id' => $org->id,
            'organization_slug' => $org->code ?: $org->name,
            'organization_name' => $org->name,
            'org_role' => 'admin',
            'service_role' => 'admin',
            'service_role_level' => 100,
        ];
    }

    /**
     * Get all organizations user has access to.
     *
     * @return array<array{organization_id: string, organization_slug: string, organization_name: string, org_role: string, service_role: string|null}>
     */
    public function getOrganizations(Model $user): array
    {
        $accessToken = $this->tokenService->getAccessToken($user);

        if (! $accessToken) {
            // Fallback to cached organizations when no token available (for local development)
            return $this->getCachedOrganizations($user);
        }

        $organizations = $this->consoleApi->getOrganizations($accessToken);

        // Auto-cache organizations to database
        $this->cacheOrganizations($organizations);

        return $organizations;
    }

    /**
     * Get organizations from local cache (fallback for local development).
     *
     * @return array<array{organization_id: string, organization_slug: string, organization_name: string, org_role: string, service_role: string|null}>
     */
    private function getCachedOrganizations(Model $user): array
    {
        // If user has a console_org_id, return that org from cache
        $consoleOrgId = $user->console_org_id ?? null;

        $query = OrganizationCache::query()->where('is_active', true);

        // If user has specific org, prioritize it
        if ($consoleOrgId) {
            $query->where(function ($q) use ($consoleOrgId) {
                $q->where('id', $consoleOrgId)
                    ->orWhere('console_org_id', $consoleOrgId);
            });
        }

        $orgs = $query->get();

        return $orgs->map(fn ($org) => [
            'organization_id' => $org->id,
            'organization_slug' => $org->code ?: $org->name,
            'organization_name' => $org->name,
            'org_role' => 'admin', // Default for local dev
            'service_role' => 'admin',
        ])->all();
    }

    /**
     * Auto-cache organizations from Console response.
     *
     * @param  array<array{organization_id: string, organization_slug: string, organization_name: string}>  $organizations
     */
    private function cacheOrganizations(array $organizations): void
    {
        foreach ($organizations as $org) {
            $consoleOrgId = $org['organization_id'] ?? null;

            if ($consoleOrgId) {
                OrganizationCache::updateOrCreate(
                    ['console_org_id' => $consoleOrgId],
                    [
                        'name' => $org['organization_name'] ?? 'Unknown',
                        'code' => $org['organization_slug'] ?? $consoleOrgId,
                        'is_active' => true,
                    ]
                );
            }
        }
    }

    /**
     * Get user's teams in organization.
     *
     * @return array<array{id: int, name: string, path: string|null, parent_id: int|null, is_leader: bool}>
     */
    public function getUserTeams(Model $user, string $orgId): array
    {
        $cacheKey = "sso:user_teams:{$user->id}:{$orgId}";

        return Cache::remember(
            $cacheKey,
            config('sso-client.cache.user_teams_ttl', 300),
            function () use ($user, $orgId) {
                $accessToken = $this->tokenService->getAccessToken($user);

                if (! $accessToken) {
                    return [];
                }

                $teams = $this->consoleApi->getUserTeams($accessToken, $orgId);

                // Auto-cache teams to database
                $this->cacheTeams($teams, $orgId);

                return $teams;
            }
        );
    }

    /**
     * Auto-cache teams from Console response.
     *
     * @param  array<array{id: int|string, name: string}>  $teams
     * @param  string  $orgId  Organization slug to find console_org_id
     */
    private function cacheTeams(array $teams, string $orgId): void
    {
        // Get organization by slug to find console_org_id
        $org = OrganizationCache::where('code', $orgId)->first();
        $consoleOrgId = $org?->console_org_id;

        if (! $consoleOrgId) {
            return;
        }

        foreach ($teams as $team) {
            $consoleTeamId = (string) ($team['id'] ?? '');

            if ($consoleTeamId) {
                TeamCache::updateOrCreate(
                    ['console_team_id' => $consoleTeamId],
                    [
                        'console_org_id' => $consoleOrgId,
                        'name' => $team['name'] ?? 'Unknown Team',
                    ]
                );
            }
        }
    }

    /**
     * Clear access cache for user/org.
     */
    public function clearCache(int|string $consoleUserId, ?string $orgId = null): void
    {
        if ($orgId) {
            Cache::forget($this->getCacheKey($consoleUserId, $orgId));
        }
        // Note: For clearing all orgs for a user, we would need cache tags
        // which requires a cache driver that supports tags (Redis, Memcached)
    }

    /**
     * Clear teams cache for user.
     */
    public function clearTeamsCache(int|string $userId, ?string $orgId = null): void
    {
        if ($orgId) {
            Cache::forget("sso:user_teams:{$userId}:{$orgId}");
        }
    }

    /**
     * Get cache key for org access.
     */
    private function getCacheKey(int|string $consoleUserId, string $orgId): string
    {
        return self::CACHE_KEY_PREFIX.":{$consoleUserId}:{$orgId}";
    }
}
