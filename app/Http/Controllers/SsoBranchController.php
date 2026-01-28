<?php

declare(strict_types=1);

namespace Omnify\SsoClient\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Omnify\SsoClient\Models\BranchCache;
use Omnify\SsoClient\Models\OrganizationCache;
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

        // Get current organization ID from request or user's default
        $orgId = $request->query('organization_id', $user->sso_current_org_id ?? null);

        if (! $orgId) {
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
        $result = $this->consoleApi->getUserBranches($accessToken, $orgId);

        if ($result === null) {
            return response()->json([
                'error' => 'BRANCHES_ERROR',
                'message' => 'Failed to fetch branches',
            ], 500);
        }

        // Auto-cache organization and branches
        $this->cacheOrganizationAndBranches($result);

        return response()->json($result);
    }

    /**
     * Auto-cache organization and branches from Console response.
     *
     * @param  array{organization?: array{id: int|string, slug: string, name: string}, branches?: array<array{id: int|string, code: string, name: string, is_headquarters: bool}>}  $result
     */
    private function cacheOrganizationAndBranches(array $result): void
    {
        // Cache organization
        if (isset($result['organization']) && is_array($result['organization'])) {
            $org = $result['organization'];
            $consoleOrgId = (string) ($org['id'] ?? '');

            if ($consoleOrgId) {
                OrganizationCache::updateOrCreate(
                    ['console_org_id' => $consoleOrgId],
                    [
                        'name' => $org['name'] ?? 'Unknown',
                        'code' => $org['slug'] ?? $consoleOrgId,
                        'is_active' => true,
                    ]
                );
            }
        }

        // Cache branches
        if (isset($result['branches']) && is_array($result['branches'])) {
            $consoleOrgId = (string) ($result['organization']['id'] ?? '');

            foreach ($result['branches'] as $branch) {
                $consoleBranchId = (string) ($branch['id'] ?? '');

                if ($consoleBranchId && $consoleOrgId) {
                    BranchCache::updateOrCreate(
                        ['console_branch_id' => $consoleBranchId],
                        [
                            'console_org_id' => $consoleOrgId,
                            'code' => $branch['code'] ?? 'DEFAULT',
                            'name' => $branch['name'] ?? 'Unknown',
                            'is_headquarters' => $branch['is_headquarters'] ?? false,
                            'is_active' => true,
                        ]
                    );
                }
            }
        }
    }
}
