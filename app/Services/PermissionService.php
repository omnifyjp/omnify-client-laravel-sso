<?php

declare(strict_types=1);

namespace Omnify\SsoClient\Services;

use Illuminate\Support\Collection;
use Omnify\SsoClient\Models\Permission;
use Omnify\SsoClient\Models\Role;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class PermissionService
{
    /**
     * List all permissions with optional filters.
     *
     * @param  array{search?: string, group?: string}  $filters
     */
    public function list(array $filters = []): Collection
    {
        return QueryBuilder::for(Permission::class)
            ->allowedFilters([
                AllowedFilter::callback('search', function ($query, $value) {
                    $query->where(function ($q) use ($value) {
                        $q->where('name', 'like', "%{$value}%")
                            ->orWhere('slug', 'like', "%{$value}%");
                    });
                }),
                AllowedFilter::exact('group'),
            ])
            ->defaultSort('group')
            ->get();
    }

    /**
     * Get all unique permission groups.
     *
     * @return array<string>
     */
    public function getGroups(): array
    {
        return Permission::query()
            ->whereNotNull('group')
            ->distinct()
            ->pluck('group')
            ->sort()
            ->values()
            ->toArray();
    }

    /**
     * Get permissions grouped by group name.
     *
     * @return array<string, Collection>
     */
    public function getGrouped(): array
    {
        $permissions = Permission::orderBy('group')->orderBy('name')->get();

        return $permissions->groupBy('group')->toArray();
    }

    /**
     * Find permission by ID.
     */
    public function find(string $id): ?Permission
    {
        return Permission::find($id);
    }

    /**
     * Find permission by slug.
     */
    public function findBySlug(string $slug): ?Permission
    {
        return Permission::where('slug', $slug)->first();
    }

    /**
     * Create a new permission.
     *
     * @param  array{slug: string, name: string, group?: string, description?: string}  $data
     * @return array{success: bool, permission?: Permission, error?: string, message?: string}
     */
    public function create(array $data): array
    {
        // Check unique slug
        if (Permission::where('slug', $data['slug'])->exists()) {
            return [
                'success' => false,
                'error' => 'DUPLICATE_PERMISSION',
                'message' => 'A permission with this slug already exists',
            ];
        }

        $permission = Permission::create([
            'slug' => $data['slug'],
            'name' => $data['name'],
            'group' => $data['group'] ?? null,
            'description' => $data['description'] ?? null,
        ]);

        return [
            'success' => true,
            'permission' => $permission,
            'message' => 'Permission created successfully',
        ];
    }

    /**
     * Update a permission.
     *
     * @param  array{name?: string, group?: string, description?: string}  $data
     */
    public function update(Permission $permission, array $data): Permission
    {
        // Slug cannot be changed
        unset($data['slug']);

        $permission->update($data);

        return $permission->fresh();
    }

    /**
     * Delete a permission.
     */
    public function delete(Permission $permission): bool
    {
        return $permission->delete();
    }

    /**
     * Get permission matrix (roles vs permissions).
     *
     * @return array{
     *     roles: Collection,
     *     permissions: Collection,
     *     groups: array,
     *     matrix: array<string, array<string, bool>>
     * }
     */
    public function getMatrix(?string $orgId = null): array
    {
        $roles = Role::query()
            ->where(function ($query) use ($orgId) {
                $query->whereNull('console_org_id');
                if ($orgId) {
                    $query->orWhere('console_org_id', $orgId);
                }
            })
            ->with('permissions')
            ->orderBy('level', 'desc')
            ->get();

        $permissions = Permission::orderBy('group')->orderBy('name')->get();
        $groups = $this->getGroups();

        // Build matrix
        $matrix = [];
        foreach ($roles as $role) {
            $rolePermissions = $role->permissions->pluck('id')->toArray();
            $matrix[$role->id] = [];
            foreach ($permissions as $permission) {
                $matrix[$role->id][$permission->id] = in_array($permission->id, $rolePermissions, true);
            }
        }

        return [
            'roles' => $roles,
            'permissions' => $permissions,
            'groups' => $groups,
            'matrix' => $matrix,
        ];
    }

    /**
     * Get permissions with role count.
     */
    public function listWithRoleCount(): Collection
    {
        return Permission::withCount('roles')
            ->orderBy('group')
            ->orderBy('name')
            ->get();
    }
}
