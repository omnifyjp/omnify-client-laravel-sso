<?php

declare(strict_types=1);

namespace Omnify\SsoClient\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Str;
use Omnify\SsoClient\Cache\RolePermissionCache;
use Omnify\SsoClient\Models\Permission;
use Omnify\SsoClient\Models\Role;
use OpenApi\Attributes as OA;

#[OA\Tag(name: 'SSO Roles', description: 'Role management endpoints')]
class RoleAdminController extends Controller
{
    /**
     * List all roles for the current organization.
     */
    #[OA\Get(
        path: '/api/admin/sso/roles',
        summary: 'List all roles',
        tags: ['SSO Roles'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(
                name: 'filter[scope]',
                in: 'query',
                description: 'Filter by scope: global (null org), org (current org only), all (both)',
                schema: new OA\Schema(type: 'string', enum: ['global', 'org', 'all'])
            ),
            new OA\Parameter(
                name: 'filter[org_id]',
                in: 'query',
                description: 'Filter by specific organization ID',
                schema: new OA\Schema(type: 'string')
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Roles list',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/Role')),
                    ]
                )
            ),
        ]
    )]
    public function index(Request $request): JsonResponse
    {
        $orgId = $request->header('X-Org-Id');
        $scope = $request->input('filter.scope', 'all');
        $filterOrgId = $request->input('filter.org_id');

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

        // Add organization info for each role
        $roles->each(function ($role) {
            if ($role->console_org_id) {
                $org = \Omnify\SsoClient\Models\OrganizationCache::where('console_org_id', $role->console_org_id)->first();
                $role->organization = $org ? [
                    'id' => $org->id,
                    'console_org_id' => $org->console_org_id,
                    'name' => $org->name,
                    'code' => $org->code,
                ] : null;
            } else {
                $role->organization = null;
            }
        });

        return response()->json([
            'data' => $roles,
        ]);
    }

    /**
     * Create a new role.
     */
    #[OA\Post(
        path: '/api/admin/sso/roles',
        summary: 'Create a new role',
        tags: ['SSO Roles'],
        security: [['sanctum' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['slug', 'name', 'level'],
                properties: [
                    new OA\Property(property: 'slug', type: 'string', maxLength: 100, example: 'editor'),
                    new OA\Property(property: 'name', type: 'string', maxLength: 100, example: 'Editor'),
                    new OA\Property(property: 'level', type: 'integer', minimum: 0, maximum: 100, example: 50),
                    new OA\Property(property: 'description', type: 'string', nullable: true),
                    new OA\Property(property: 'scope', type: 'string', enum: ['global', 'org'], example: 'org', description: 'Role scope: global (system-wide) or org (organization-specific)'),
                    new OA\Property(property: 'console_org_id', type: 'string', nullable: true, description: 'Organization ID for org-scoped roles'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Role created', content: new OA\JsonContent(ref: '#/components/schemas/Role')),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function store(Request $request): JsonResponse
    {
        $headerOrgId = $request->header('X-Org-Id');

        $validated = $request->validate([
            'slug' => ['required', 'string', 'max:100'],
            'name' => ['required', 'string', 'max:100'],
            'level' => ['required', 'integer', 'min:0', 'max:100'],
            'description' => ['nullable', 'string'],
            'scope' => ['nullable', 'string', 'in:global,org'],
            'console_org_id' => ['nullable', 'string', 'max:36'],
        ]);

        // Determine org_id based on scope
        $scope = $validated['scope'] ?? 'org';
        $orgId = $scope === 'global' ? null : ($validated['console_org_id'] ?? $headerOrgId);

        // Check unique constraint within scope (global or org)
        $existingRole = Role::where('console_org_id', $orgId)
            ->where(function ($query) use ($validated) {
                $query->where('slug', $validated['slug'])
                    ->orWhere('name', $validated['name']);
            })
            ->first();

        if ($existingRole) {
            return response()->json([
                'error' => 'DUPLICATE_ROLE',
                'message' => $orgId
                    ? 'A role with this name or slug already exists in this organization'
                    : 'A global role with this name or slug already exists',
            ], 422);
        }

        $role = Role::create([
            'slug' => $validated['slug'],
            'name' => $validated['name'],
            'level' => $validated['level'],
            'description' => $validated['description'] ?? null,
            'console_org_id' => $orgId,
        ]);

        return response()->json([
            'data' => $role,
            'message' => 'Role created successfully',
        ], 201);
    }

    /**
     * Get a specific role.
     */
    #[OA\Get(
        path: '/api/admin/sso/roles/{id}',
        summary: 'Get a specific role',
        tags: ['SSO Roles'],
        security: [['sanctum' => []]],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid'))],
        responses: [
            new OA\Response(response: 200, description: 'Role details', content: new OA\JsonContent(ref: '#/components/schemas/Role')),
            new OA\Response(response: 404, description: 'Role not found'),
        ]
    )]
    public function show(Request $request, string $id): JsonResponse
    {
        $orgId = $request->header('X-Org-Id');

        $role = Role::with('permissions')
            ->where('id', $id)
            ->where(function ($query) use ($orgId) {
                $query->whereNull('console_org_id')
                    ->orWhere('console_org_id', $orgId);
            })
            ->firstOrFail();

        return response()->json([
            'data' => $role,
        ]);
    }

    /**
     * Update a role.
     */
    #[OA\Put(
        path: '/api/admin/sso/roles/{id}',
        summary: 'Update a role',
        tags: ['SSO Roles'],
        security: [['sanctum' => []]],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid'))],
        requestBody: new OA\RequestBody(
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'name', type: 'string', maxLength: 100),
                    new OA\Property(property: 'level', type: 'integer', minimum: 0, maximum: 100),
                    new OA\Property(property: 'description', type: 'string', nullable: true),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Role updated', content: new OA\JsonContent(ref: '#/components/schemas/Role')),
            new OA\Response(response: 404, description: 'Role not found'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function update(Request $request, string $id): JsonResponse
    {
        $orgId = $request->header('X-Org-Id');

        $role = Role::where('id', $id)
            ->where(function ($query) use ($orgId) {
                $query->whereNull('console_org_id')
                    ->orWhere('console_org_id', $orgId);
            })
            ->firstOrFail();

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:100'],
            'level' => ['sometimes', 'integer', 'min:0', 'max:100'],
            'description' => ['nullable', 'string'],
        ]);

        // Slug cannot be changed
        unset($validated['slug']);

        $role->update($validated);

        // Clear cache
        RolePermissionCache::clear($role->slug);

        return response()->json([
            'data' => $role->fresh(),
            'message' => 'Role updated successfully',
        ]);
    }

    /**
     * Delete a role.
     */
    #[OA\Delete(
        path: '/api/admin/sso/roles/{id}',
        summary: 'Delete a role',
        tags: ['SSO Roles'],
        security: [['sanctum' => []]],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid'))],
        responses: [
            new OA\Response(response: 204, description: 'Role deleted'),
            new OA\Response(response: 404, description: 'Role not found'),
            new OA\Response(response: 422, description: 'Cannot delete system role'),
        ]
    )]
    public function destroy(Request $request, string $id): JsonResponse
    {
        $orgId = $request->header('X-Org-Id');

        $role = Role::where('id', $id)
            ->where(function ($query) use ($orgId) {
                $query->whereNull('console_org_id')
                    ->orWhere('console_org_id', $orgId);
            })
            ->firstOrFail();

        // Check if it's a global system role (org_id = null)
        $systemRoles = ['admin', 'manager', 'member'];
        if ($role->console_org_id === null && in_array($role->slug, $systemRoles, true)) {
            return response()->json([
                'error' => 'CANNOT_DELETE_SYSTEM_ROLE',
                'message' => 'Global system roles cannot be deleted',
            ], 422);
        }

        // Clear cache before delete
        RolePermissionCache::clear($role->slug);

        $role->delete();

        return response()->json(null, 204);
    }

    /**
     * Get role's permissions.
     */
    #[OA\Get(
        path: '/api/admin/sso/roles/{id}/permissions',
        summary: 'Get role permissions',
        tags: ['SSO Roles'],
        security: [['sanctum' => []]],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid'))],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Role permissions',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'role', type: 'object'),
                        new OA\Property(property: 'permissions', type: 'array', items: new OA\Items(ref: '#/components/schemas/Permission')),
                    ]
                )
            ),
            new OA\Response(response: 404, description: 'Role not found'),
        ]
    )]
    public function permissions(Request $request, string $id): JsonResponse
    {
        $orgId = $request->header('X-Org-Id');

        $role = Role::with('permissions')
            ->where('id', $id)
            ->where(function ($query) use ($orgId) {
                $query->whereNull('console_org_id')
                    ->orWhere('console_org_id', $orgId);
            })
            ->firstOrFail();

        return response()->json([
            'role' => [
                'id' => $role->id,
                'slug' => $role->slug,
                'name' => $role->name,
            ],
            'permissions' => $role->permissions,
        ]);
    }

    /**
     * Sync role's permissions.
     */
    #[OA\Put(
        path: '/api/admin/sso/roles/{id}/permissions',
        summary: 'Sync role permissions',
        tags: ['SSO Roles'],
        security: [['sanctum' => []]],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid'))],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['permissions'],
                properties: [
                    new OA\Property(property: 'permissions', type: 'array', items: new OA\Items(oneOf: [new OA\Schema(type: 'integer'), new OA\Schema(type: 'string')]), description: 'Permission IDs or slugs'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Permissions synced',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string'),
                        new OA\Property(property: 'attached', type: 'integer'),
                        new OA\Property(property: 'detached', type: 'integer'),
                    ]
                )
            ),
            new OA\Response(response: 404, description: 'Role not found'),
        ]
    )]
    public function syncPermissions(Request $request, string $id): JsonResponse
    {
        $orgId = $request->header('X-Org-Id');

        $role = Role::where('id', $id)
            ->where(function ($query) use ($orgId) {
                $query->whereNull('console_org_id')
                    ->orWhere('console_org_id', $orgId);
            })
            ->firstOrFail();

        $validated = $request->validate([
            'permissions' => ['required', 'array'],
            'permissions.*' => ['required'],
        ]);

        // Handle both IDs (UUIDs) and slugs
        $permissionIds = collect($validated['permissions'])->map(function ($item) {
            // Check if it's a UUID (ID)
            if (Str::isUuid($item)) {
                return $item;
            }

            // Find by slug
            $permission = Permission::where('slug', $item)->first();

            return $permission?->id;
        })->filter()->values()->toArray();

        // Get current permissions for diff
        $currentIds = $role->permissions()->pluck('permissions.id')->toArray();

        // Sync permissions
        $role->permissions()->sync($permissionIds);

        // Calculate attached and detached
        $attached = count(array_diff($permissionIds, $currentIds));
        $detached = count(array_diff($currentIds, $permissionIds));

        // Clear cache
        RolePermissionCache::clear($role->slug);

        return response()->json([
            'message' => 'Permissions synced successfully',
            'attached' => $attached,
            'detached' => $detached,
        ]);
    }
}
