<?php

declare(strict_types=1);

namespace Omnify\SsoClient\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Omnify\SsoClient\Cache\RolePermissionCache;
use Omnify\SsoClient\Models\Permission;
use Omnify\SsoClient\Models\Role;
use OpenApi\Attributes as OA;

#[OA\Tag(name: 'SSO Roles', description: 'Role management endpoints')]
class RoleAdminController extends Controller
{
    /**
     * List all roles.
     */
    #[OA\Get(
        path: '/api/admin/sso/roles',
        summary: 'List all roles',
        tags: ['SSO Roles'],
        security: [['sanctum' => []]],
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
    public function index(): JsonResponse
    {
        $roles = Role::withCount('permissions')
            ->orderBy('level', 'desc')
            ->get();

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
        $validated = $request->validate([
            'slug' => ['required', 'string', 'max:100', 'unique:roles,slug'],
            'name' => ['required', 'string', 'max:100'],
            'level' => ['required', 'integer', 'min:0', 'max:100'],
            'description' => ['nullable', 'string'],
        ]);

        $role = Role::create($validated);

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
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        responses: [
            new OA\Response(response: 200, description: 'Role details', content: new OA\JsonContent(ref: '#/components/schemas/Role')),
            new OA\Response(response: 404, description: 'Role not found'),
        ]
    )]
    public function show(int $id): JsonResponse
    {
        $role = Role::with('permissions')->findOrFail($id);

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
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
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
    public function update(Request $request, int $id): JsonResponse
    {
        $role = Role::findOrFail($id);

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
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        responses: [
            new OA\Response(response: 204, description: 'Role deleted'),
            new OA\Response(response: 404, description: 'Role not found'),
            new OA\Response(response: 422, description: 'Cannot delete system role'),
        ]
    )]
    public function destroy(int $id): JsonResponse
    {
        $role = Role::findOrFail($id);

        // Check if it's a system role
        $systemRoles = ['admin', 'manager', 'member'];
        if (in_array($role->slug, $systemRoles, true)) {
            return response()->json([
                'error' => 'CANNOT_DELETE_SYSTEM_ROLE',
                'message' => 'System roles cannot be deleted',
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
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
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
    public function permissions(int $id): JsonResponse
    {
        $role = Role::with('permissions')->findOrFail($id);

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
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
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
    public function syncPermissions(Request $request, int $id): JsonResponse
    {
        $role = Role::findOrFail($id);

        $validated = $request->validate([
            'permissions' => ['required', 'array'],
            'permissions.*' => ['required'],
        ]);

        // Handle both IDs and slugs
        $permissionIds = collect($validated['permissions'])->map(function ($item) {
            if (is_numeric($item)) {
                return (int) $item;
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
