<?php

use Illuminate\Support\Facades\Route;
use Omnify\SsoClient\Http\Controllers\AccessPageController;

/*
|--------------------------------------------------------------------------
| Access Management Routes (IAM-style)
|--------------------------------------------------------------------------
|
| Routes for managing users, roles, teams, and permissions.
| These routes are loaded by the SsoClientServiceProvider.
|
*/

$accessPrefix = config('sso-client.routes.access_prefix', 'admin/iam');
$accessMiddleware = config('sso-client.routes.access_middleware', ['web', 'sso.auth']);

Route::prefix($accessPrefix)
    ->name('access.')
    ->middleware($accessMiddleware)
    ->group(function () {
        // Users
        Route::get('/users', [AccessPageController::class, 'users'])->name('users');
        Route::get('/users/{userId}', [AccessPageController::class, 'userShow'])->name('users.show');

        // Roles
        Route::get('/roles', [AccessPageController::class, 'roles'])->name('roles');
        Route::get('/roles/{roleId}', [AccessPageController::class, 'roleShow'])->name('roles.show');

        // Teams
        Route::get('/teams', [AccessPageController::class, 'teams'])->name('teams');

        // Permissions
        Route::get('/permissions', [AccessPageController::class, 'permissions'])->name('permissions');
    });
