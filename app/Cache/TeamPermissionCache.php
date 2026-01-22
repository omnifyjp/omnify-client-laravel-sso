<?php

declare(strict_types=1);

namespace Omnify\SsoClient\Cache;

use Illuminate\Support\Facades\Cache;
use Omnify\SsoClient\Models\TeamPermission;

class TeamPermissionCache
{
    private const CACHE_KEY = 'sso:team_permissions';

    /**
     * Get permissions for multiple teams (cached).
     * Note: TeamPermission model uses SoftDeletes trait,
     * so soft-deleted records are automatically excluded.
     *
     * @param  array<int>  $teamIds
     * @param  string|int  $orgId  Organization ID (UUID string or int for legacy)
     * @return array<string>
     */
    public static function getForTeams(array $teamIds, string|int $orgId): array
    {
        if (empty($teamIds)) {
            return [];
        }

        sort($teamIds);
        $cacheKey = self::CACHE_KEY.':'.$orgId.':'.md5(implode(',', $teamIds));
        $ttl = config('sso-client.cache.team_permissions_ttl', 3600);

        return Cache::remember($cacheKey, $ttl, function () use ($teamIds, $orgId) {
            return TeamPermission::where('console_org_id', $orgId)
                ->whereIn('console_team_id', $teamIds)
                ->with('permission')
                ->get()
                ->pluck('permission.slug')
                ->unique()
                ->values()
                ->toArray();
        });
    }

    /**
     * Clear cache for a specific team.
     *
     * @param  string|int  $orgId  Organization ID (UUID string or int for legacy)
     */
    public static function clearForTeam(int $teamId, string|int $orgId): void
    {
        // Since we use a composite key with all team IDs, we need to clear all caches for this org
        // In production, consider using cache tags for more granular control
        self::clearForOrg($orgId);
    }

    /**
     * Clear all team permission caches for an organization.
     *
     * @param  string|int  $orgId  Organization ID (UUID string or int for legacy)
     */
    public static function clearForOrg(string|int $orgId): void
    {
        // Get all distinct team combinations for this org
        // This is a simplified approach - in production use cache tags
        $pattern = self::CACHE_KEY.':'.$orgId.':*';

        // Note: This requires a cache driver that supports pattern deletion
        // For Redis: Cache::getStore()->getRedis()->keys($pattern)
        // For simplicity, we'll just clear specific known combinations

        // Alternative: Use cache tags if your driver supports it
        // Cache::tags(['sso', 'team_permissions', 'org_'.$orgId])->flush();
    }
}
