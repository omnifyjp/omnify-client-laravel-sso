<?php

declare(strict_types=1);

namespace Omnify\SsoClient\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Omnify\SsoClient\Http\Requests\AssignRoleRequest;
use Omnify\SsoClient\Http\Requests\RemoveRoleRequest;
use Omnify\SsoClient\Models\Role;
use Omnify\SsoClient\Models\UserCache;
use OpenApi\Attributes as OA;

/**
 * Controller for managing user role assignments with scope.
 *
 * Implements Branch-Level Permissions (Option B - Scoped Role Assignments)
 * following industry standards (NIST RBAC, WorkOS, Salesforce patterns).
 *
 * Role Assignment Scopes:
 * - Global: org_id=null, branch_id=null → Role applies everywhere
 * - Org-wide: org_id=X, branch_id=null → Role applies to all branches in org
 * - Branch: org_id=X, branch_id=Y → Role applies only to specific branch
 *
 * @see https://csrc.nist.gov/Projects/Role-Based-Access-Control NIST RBAC Standard
 * @see https://workos.com/blog/how-to-design-multi-tenant-rbac-saas WorkOS Multi-Tenant RBAC
 */
#[OA\Tag(name: 'SSO User Roles', description: 'User role assignment management with scope support')]
class UserRoleAdminController extends Controller
{
    /**
     * List user's role assignments with scope information.
     *
     * Returns all role assignments for a user, including:
     * - Global roles (org=null, branch=null)
     * - Org-wide roles (org=X, branch=null)
     * - Branch-specific roles (org=X, branch=Y)
     */
    #[OA\Get(
        path: '/api/admin/sso/users/{userId}/roles',
        summary: 'List user role assignments',
        description: 'Get all role assignments for a user with scope information (global, org-wide, branch-specific)',
        tags: ['SSO User Roles'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(
                name: 'userId',
                in: 'path',
                required: true,
                description: 'User UUID',
                schema: new OA\Schema(type: 'string', format: 'uuid')
            ),
            new OA\Parameter(
                name: 'X-Org-Id',
                in: 'header',
                required: true,
                description: 'Organization slug',
                schema: new OA\Schema(type: 'string')
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'User role assignments',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'data', type: 'array', items: new OA\Items(
                            properties: [
                                new OA\Property(property: 'id', type: 'string', format: 'uuid', description: 'Assignment ID'),
                                new OA\Property(property: 'role', type: 'object', properties: [
                                    new OA\Property(property: 'id', type: 'string', format: 'uuid'),
                                    new OA\Property(property: 'name', type: 'string'),
                                    new OA\Property(property: 'slug', type: 'string'),
                                    new OA\Property(property: 'level', type: 'integer'),
                                ]),
                                new OA\Property(property: 'console_org_id', type: 'string', nullable: true, description: 'null = global scope'),
                                new OA\Property(property: 'console_branch_id', type: 'string', nullable: true, description: 'null = org-wide scope'),
                                new OA\Property(property: 'scope', type: 'string', enum: ['global', 'org-wide', 'branch'], description: 'Computed scope type'),
                                new OA\Property(property: 'created_at', type: 'string', format: 'date-time'),
                            ]
                        )),
                    ]
                )
            ),
            new OA\Response(response: 404, description: 'User not found'),
        ]
    )]
    public function index(string $userId): JsonResponse
    {
        $user = UserCache::findOrFail($userId);

        $assignments = $user->getRoleAssignments()->map(function ($role) {
            return [
                'id' => $role->pivot->id ?? null,
                'role' => [
                    'id' => $role->id,
                    'name' => $role->name,
                    'slug' => $role->slug,
                    'level' => $role->level,
                ],
                'console_org_id' => $role->pivot->console_org_id,
                'console_branch_id' => $role->pivot->console_branch_id,
                'scope' => $this->getScopeType($role->pivot->console_org_id, $role->pivot->console_branch_id),
                'created_at' => $role->pivot->created_at?->toISOString(),
            ];
        });

        return response()->json([
            'data' => $assignments,
        ]);
    }

    /**
     * Assign a role to user with scope.
     *
     * Creates a new role assignment for the user with optional scope:
     * - No scope (global): Role applies everywhere
     * - Org scope: Role applies to all branches in organization
     * - Branch scope: Role applies only to specific branch
     */
    #[OA\Post(
        path: '/api/admin/sso/users/{userId}/roles',
        summary: 'Assign role to user with scope',
        description: 'Assign a role to user. Can be scoped to global, org-wide, or branch-specific.',
        tags: ['SSO User Roles'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(
                name: 'userId',
                in: 'path',
                required: true,
                description: 'User UUID',
                schema: new OA\Schema(type: 'string', format: 'uuid')
            ),
            new OA\Parameter(
                name: 'X-Org-Id',
                in: 'header',
                required: true,
                description: 'Organization slug',
                schema: new OA\Schema(type: 'string')
            ),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['role_id'],
                properties: [
                    new OA\Property(property: 'role_id', type: 'string', format: 'uuid', description: 'Role UUID to assign'),
                    new OA\Property(property: 'console_org_id', type: 'string', format: 'uuid', nullable: true, description: 'Organization ID for scoping. null = global assignment.'),
                    new OA\Property(property: 'console_branch_id', type: 'string', format: 'uuid', nullable: true, description: 'Branch ID for scoping. null = org-wide assignment.'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Role assigned successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string'),
                        new OA\Property(property: 'data', type: 'object', properties: [
                            new OA\Property(property: 'role', type: 'object'),
                            new OA\Property(property: 'console_org_id', type: 'string', nullable: true),
                            new OA\Property(property: 'console_branch_id', type: 'string', nullable: true),
                            new OA\Property(property: 'scope', type: 'string'),
                        ]),
                    ]
                )
            ),
            new OA\Response(response: 404, description: 'User or role not found'),
            new OA\Response(response: 422, description: 'Validation error or duplicate assignment'),
        ]
    )]
    public function store(AssignRoleRequest $request, string $userId): JsonResponse
    {
        $user = UserCache::findOrFail($userId);
        $role = $request->getRole();

        $orgId = $request->validated('console_org_id');
        $branchId = $request->validated('console_branch_id');

        // Check if assignment already exists (handle NULL values properly)
        $query = $user->roles()->where('roles.id', $role->id);

        if ($orgId === null) {
            $query->wherePivotNull('console_org_id');
        } else {
            $query->wherePivot('console_org_id', $orgId);
        }

        if ($branchId === null) {
            $query->wherePivotNull('console_branch_id');
        } else {
            $query->wherePivot('console_branch_id', $branchId);
        }

        if ($query->exists()) {
            return response()->json([
                'error' => 'DUPLICATE_ASSIGNMENT',
                'message' => 'This role assignment already exists with the same scope',
            ], 422);
        }

        // Assign role with scope
        $user->assignRole($role, $orgId, $branchId);

        return response()->json([
            'message' => 'Role assigned successfully',
            'data' => [
                'role' => [
                    'id' => $role->id,
                    'name' => $role->name,
                    'slug' => $role->slug,
                    'level' => $role->level,
                ],
                'console_org_id' => $orgId,
                'console_branch_id' => $branchId,
                'scope' => $request->getScopeType(),
            ],
        ], 201);
    }

    /**
     * Remove a role assignment from user.
     *
     * Removes a specific role assignment with matching scope.
     * Must specify the exact scope to remove the correct assignment.
     */
    #[OA\Delete(
        path: '/api/admin/sso/users/{userId}/roles/{roleId}',
        summary: 'Remove role assignment from user',
        description: 'Remove a specific role assignment. Must specify the exact scope (org_id, branch_id) to remove.',
        tags: ['SSO User Roles'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(
                name: 'userId',
                in: 'path',
                required: true,
                description: 'User UUID',
                schema: new OA\Schema(type: 'string', format: 'uuid')
            ),
            new OA\Parameter(
                name: 'roleId',
                in: 'path',
                required: true,
                description: 'Role UUID to remove',
                schema: new OA\Schema(type: 'string', format: 'uuid')
            ),
            new OA\Parameter(
                name: 'X-Org-Id',
                in: 'header',
                required: true,
                description: 'Organization slug',
                schema: new OA\Schema(type: 'string')
            ),
        ],
        requestBody: new OA\RequestBody(
            required: false,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'console_org_id', type: 'string', format: 'uuid', nullable: true, description: 'Organization ID of the assignment to remove. null = global.'),
                    new OA\Property(property: 'console_branch_id', type: 'string', format: 'uuid', nullable: true, description: 'Branch ID of the assignment to remove. null = org-wide.'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Role assignment removed',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string'),
                        new OA\Property(property: 'removed', type: 'integer', description: 'Number of assignments removed'),
                    ]
                )
            ),
            new OA\Response(response: 404, description: 'User or role not found'),
        ]
    )]
    public function destroy(RemoveRoleRequest $request, string $userId, string $roleId): JsonResponse
    {
        $user = UserCache::findOrFail($userId);
        $role = Role::findOrFail($roleId);

        $orgId = $request->validated('console_org_id');
        $branchId = $request->validated('console_branch_id');

        $removed = $user->removeRole($role, $orgId, $branchId);

        return response()->json([
            'message' => $removed > 0 ? 'Role assignment removed successfully' : 'No matching assignment found',
            'removed' => $removed,
        ]);
    }

    /**
     * Sync roles for user in a specific scope.
     *
     * Replaces all role assignments in the specified scope with the given roles.
     * Other scopes are not affected.
     */
    #[OA\Put(
        path: '/api/admin/sso/users/{userId}/roles/sync',
        summary: 'Sync roles for user in scope',
        description: 'Replace all role assignments in the specified scope. Other scopes are not affected.',
        tags: ['SSO User Roles'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(
                name: 'userId',
                in: 'path',
                required: true,
                description: 'User UUID',
                schema: new OA\Schema(type: 'string', format: 'uuid')
            ),
            new OA\Parameter(
                name: 'X-Org-Id',
                in: 'header',
                required: true,
                description: 'Organization slug',
                schema: new OA\Schema(type: 'string')
            ),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['roles'],
                properties: [
                    new OA\Property(property: 'roles', type: 'array', items: new OA\Items(type: 'string', format: 'uuid'), description: 'Role UUIDs or slugs to sync'),
                    new OA\Property(property: 'console_org_id', type: 'string', format: 'uuid', nullable: true, description: 'Organization ID for scope. null = global.'),
                    new OA\Property(property: 'console_branch_id', type: 'string', format: 'uuid', nullable: true, description: 'Branch ID for scope. null = org-wide.'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Roles synced successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string'),
                        new OA\Property(property: 'attached', type: 'array', items: new OA\Items(type: 'string')),
                        new OA\Property(property: 'detached', type: 'array', items: new OA\Items(type: 'string')),
                    ]
                )
            ),
            new OA\Response(response: 404, description: 'User not found'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function sync(\Illuminate\Http\Request $request, string $userId): JsonResponse
    {
        $validated = $request->validate([
            'roles' => ['required', 'array'],
            'roles.*' => ['required', 'string'],
            'console_org_id' => ['nullable', 'string', 'max:36'],
            'console_branch_id' => ['nullable', 'string', 'max:36'],
        ]);

        $user = UserCache::findOrFail($userId);

        $orgId = $validated['console_org_id'] ?? null;
        $branchId = $validated['console_branch_id'] ?? null;

        // Validate branch without org
        if ($branchId !== null && $orgId === null) {
            return response()->json([
                'error' => 'INVALID_SCOPE',
                'message' => 'console_branch_id requires console_org_id to be set',
            ], 422);
        }

        // Resolve roles (can be UUIDs or slugs)
        $roles = collect($validated['roles'])->map(function ($roleIdOrSlug) {
            $role = Role::where('id', $roleIdOrSlug)
                ->orWhere('slug', $roleIdOrSlug)
                ->first();

            if (! $role) {
                throw new \InvalidArgumentException("Role '{$roleIdOrSlug}' not found.");
            }

            return $role;
        });

        $result = $user->syncRolesInScope($roles->all(), $orgId, $branchId);

        return response()->json([
            'message' => 'Roles synced successfully',
            'attached' => array_values($result['attached']),
            'detached' => array_values($result['detached']),
            'scope' => $this->getScopeType($orgId, $branchId),
        ]);
    }

    /**
     * Get scope type from org_id and branch_id.
     */
    private function getScopeType(?string $orgId, ?string $branchId): string
    {
        if ($orgId === null) {
            return 'global';
        }

        if ($branchId === null) {
            return 'org-wide';
        }

        return 'branch';
    }
}
