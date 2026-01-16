<?php

declare(strict_types=1);

namespace Omnify\SsoClient\Cache;

use Illuminate\Support\Facades\Cache;
use Omnify\SsoClient\Models\Role;

class RolePermissionCache
{
    private const CACHE_KEY = 'sso:role_permissions';

    /**
     * Get permissions for a role (cached).
     *
     * @return array<string>
     */
    public static function get(string $roleSlug): array
    {
        $ttl = config('sso-client.cache.role_permissions_ttl', 3600);

        return Cache::remember(
            self::CACHE_KEY.':'.$roleSlug,
            $ttl,
            fn () => Role::where('slug', $roleSlug)
                ->first()
                ?->permissions()
                ->pluck('slug')
                ->toArray() ?? []
        );
    }

    /**
     * Clear cache for a role.
     */
    public static function clear(?string $roleSlug = null): void
    {
        if ($roleSlug) {
            Cache::forget(self::CACHE_KEY.':'.$roleSlug);
        } else {
            // Clear all role caches
            $roles = Role::pluck('slug');
            foreach ($roles as $slug) {
                Cache::forget(self::CACHE_KEY.':'.$slug);
            }
        }
    }

    /**
     * Warm up cache for all roles.
     */
    public static function warmUp(): void
    {
        $roles = Role::with('permissions')->get();

        foreach ($roles as $role) {
            $ttl = config('sso-client.cache.role_permissions_ttl', 3600);

            Cache::put(
                self::CACHE_KEY.':'.$role->slug,
                $role->permissions->pluck('slug')->toArray(),
                $ttl
            );
        }
    }
}
