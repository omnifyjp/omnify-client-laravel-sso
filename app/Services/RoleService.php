<?php

declare(strict_types=1);

namespace Omnify\SsoClient\Services;

use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Omnify\SsoClient\Cache\RolePermissionCache;
use Omnify\SsoClient\Models\OrganizationCache;
use Omnify\SsoClient\Models\Permission;
use Omnify\SsoClient\Models\Role;

class RoleService
{
    /**
     * List roles with optional scope filter.
     *
     * @param  array{scope?: string, org_id?: string, filter_org_id?: string}  $filters
     */
    public function list(?string $orgId = null, array $filters = []): Collection
    {
        $scope = $filters['scope'] ?? 'all';
        $filterOrgId = $filters['filter_org_id'] ?? null;

        $query = Role::withCount('permissions');

        // Apply scope filter
        if ($scope === 'global') {
            $query->whereNull('console_org_id');
        } elseif ($scope === 'org') {
            $query->where('console_org_id', $filterOrgId ?: $orgId);
        } else {
            // 'all' - include global + current org roles
            $query->where(function ($q) use ($orgId, $filterOrgId) {
                $q->whereNull('console_org_id');
                if ($filterOrgId) {
                    $q->orWhere('console_org_id', $filterOrgId);
                } elseif ($orgId) {
                    $q->orWhere('console_org_id', $orgId);
                }
            });
        }

        $roles = $query->orderBy('level', 'desc')->get();

        // Add organization info
        $roles->each(function ($role) {
            $role->organization = $this->getOrganizationInfo($role->console_org_id);
        });

        return $roles;
    }

    /**
     * Find role by ID with org access check.
     */
    public function find(string $id, ?string $orgId = null): ?Role
    {
        return Role::with('permissions')
            ->where('id', $id)
            ->where(function ($query) use ($orgId) {
                $query->whereNull('console_org_id')
                    ->orWhere('console_org_id', $orgId);
            })
            ->first();
    }

    /**
     * Create a new role.
     *
     * @param  array{slug: string, name: string, level: int, description?: string, scope?: string, console_org_id?: string}  $data
     * @return array{success: bool, role?: Role, error?: string, message?: string}
     */
    public function create(array $data, ?string $headerOrgId = null): array
    {
        $scope = $data['scope'] ?? 'org';
        $orgId = $scope === 'global' ? null : ($data['console_org_id'] ?? $headerOrgId);

        // Check unique constraint within scope
        $existingRole = Role::where('console_org_id', $orgId)
            ->where(function ($query) use ($data) {
                $query->where('slug', $data['slug'])
                    ->orWhere('name', $data['name']);
            })
            ->first();

        if ($existingRole) {
            return [
                'success' => false,
                'error' => 'DUPLICATE_ROLE',
                'message' => $orgId
                    ? 'A role with this name or slug already exists in this organization'
                    : 'A global role with this name or slug already exists',
            ];
        }

        $role = Role::create([
            'slug' => $data['slug'],
            'name' => $data['name'],
            'level' => $data['level'],
            'description' => $data['description'] ?? null,
            'console_org_id' => $orgId,
        ]);

        return [
            'success' => true,
            'role' => $role,
            'message' => 'Role created successfully',
        ];
    }

    /**
     * Update a role.
     *
     * @param  array{name?: string, level?: int, description?: string}  $data
     */
    public function update(Role $role, array $data): Role
    {
        // Slug cannot be changed
        unset($data['slug']);

        $role->update($data);

        // Clear cache
        RolePermissionCache::clear($role->slug);

        return $role->fresh();
    }

    /**
     * Delete a role.
     *
     * @return array{success: bool, error?: string, message?: string}
     */
    public function delete(Role $role): array
    {
        // Check if it's a global system role
        $systemRoles = ['admin', 'manager', 'member'];
        if ($role->console_org_id === null && in_array($role->slug, $systemRoles, true)) {
            return [
                'success' => false,
                'error' => 'CANNOT_DELETE_SYSTEM_ROLE',
                'message' => 'Global system roles cannot be deleted',
            ];
        }

        // Clear cache before delete
        RolePermissionCache::clear($role->slug);

        $role->delete();

        return ['success' => true];
    }

    /**
     * Get role's permissions.
     */
    public function getPermissions(Role $role): array
    {
        return [
            'role' => [
                'id' => $role->id,
                'slug' => $role->slug,
                'name' => $role->name,
            ],
            'permissions' => $role->permissions,
        ];
    }

    /**
     * Sync role's permissions.
     *
     * @param  array<string|int>  $permissionIds  Permission IDs or slugs
     * @return array{message: string, attached: int, detached: int}
     */
    public function syncPermissions(Role $role, array $permissionIds): array
    {
        // Handle both IDs (UUIDs) and slugs
        $resolvedIds = collect($permissionIds)->map(function ($item) {
            if (Str::isUuid($item)) {
                return $item;
            }

            $permission = Permission::where('slug', $item)->first();

            return $permission?->id;
        })->filter()->values()->toArray();

        // Get current permissions for diff
        $currentIds = $role->permissions()->pluck('permissions.id')->toArray();

        // Sync permissions
        $role->permissions()->sync($resolvedIds);

        // Calculate attached and detached
        $attached = count(array_diff($resolvedIds, $currentIds));
        $detached = count(array_diff($currentIds, $resolvedIds));

        // Clear cache
        RolePermissionCache::clear($role->slug);

        return [
            'message' => 'Permissions synced successfully',
            'attached' => $attached,
            'detached' => $detached,
        ];
    }

    /**
     * Get organization info by console_org_id.
     */
    private function getOrganizationInfo(?string $consoleOrgId): ?array
    {
        if (! $consoleOrgId) {
            return null;
        }

        $org = OrganizationCache::where('console_org_id', $consoleOrgId)->first();

        return $org ? [
            'id' => $org->id,
            'console_org_id' => $org->console_org_id,
            'name' => $org->name,
            'code' => $org->code,
        ] : null;
    }
}
