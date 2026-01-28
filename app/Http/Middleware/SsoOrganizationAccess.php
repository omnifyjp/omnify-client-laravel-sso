<?php

declare(strict_types=1);

namespace Omnify\SsoClient\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Omnify\SsoClient\Models\BranchCache;
use Omnify\SsoClient\Models\OrganizationCache;
use Omnify\SsoClient\Services\OrgAccessService;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware for organization and branch context.
 *
 * Sets organization and branch context from headers:
 * - X-Organization-Id (required): Organization slug
 * - X-Branch-Id (optional): Branch UUID for branch-specific operations
 *
 * Branch context enables branch-level permissions (Option B - Scoped Role Assignments).
 *
 * @see https://workos.com/blog/how-to-design-multi-tenant-rbac-saas Multi-Tenant RBAC
 */
class SsoOrganizationAccess
{
    public function __construct(
        private readonly OrgAccessService $orgAccessService
    ) {}

    /**
     * Handle an incoming request.
     *
     * Sets request attributes and session for org/branch context:
     * - orgId, orgId, orgRole, serviceRole, serviceRoleLevel (from Console)
     * - branchId (from X-Branch-Id header, validated against organization)
     *
     * @param  \Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Get organization from header
        $orgId = $request->header('X-Organization-Id');

        if (! $orgId) {
            return response()->json([
                'error' => 'MISSING_ORGANIZATION',
                'message' => 'X-Organization-Id header is required',
            ], 400);
        }

        $user = $request->user();

        if (! $user) {
            return response()->json([
                'error' => 'UNAUTHENTICATED',
                'message' => 'Authentication required',
            ], 401);
        }

        // Check organization access
        $access = $this->orgAccessService->checkAccess($user, $orgId);

        if (! $access) {
            return response()->json([
                'error' => 'ACCESS_DENIED',
                'message' => 'No access to this organization',
            ], 403);
        }

        $orgId = $access['organization_id'];

        // Auto-cache organization to database
        OrganizationCache::updateOrCreate(
            ['console_org_id' => $orgId],
            [
                'name' => $access['organization_name'] ?? $access['organization_slug'],
                'code' => $access['organization_slug'],
                'is_active' => true,
            ]
        );

        // Set organization info on request attributes
        $request->attributes->set('orgId', $orgId);
        $request->attributes->set('orgSlug', $access['organization_slug']);
        $request->attributes->set('orgRole', $access['org_role']);
        $request->attributes->set('serviceRole', $access['service_role']);
        $request->attributes->set('serviceRoleLevel', $access['service_role_level']);

        // Store in session for later use
        session([
            'current_org_id' => $orgId,
            'current_org_slug' => $access['organization_slug'],
            'service_role' => $access['service_role'],
        ]);

        // =====================================================================
        // BRANCH CONTEXT (Branch-Level Permissions - Option B)
        // =====================================================================
        $branchId = $request->header('X-Branch-Id');

        if ($branchId) {
            // Validate branch ID format (should be UUID)
            if (! $this->isValidUuid($branchId)) {
                return response()->json([
                    'error' => 'INVALID_BRANCH_ID',
                    'message' => 'X-Branch-Id must be a valid UUID',
                ], 400);
            }

            // Validate branch belongs to this organization
            $branch = BranchCache::where('console_branch_id', $branchId)
                ->where('console_org_id', $orgId)
                ->first();

            if (! $branch) {
                return response()->json([
                    'error' => 'INVALID_BRANCH',
                    'message' => 'Branch not found or does not belong to this organization',
                ], 400);
            }

            // Set branch context
            $request->attributes->set('branchId', $branchId);
            $request->attributes->set('branch', $branch);

            session([
                'current_branch_id' => $branchId,
                'current_branch_code' => $branch->code,
                'current_branch_name' => $branch->name,
            ]);
        } else {
            // Clear branch context (org-wide operations)
            $request->attributes->set('branchId', null);
            $request->attributes->set('branch', null);

            session([
                'current_branch_id' => null,
                'current_branch_code' => null,
                'current_branch_name' => null,
            ]);
        }

        // Also set as request properties for convenience
        $request->merge([
            '_org_id' => $orgId,
            '_org_slug' => $access['organization_slug'],
            '_branch_id' => $branchId,
        ]);

        return $next($request);
    }

    /**
     * Validate UUID format.
     */
    private function isValidUuid(string $value): bool
    {
        return preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $value) === 1;
    }
}
