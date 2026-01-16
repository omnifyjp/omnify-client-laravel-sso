<?php

declare(strict_types=1);

namespace Omnify\SsoClient\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SsoRoleCheck
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(Request): Response  $next
     * @param  string  $role  Required role name
     */
    public function handle(Request $request, Closure $next, string $role): Response
    {
        $userRole = $request->attributes->get('serviceRole');

        if (! $userRole) {
            return response()->json([
                'error' => 'NO_SERVICE_ROLE',
                'message' => 'User does not have a service role',
            ], 403);
        }

        // Get role levels from config
        $roleLevels = config('sso-client.role_levels', [
            'admin' => 100,
            'manager' => 50,
            'member' => 10,
        ]);

        $requiredLevel = $roleLevels[$role] ?? 0;
        $userLevel = $roleLevels[$userRole] ?? 0;

        if ($userLevel < $requiredLevel) {
            return response()->json([
                'error' => 'INSUFFICIENT_ROLE',
                'message' => "Role '{$role}' or higher is required",
                'required_role' => $role,
                'current_role' => $userRole,
            ], 403);
        }

        return $next($request);
    }
}
