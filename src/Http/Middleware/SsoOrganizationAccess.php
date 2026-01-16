<?php

declare(strict_types=1);

namespace Omnify\SsoClient\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Omnify\SsoClient\Services\OrgAccessService;
use Symfony\Component\HttpFoundation\Response;

class SsoOrganizationAccess
{
    public function __construct(
        private readonly OrgAccessService $orgAccessService
    ) {}

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Get organization from header
        $orgSlug = $request->header('X-Org-Id');

        if (! $orgSlug) {
            return response()->json([
                'error' => 'MISSING_ORGANIZATION',
                'message' => 'X-Org-Id header is required',
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
        $access = $this->orgAccessService->checkAccess($user, $orgSlug);

        if (! $access) {
            return response()->json([
                'error' => 'ACCESS_DENIED',
                'message' => 'No access to this organization',
            ], 403);
        }

        // Set organization info on request attributes
        $request->attributes->set('orgId', $access['organization_id']);
        $request->attributes->set('orgSlug', $access['organization_slug']);
        $request->attributes->set('orgRole', $access['org_role']);
        $request->attributes->set('serviceRole', $access['service_role']);
        $request->attributes->set('serviceRoleLevel', $access['service_role_level']);

        // Also set as request properties for convenience
        $request->merge([
            '_org_id' => $access['organization_id'],
            '_org_slug' => $access['organization_slug'],
        ]);

        return $next($request);
    }
}
