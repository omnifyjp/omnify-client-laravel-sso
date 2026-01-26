<?php

namespace Omnify\SsoClient\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controller;
use Omnify\SsoClient\Http\Requests\Admin\UserAdminUpdateRequest;
use Omnify\SsoClient\Http\Resources\UserCacheResource;
use Omnify\SsoClient\Models\UserCache;
use OpenApi\Attributes as OA;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

#[OA\Tag(name: 'Admin - Users', description: 'User management endpoints (Admin only)')]
class UserAdminController extends Controller
{
    /**
     * Display a listing of users.
     */
    #[OA\Get(
        path: '/api/admin/sso/users',
        summary: 'List users',
        description: 'Paginated list with search and sorting. **Admin only.**',
        tags: ['Admin - Users'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(
                name: 'filter[search]',
                in: 'query',
                description: 'Partial match on: name, email',
                schema: new OA\Schema(type: 'string'),
                example: '田中'
            ),
            new OA\Parameter(
                name: 'filter[org_id]',
                in: 'query',
                description: 'Filter by organization ID (console_org_id)',
                schema: new OA\Schema(type: 'string'),
                example: '019be407-5b5f-72ed-99a6-7e6ddc5196ae'
            ),
            new OA\Parameter(
                name: 'page',
                in: 'query',
                description: 'Page number',
                schema: new OA\Schema(type: 'integer', default: 1)
            ),
            new OA\Parameter(
                name: 'per_page',
                in: 'query',
                description: 'Items per page',
                schema: new OA\Schema(type: 'integer', default: 10)
            ),
            new OA\Parameter(
                name: 'sort',
                in: 'query',
                description: 'Sort field. Prefix `-` for descending.',
                schema: new OA\Schema(
                    type: 'string',
                    enum: ['id', '-id', 'name', '-name', 'email', '-email', 'created_at', '-created_at']
                ),
                example: '-created_at'
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Paginated user list',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/UserCache')),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Forbidden'),
        ]
    )]
    public function index(): AnonymousResourceCollection
    {
        $users = QueryBuilder::for(UserCache::class)
            ->allowedFilters([
                AllowedFilter::callback('search', function ($query, $value) {
                    $query->where(function ($q) use ($value) {
                        $q->where('name', 'like', "%{$value}%")
                            ->orWhere('email', 'like', "%{$value}%");
                    });
                }),
                AllowedFilter::exact('org_id', 'console_org_id'),
            ])
            ->allowedSorts(['id', 'name', 'email', 'created_at', 'updated_at'])
            ->defaultSort('-id')
            ->paginate(request()->input('per_page', 10));

        return UserCacheResource::collection($users);
    }

    /**
     * Display the specified user.
     */
    #[OA\Get(
        path: '/api/admin/sso/users/{id}',
        summary: 'Get user',
        description: 'Get user by ID. **Admin only.**',
        tags: ['Admin - Users'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(
                name: 'id',
                in: 'path',
                required: true,
                schema: new OA\Schema(type: 'string', format: 'uuid')
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'User details',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'data', ref: '#/components/schemas/UserCache'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Forbidden'),
            new OA\Response(response: 404, description: 'Not Found'),
        ]
    )]
    public function show(UserCache $user): UserCacheResource
    {
        return new UserCacheResource($user);
    }

    /**
     * Update the specified user.
     */
    #[OA\Put(
        path: '/api/admin/sso/users/{id}',
        summary: 'Update user',
        description: 'Update user (partial update supported). **Admin only.**',
        tags: ['Admin - Users'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(
                name: 'id',
                in: 'path',
                required: true,
                schema: new OA\Schema(type: 'string', format: 'uuid')
            ),
        ],
        requestBody: new OA\RequestBody(
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'name', type: 'string', maxLength: 255),
                    new OA\Property(property: 'email', type: 'string', format: 'email', maxLength: 255),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'User updated',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'data', ref: '#/components/schemas/UserCache'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Forbidden'),
            new OA\Response(response: 404, description: 'Not Found'),
            new OA\Response(response: 422, description: 'Validation Error'),
        ]
    )]
    public function update(UserAdminUpdateRequest $request, UserCache $user): UserCacheResource
    {
        $user->update($request->validated());

        return new UserCacheResource($user);
    }

    /**
     * Remove the specified user.
     */
    #[OA\Delete(
        path: '/api/admin/sso/users/{id}',
        summary: 'Delete user',
        description: 'Permanently delete user. **Admin only.**',
        tags: ['Admin - Users'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(
                name: 'id',
                in: 'path',
                required: true,
                schema: new OA\Schema(type: 'string', format: 'uuid')
            ),
        ],
        responses: [
            new OA\Response(response: 204, description: 'No Content'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 403, description: 'Forbidden'),
            new OA\Response(response: 404, description: 'Not Found'),
        ]
    )]
    public function destroy(UserCache $user): JsonResponse
    {
        $user->delete();

        return response()->json(null, 204);
    }

    /**
     * Search users by email (autocomplete).
     */
    #[OA\Get(
        path: '/api/admin/sso/users/search',
        summary: 'Search users by email',
        description: 'Search users by email for autocomplete.',
        tags: ['Admin - Users'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(
                name: 'email',
                in: 'query',
                description: 'Email to search (partial match, min 2 chars)',
                required: true,
                schema: new OA\Schema(type: 'string', minLength: 2),
                example: 'john@'
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Matching users list',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/UserCache')),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Unauthenticated'),
        ]
    )]
    public function search(): AnonymousResourceCollection
    {
        $email = request()->input('email', '');
        $currentUserId = request()->user()?->id;

        if (strlen($email) < 2) {
            return UserCacheResource::collection(collect([]));
        }

        $query = UserCache::query()
            ->where('email', 'like', "%{$email}%")
            ->limit(10);

        // Exclude current user (self)
        if ($currentUserId) {
            $query->where('id', '!=', $currentUserId);
        }

        return UserCacheResource::collection($query->get());
    }

    /**
     * Get user permissions breakdown.
     *
     * Returns comprehensive permission breakdown showing:
     * - Role assignments with their permissions
     * - Team memberships with their permissions
     * - Aggregated final permissions
     */
    #[OA\Get(
        path: '/api/admin/sso/users/{user}/permissions',
        summary: 'Get user permissions breakdown',
        description: 'Get comprehensive breakdown of user permissions from roles and teams.',
        tags: ['Admin - Users'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(
                name: 'user',
                in: 'path',
                required: true,
                schema: new OA\Schema(type: 'string', format: 'uuid')
            ),
            new OA\Parameter(
                name: 'org_id',
                in: 'query',
                required: false,
                description: 'Organization ID (console_org_id) for context',
                schema: new OA\Schema(type: 'string')
            ),
            new OA\Parameter(
                name: 'branch_id',
                in: 'query',
                required: false,
                description: 'Branch ID (console_branch_id) for context',
                schema: new OA\Schema(type: 'string')
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'User permissions breakdown',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'user', type: 'object'),
                        new OA\Property(property: 'context', type: 'object', properties: [
                            new OA\Property(property: 'org_id', type: 'string', nullable: true),
                            new OA\Property(property: 'branch_id', type: 'string', nullable: true),
                        ]),
                        new OA\Property(property: 'role_assignments', type: 'array', items: new OA\Items(type: 'object')),
                        new OA\Property(property: 'team_memberships', type: 'array', items: new OA\Items(type: 'object')),
                        new OA\Property(property: 'aggregated_permissions', type: 'array', items: new OA\Items(type: 'string')),
                    ]
                )
            ),
            new OA\Response(response: 404, description: 'User not found'),
        ]
    )]
    public function permissions(UserCache $user): JsonResponse
    {
        // Get context from query params (not headers, to avoid conflict with auth middleware)
        $orgId = request()->query('org_id');
        $branchId = request()->query('branch_id');

        // Get user's primary organization
        $userOrg = null;
        if ($user->console_org_id) {
            $orgCache = \Omnify\SsoClient\Models\OrganizationCache::where('console_org_id', $user->console_org_id)->first();
            $userOrg = $orgCache ? [
                'id' => $orgCache->id,
                'console_org_id' => $orgCache->console_org_id,
                'name' => $orgCache->name,
                'code' => $orgCache->code,
            ] : null;
        }

        // Get role assignments with permissions for this context
        $rolesForContext = $user->getRolesForContext($orgId, $branchId);
        $roleAssignments = $rolesForContext->map(function ($role) {
            $orgName = null;
            $branchName = null;

            if ($role->pivot->console_org_id) {
                $org = \Omnify\SsoClient\Models\OrganizationCache::where('console_org_id', $role->pivot->console_org_id)->first();
                $orgName = $org?->name;
            }

            if ($role->pivot->console_branch_id) {
                $branch = \Omnify\SsoClient\Models\BranchCache::where('console_branch_id', $role->pivot->console_branch_id)->first();
                $branchName = $branch?->name;
            }

            return [
                'role' => [
                    'id' => $role->id,
                    'name' => $role->name,
                    'slug' => $role->slug,
                    'level' => $role->level,
                ],
                'scope' => $this->getScopeType(
                    $role->pivot->console_org_id ?? null,
                    $role->pivot->console_branch_id ?? null
                ),
                'console_org_id' => $role->pivot->console_org_id ?? null,
                'console_branch_id' => $role->pivot->console_branch_id ?? null,
                'org_name' => $orgName,
                'branch_name' => $branchName,
                'permissions' => $role->permissions->pluck('slug')->toArray(),
            ];
        });

        // Sort role assignments by scope: global first, then org-wide, then branch
        $sortedAssignments = $roleAssignments->sortBy(function ($assignment) {
            return match ($assignment['scope']) {
                'global' => 0,
                'org-wide' => 1,
                'branch' => 2,
                default => 3,
            };
        })->values();

        // Get team memberships with permissions (if org context)
        $teamMemberships = [];
        if ($orgId) {
            $teams = $user->getConsoleTeams($orgId);
            foreach ($teams as $team) {
                $teamCache = \Omnify\SsoClient\Models\TeamCache::where('console_team_id', $team['id'])->first();
                $teamMemberships[] = [
                    'team' => [
                        'id' => $team['id'],
                        'name' => $team['name'],
                        'path' => $team['path'] ?? null,
                    ],
                    'is_leader' => $team['is_leader'] ?? false,
                    'permissions' => $teamCache ? $teamCache->permissions->pluck('slug')->toArray() : [],
                ];
            }
        }

        // Get aggregated permissions
        $aggregatedPermissions = $user->getAllPermissions($orgId, $branchId);

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'console_org_id' => $user->console_org_id,
                'organization' => $userOrg,
            ],
            'context' => [
                'org_id' => $orgId,
                'branch_id' => $branchId,
            ],
            'role_assignments' => $sortedAssignments,
            'team_memberships' => $teamMemberships,
            'aggregated_permissions' => array_values($aggregatedPermissions),
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
