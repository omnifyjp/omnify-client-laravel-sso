<?php

declare(strict_types=1);

namespace Omnify\SsoClient\Models\Traits;

use Illuminate\Support\Facades\Cache;
use Omnify\SsoClient\Cache\RolePermissionCache;
use Omnify\SsoClient\Cache\TeamPermissionCache;
use Omnify\SsoClient\Services\OrgAccessService;

/**
 * Trait for checking permissions from both Role and Teams.
 *
 * Requires:
 * - HasConsoleSso trait
 * - service_role attribute (from SSO org access)
 */
trait HasTeamPermissions
{
    /**
     * Get all permissions for user (role + teams).
     *
     * @param  string|int|null  $orgId  Organization ID (UUID string or int for legacy)
     * @return array<string>
     */
    public function getAllPermissions(string|int|null $orgId = null): array
    {
        $orgId = $orgId ?? session('current_org_id');

        if (! $orgId) {
            return $this->getRolePermissions();
        }

        $rolePermissions = $this->getRolePermissions();
        $teamPermissions = $this->getTeamPermissions($orgId);

        return array_unique([...$rolePermissions, ...$teamPermissions]);
    }

    /**
     * Get role permissions.
     *
     * @return array<string>
     */
    public function getRolePermissions(): array
    {
        // Get service_role from session or request attribute
        $serviceRole = session('service_role') ?? request()->attributes->get('serviceRole');

        if (! $serviceRole) {
            return [];
        }

        return RolePermissionCache::get($serviceRole);
    }

    /**
     * Get team permissions for user in organization.
     *
     * @param  string|int  $orgId  Organization ID (UUID string or int for legacy)
     * @return array<string>
     */
    public function getTeamPermissions(string|int $orgId): array
    {
        $teams = $this->getConsoleTeams($orgId);

        if (empty($teams)) {
            return [];
        }

        $teamIds = collect($teams)->pluck('id')->toArray();

        return TeamPermissionCache::getForTeams($teamIds, $orgId);
    }

    /**
     * Check if user has a specific permission (via role OR team).
     *
     * @param  string|int|null  $orgId  Organization ID (UUID string or int for legacy)
     */
    public function hasPermission(string $permission, string|int|null $orgId = null): bool
    {
        return in_array($permission, $this->getAllPermissions($orgId), true);
    }

    /**
     * Check if user has any of the given permissions.
     *
     * @param  array<string>  $permissions
     * @param  string|int|null  $orgId  Organization ID (UUID string or int for legacy)
     */
    public function hasAnyPermission(array $permissions, string|int|null $orgId = null): bool
    {
        $userPermissions = $this->getAllPermissions($orgId);

        foreach ($permissions as $permission) {
            if (in_array($permission, $userPermissions, true)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if user has all of the given permissions.
     *
     * @param  array<string>  $permissions
     * @param  string|int|null  $orgId  Organization ID (UUID string or int for legacy)
     */
    public function hasAllPermissions(array $permissions, string|int|null $orgId = null): bool
    {
        $userPermissions = $this->getAllPermissions($orgId);

        foreach ($permissions as $permission) {
            if (! in_array($permission, $userPermissions, true)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get user's teams from Console (cached).
     *
     * @param  string|int  $orgId  Organization ID (UUID string or int for legacy)
     * @return array<array{id: int, name: string, path: string|null, parent_id: int|null, is_leader: bool}>
     */
    public function getConsoleTeams(string|int $orgId): array
    {
        $cacheKey = "sso:user_teams:{$this->id}:{$orgId}";

        return Cache::remember(
            $cacheKey,
            config('sso-client.cache.user_teams_ttl', 300),
            function () use ($orgId) {
                $orgSlug = $this->getOrgSlugById($orgId);

                if (! $orgSlug) {
                    return [];
                }

                return app(OrgAccessService::class)->getUserTeams($this, $orgSlug);
            }
        );
    }

    /**
     * Clear permission cache for user.
     *
     * @param  string|int|null  $orgId  Organization ID (UUID string or int for legacy)
     */
    public function clearPermissionCache(string|int|null $orgId = null): void
    {
        if ($orgId) {
            Cache::forget("sso:user_teams:{$this->id}:{$orgId}");
        }
    }

    /**
     * Get organization slug by ID.
     * Override this method if you have a different way to resolve org slug.
     *
     * @param  string|int  $orgId  Organization ID (UUID string or int for legacy)
     */
    protected function getOrgSlugById(string|int $orgId): ?string
    {
        // Try to get from session
        $orgSlug = session('current_org_slug');

        if ($orgSlug) {
            return $orgSlug;
        }

        // Try to get from request
        return request()->attributes->get('orgSlug');
    }
}
