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
}
