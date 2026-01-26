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
    public function checkAccess(Model $user, string $orgSlug): ?array
    {
        $cacheKey = $this->getCacheKey($user->console_user_id, $orgSlug);

        return Cache::remember(
            $cacheKey,
            $this->cacheTtl,
            function () use ($user, $orgSlug) {
                $accessToken = $this->tokenService->getAccessToken($user);

                if (! $accessToken) {
                    return null;
                }

                return $this->consoleApi->getAccess($accessToken, $orgSlug);
            }
        );
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
            return [];
        }

        $organizations = $this->consoleApi->getOrganizations($accessToken);

        // Auto-cache organizations to database
        $this->cacheOrganizations($organizations);

        return $organizations;
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
    public function getUserTeams(Model $user, string $orgSlug): array
    {
        $cacheKey = "sso:user_teams:{$user->id}:{$orgSlug}";

        return Cache::remember(
            $cacheKey,
            config('sso-client.cache.user_teams_ttl', 300),
            function () use ($user, $orgSlug) {
                $accessToken = $this->tokenService->getAccessToken($user);

                if (! $accessToken) {
                    return [];
                }

                $teams = $this->consoleApi->getUserTeams($accessToken, $orgSlug);

                // Auto-cache teams to database
                $this->cacheTeams($teams, $orgSlug);

                return $teams;
            }
        );
    }

    /**
     * Auto-cache teams from Console response.
     *
     * @param  array<array{id: int|string, name: string}>  $teams
     * @param  string  $orgSlug  Organization slug to find console_org_id
     */
    private function cacheTeams(array $teams, string $orgSlug): void
    {
        // Get organization by slug to find console_org_id
        $org = OrganizationCache::where('code', $orgSlug)->first();
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
    public function clearCache(int|string $consoleUserId, ?string $orgSlug = null): void
    {
        if ($orgSlug) {
            Cache::forget($this->getCacheKey($consoleUserId, $orgSlug));
        }
        // Note: For clearing all orgs for a user, we would need cache tags
        // which requires a cache driver that supports tags (Redis, Memcached)
    }

    /**
     * Clear teams cache for user.
     */
    public function clearTeamsCache(int|string $userId, ?string $orgSlug = null): void
    {
        if ($orgSlug) {
            Cache::forget("sso:user_teams:{$userId}:{$orgSlug}");
        }
    }

    /**
     * Get cache key for org access.
     */
    private function getCacheKey(int|string $consoleUserId, string $orgSlug): string
    {
        return self::CACHE_KEY_PREFIX.":{$consoleUserId}:{$orgSlug}";
    }
}
