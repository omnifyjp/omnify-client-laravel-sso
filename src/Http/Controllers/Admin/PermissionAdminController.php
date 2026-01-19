<?php

declare(strict_types=1);

namespace Omnify\SsoClient\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Omnify\SsoClient\Models\Permission;
use Omnify\SsoClient\Models\Role;
use OpenApi\Attributes as OA;

#[OA\Tag(name: 'SSO Permissions', description: 'Permission management endpoints')]
class PermissionAdminController extends Controller
{
    /**
     * List all permissions.
     */
    #[OA\Get(
        path: '/api/admin/sso/permissions',
        summary: 'List all permissions',
        tags: ['SSO Permissions'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(name: 'group', in: 'query', schema: new OA\Schema(type: 'string'), description: 'Filter by group'),
            new OA\Parameter(name: 'search', in: 'query', schema: new OA\Schema(type: 'string'), description: 'Search by slug or name'),
            new OA\Parameter(name: 'grouped', in: 'query', schema: new OA\Schema(type: 'boolean'), description: 'Return grouped by group'),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Permissions list',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/Permission')),
                        new OA\Property(property: 'groups', type: 'array', items: new OA\Items(type: 'string')),
                    ]
                )
            ),
        ]
    )]
    public function index(Request $request): JsonResponse
    {
        $query = Permission::withCount('roles');

        // Filter by group
        if ($request->has('group')) {
            $query->where('group', $request->query('group'));
        }

        // Search
        if ($request->has('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('slug', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%");
            });
        }

        // Check if grouped response is requested
        if ($request->boolean('grouped')) {
            $permissions = $query->orderBy('group')->orderBy('slug')->get();

            $grouped = $permissions->groupBy('group')->map(fn ($items) => $items->values());

            return response()->json($grouped);
        }

        $permissions = $query->orderBy('group')->orderBy('slug')->get();

        // Get unique groups
        $groups = Permission::distinct()->pluck('group')->filter()->values();

        return response()->json([
            'data' => $permissions,
            'groups' => $groups,
        ]);
    }

    /**
     * Create a new permission.
     */
    #[OA\Post(
        path: '/api/admin/sso/permissions',
        summary: 'Create a new permission',
        tags: ['SSO Permissions'],
        security: [['sanctum' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['slug', 'name'],
                properties: [
                    new OA\Property(property: 'slug', type: 'string', maxLength: 100, example: 'reports.export'),
                    new OA\Property(property: 'name', type: 'string', maxLength: 100, example: 'Export Reports'),
                    new OA\Property(property: 'group', type: 'string', maxLength: 50, nullable: true, example: 'reports'),
                    new OA\Property(property: 'description', type: 'string', nullable: true),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Permission created', content: new OA\JsonContent(ref: '#/components/schemas/Permission')),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'slug' => ['required', 'string', 'max:100', 'unique:permissions,slug'],
            'name' => ['required', 'string', 'max:100'],
            'group' => ['nullable', 'string', 'max:50'],
            'description' => ['nullable', 'string'],
        ]);

        $permission = Permission::create($validated);

        return response()->json([
            'data' => $permission,
            'message' => 'Permission created successfully',
        ], 201);
    }

    /**
     * Get a specific permission.
     */
    #[OA\Get(
        path: '/api/admin/sso/permissions/{id}',
        summary: 'Get a specific permission',
        tags: ['SSO Permissions'],
        security: [['sanctum' => []]],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid'))],
        responses: [
            new OA\Response(response: 200, description: 'Permission details', content: new OA\JsonContent(ref: '#/components/schemas/Permission')),
            new OA\Response(response: 404, description: 'Permission not found'),
        ]
    )]
    public function show(string $id): JsonResponse
    {
        $permission = Permission::with('roles')->findOrFail($id);

        return response()->json([
            'data' => $permission,
        ]);
    }

    /**
     * Update a permission.
     */
    #[OA\Put(
        path: '/api/admin/sso/permissions/{id}',
        summary: 'Update a permission',
        tags: ['SSO Permissions'],
        security: [['sanctum' => []]],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid'))],
        requestBody: new OA\RequestBody(
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'name', type: 'string', maxLength: 100),
                    new OA\Property(property: 'group', type: 'string', maxLength: 50, nullable: true),
                    new OA\Property(property: 'description', type: 'string', nullable: true),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Permission updated', content: new OA\JsonContent(ref: '#/components/schemas/Permission')),
            new OA\Response(response: 404, description: 'Permission not found'),
        ]
    )]
    public function update(Request $request, string $id): JsonResponse
    {
        $permission = Permission::findOrFail($id);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:100'],
            'group' => ['nullable', 'string', 'max:50'],
            'description' => ['nullable', 'string'],
        ]);

        // Slug cannot be changed
        unset($validated['slug']);

        $permission->update($validated);

        return response()->json([
            'data' => $permission->fresh(),
            'message' => 'Permission updated successfully',
        ]);
    }

    /**
     * Delete a permission.
     */
    #[OA\Delete(
        path: '/api/admin/sso/permissions/{id}',
        summary: 'Delete a permission',
        tags: ['SSO Permissions'],
        security: [['sanctum' => []]],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'string', format: 'uuid'))],
        responses: [
            new OA\Response(response: 204, description: 'Permission deleted'),
            new OA\Response(response: 404, description: 'Permission not found'),
        ]
    )]
    public function destroy(string $id): JsonResponse
    {
        $permission = Permission::findOrFail($id);

        // This will automatically detach from all roles due to cascade
        $permission->delete();

        return response()->json(null, 204);
    }

    /**
     * Get permission matrix (roles x permissions).
     */
    #[OA\Get(
        path: '/api/admin/sso/permission-matrix',
        summary: 'Get permission matrix',
        description: 'Returns a matrix of roles and their assigned permissions',
        tags: ['SSO Permissions'],
        security: [['sanctum' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Permission matrix',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'roles', type: 'array', items: new OA\Items(ref: '#/components/schemas/Role')),
                        new OA\Property(property: 'permissions', type: 'object', additionalProperties: new OA\AdditionalProperties(type: 'array', items: new OA\Items(type: 'object'))),
                        new OA\Property(property: 'matrix', type: 'object', additionalProperties: new OA\AdditionalProperties(type: 'array', items: new OA\Items(type: 'string'))),
                    ]
                )
            ),
        ]
    )]
    public function matrix(): JsonResponse
    {
        $roles = Role::orderBy('level', 'desc')->get(['id', 'slug', 'name']);

        $permissions = Permission::orderBy('group')
            ->orderBy('slug')
            ->get()
            ->groupBy('group')
            ->map(fn ($items) => $items->map(fn ($p) => [
                'id' => $p->id,
                'slug' => $p->slug,
                'name' => $p->name,
            ])->values());

        // Build matrix
        $matrix = [];
        foreach ($roles as $role) {
            $rolePermissions = $role->permissions()->pluck('slug')->toArray();
            $matrix[$role->slug] = $rolePermissions;
        }

        return response()->json([
            'roles' => $roles,
            'permissions' => $permissions,
            'matrix' => $matrix,
        ]);
    }
}
