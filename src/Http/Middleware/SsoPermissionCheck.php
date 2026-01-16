<?php

declare(strict_types=1);

namespace Omnify\SsoClient\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SsoPermissionCheck
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(Request): Response  $next
     * @param  string  $permissions  Permission(s) required (pipe-separated for OR logic)
     */
    public function handle(Request $request, Closure $next, string $permissions): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'error' => 'UNAUTHENTICATED',
                'message' => 'Authentication required',
            ], 401);
        }

        // Check if user model has hasPermission method
        if (! method_exists($user, 'hasPermission') && ! method_exists($user, 'hasAnyPermission')) {
            return response()->json([
                'error' => 'CONFIGURATION_ERROR',
                'message' => 'User model does not support permission checking',
            ], 500);
        }

        $orgId = $request->attributes->get('orgId');

        // Parse permissions (pipe-separated for OR logic)
        $permissionList = explode('|', $permissions);

        // Check if user has any of the required permissions
        $hasPermission = false;

        if (method_exists($user, 'hasAnyPermission')) {
            $hasPermission = $user->hasAnyPermission($permissionList, $orgId);
        } else {
            foreach ($permissionList as $permission) {
                if ($user->hasPermission(trim($permission), $orgId)) {
                    $hasPermission = true;
                    break;
                }
            }
        }

        if (! $hasPermission) {
            return response()->json([
                'error' => 'PERMISSION_DENIED',
                'message' => 'Required permission not granted',
                'required_permissions' => $permissionList,
            ], 403);
        }

        return $next($request);
    }
}
