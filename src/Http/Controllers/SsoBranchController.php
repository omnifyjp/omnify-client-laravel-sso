<?php

declare(strict_types=1);

namespace Omnify\SsoClient\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Omnify\SsoClient\Services\ConsoleApiService;
use Omnify\SsoClient\Services\ConsoleTokenService;
use OpenApi\Attributes as OA;

/**
 * Branch controller - Proxy branches from Console.
 */
#[OA\Tag(name: 'SSO Branches', description: 'Branch access for authenticated users')]
class SsoBranchController extends Controller
{
    public function __construct(
        private readonly ConsoleApiService $consoleApi,
        private readonly ConsoleTokenService $tokenService
    ) {}

    /**
     * Get branches for current user in the selected organization.
     */
    #[OA\Get(
        path: '/api/sso/branches',
        summary: 'Get user branches in organization',
        description: 'Get all branches the authenticated user can access in the current organization.',
        tags: ['SSO Branches'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(
                name: 'organization_slug',
                in: 'query',
                required: false,
                description: 'Organization slug (defaults to current org)',
                schema: new OA\Schema(type: 'string')
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Branches list',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'all_branches_access', type: 'boolean', description: 'User has access to all branches'),
                        new OA\Property(
                            property: 'branches',
                            type: 'array',
                            items: new OA\Items(
                                properties: [
                                    new OA\Property(property: 'id', type: 'integer'),
                                    new OA\Property(property: 'code', type: 'string'),
                                    new OA\Property(property: 'name', type: 'string'),
                                    new OA\Property(property: 'is_headquarters', type: 'boolean'),
                                    new OA\Property(property: 'is_primary', type: 'boolean'),
                                    new OA\Property(property: 'is_assigned', type: 'boolean'),
                                    new OA\Property(property: 'access_type', type: 'string', enum: ['explicit', 'implicit']),
                                    new OA\Property(property: 'timezone', type: 'string', nullable: true),
                                    new OA\Property(property: 'currency', type: 'string', nullable: true),
                                    new OA\Property(property: 'locale', type: 'string', nullable: true),
                                ]
                            )
                        ),
                        new OA\Property(property: 'primary_branch_id', type: 'integer', nullable: true),
                        new OA\Property(
                            property: 'organization',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'id', type: 'integer'),
                                new OA\Property(property: 'slug', type: 'string'),
                                new OA\Property(property: 'name', type: 'string'),
                            ]
                        ),
                    ]
                )
            ),
            new OA\Response(response: 400, description: 'No organization selected'),
            new OA\Response(response: 401, description: 'Unauthenticated'),
            new OA\Response(response: 500, description: 'Failed to fetch branches'),
        ]
    )]
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'error' => 'UNAUTHENTICATED',
                'message' => 'User not authenticated',
            ], 401);
        }

        // Get current organization slug from request or user's default
        $orgSlug = $request->query('organization_slug', $user->sso_current_org_slug ?? null);

        if (! $orgSlug) {
            return response()->json([
                'error' => 'NO_ORGANIZATION',
                'message' => 'No organization selected',
            ], 400);
        }

        // Get access token for console API
        $accessToken = $this->tokenService->getAccessToken($user);

        if (! $accessToken) {
            return response()->json([
                'error' => 'NO_TOKEN',
                'message' => 'No valid access token',
            ], 401);
        }

        // Fetch branches from console
        $result = $this->consoleApi->getUserBranches($accessToken, $orgSlug);

        if ($result === null) {
            return response()->json([
                'error' => 'BRANCHES_ERROR',
                'message' => 'Failed to fetch branches',
            ], 500);
        }

        return response()->json($result);
    }
}
