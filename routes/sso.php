<?php

use Illuminate\Support\Facades\Route;
use Omnify\SsoClient\Http\Controllers\Admin\PermissionAdminController;
use Omnify\SsoClient\Http\Controllers\Admin\RoleAdminController;
use Omnify\SsoClient\Http\Controllers\Admin\TeamPermissionAdminController;
use Omnify\SsoClient\Http\Controllers\SsoBranchController;
use Omnify\SsoClient\Http\Controllers\SsoCallbackController;
use Omnify\SsoClient\Http\Controllers\SsoReadOnlyController;
use Omnify\SsoClient\Http\Controllers\SsoTokenController;

/*
|--------------------------------------------------------------------------
| SSO Routes
|--------------------------------------------------------------------------
|
| These routes are loaded by the SsoClientServiceProvider.
|
*/

$prefix = config('sso-client.routes.prefix', 'api/sso');
$middleware = config('sso-client.routes.middleware', ['api']);
$adminPrefix = config('sso-client.routes.admin_prefix', 'api/admin/sso');
$adminMiddleware = config('sso-client.routes.admin_middleware', ['api', 'sso.auth', 'sso.org', 'sso.role:admin']);

// SSO Callback Route (with Sanctum stateful for session cookie)
// コールバックでセッションCookieを設定するため、Sanctum statefulが必要
Route::prefix($prefix)
    ->middleware($middleware)
    ->group(function () {
        Route::post('/callback', [SsoCallbackController::class, 'callback']);
    });

// SSO Auth Routes (with Sanctum stateful for SPA)
Route::prefix($prefix)
    ->middleware($middleware)
    ->group(function () {
        // Authenticated routes
        Route::middleware('sso.auth')->group(function () {
            Route::post('/logout', [SsoCallbackController::class, 'logout']);
            Route::get('/user', [SsoCallbackController::class, 'user']);
            Route::get('/global-logout-url', [SsoCallbackController::class, 'globalLogoutUrl']);

            // Token management (for mobile apps)
            Route::get('/tokens', [SsoTokenController::class, 'index']);
            Route::delete('/tokens/{tokenId}', [SsoTokenController::class, 'destroy']);
            Route::post('/tokens/revoke-others', [SsoTokenController::class, 'revokeOthers']);

            // Read-only access to roles and permissions (for dashboard display)
            // No org/admin requirements - just authenticated users
            Route::get('/roles', [SsoReadOnlyController::class, 'roles']);
            Route::get('/roles/{id}', [SsoReadOnlyController::class, 'role']);
            Route::get('/permissions', [SsoReadOnlyController::class, 'permissions']);
            Route::get('/permission-matrix', [SsoReadOnlyController::class, 'permissionMatrix']);

            // Branches - proxy from console
            Route::get('/branches', [SsoBranchController::class, 'index']);
        });
    });

// Admin Routes
Route::prefix($adminPrefix)
    ->middleware($adminMiddleware)
    ->group(function () {
        // Roles
        Route::apiResource('roles', RoleAdminController::class);
        Route::get('roles/{role}/permissions', [RoleAdminController::class, 'permissions']);
        Route::put('roles/{role}/permissions', [RoleAdminController::class, 'syncPermissions']);

        // Permissions
        Route::apiResource('permissions', PermissionAdminController::class);
        Route::get('permission-matrix', [PermissionAdminController::class, 'matrix']);

        // Team Permissions
        Route::get('teams/permissions', [TeamPermissionAdminController::class, 'index']);
        Route::get('teams/{teamId}/permissions', [TeamPermissionAdminController::class, 'show']);
        Route::put('teams/{teamId}/permissions', [TeamPermissionAdminController::class, 'sync']);
        Route::delete('teams/{teamId}/permissions', [TeamPermissionAdminController::class, 'destroy']);

        // Orphaned Team Permissions
        Route::get('teams/orphaned', [TeamPermissionAdminController::class, 'orphaned']);
        Route::post('teams/orphaned/{teamId}/restore', [TeamPermissionAdminController::class, 'restore']);
        Route::delete('teams/orphaned', [TeamPermissionAdminController::class, 'cleanupOrphaned']);
    });
