<?php

declare(strict_types=1);

namespace Omnify\SsoClient\Services;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

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

        return $this->consoleApi->getOrganizations($accessToken);
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

                return $this->consoleApi->getUserTeams($accessToken, $orgSlug);
            }
        );
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
