<?php

declare(strict_types=1);

namespace Omnify\SsoClient\Cache;

use Illuminate\Support\Facades\Cache;

class ConsoleTeamsCache
{
    private const CACHE_KEY = 'sso:user_teams';

    /**
     * Get cached teams for user in organization.
     *
     * @param  string|int  $orgId  Organization ID (UUID string or int for legacy)
     * @return array<array{id: int, name: string, path: string|null, parent_id: int|null, is_leader: bool}>|null
     */
    public static function get(int|string $userId, string|int $orgId): ?array
    {
        return Cache::get(self::CACHE_KEY.":{$userId}:{$orgId}");
    }

    /**
     * Set teams cache for user in organization.
     *
     * @param  string|int  $orgId  Organization ID (UUID string or int for legacy)
     * @param  array<array{id: int, name: string, path: string|null, parent_id: int|null, is_leader: bool}>  $teams
     */
    public static function set(int|string $userId, string|int $orgId, array $teams): void
    {
        $ttl = config('sso-client.cache.user_teams_ttl', 300);

        Cache::put(
            self::CACHE_KEY.":{$userId}:{$orgId}",
            $teams,
            $ttl
        );
    }

    /**
     * Clear teams cache for user.
     *
     * @param  string|int|null  $orgId  Organization ID (UUID string or int for legacy)
     */
    public static function clear(int|string $userId, string|int|null $orgId = null): void
    {
        if ($orgId) {
            Cache::forget(self::CACHE_KEY.":{$userId}:{$orgId}");
        }
        // Note: Clearing all orgs for a user requires cache tags or pattern matching
    }
}
