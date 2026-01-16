<?php

/**
 * SSO Role Check Middleware Tests
 *
 * ロールチェックミドルウェアのテスト
 */

use Illuminate\Support\Facades\Route;
use Omnify\SsoClient\Services\OrgAccessService;
use Omnify\SsoClient\Tests\Fixtures\Models\User;

beforeEach(function () {
    // ロールレベル設定
    config(['sso-client.role_levels' => [
        'admin' => 100,
        'manager' => 50,
        'member' => 10,
    ]]);

    // テスト用のルートを定義 - admin権限が必要
    Route::middleware(['sso.auth', 'sso.org', 'sso.role:admin'])
        ->get('/test-admin-only', function () {
            return response()->json(['message' => 'admin access granted']);
        });

    // manager以上が必要
    Route::middleware(['sso.auth', 'sso.org', 'sso.role:manager'])
        ->get('/test-manager-only', function () {
            return response()->json(['message' => 'manager access granted']);
        });

    // member以上が必要
    Route::middleware(['sso.auth', 'sso.org', 'sso.role:member'])
        ->get('/test-member-only', function () {
            return response()->json(['message' => 'member access granted']);
        });
});

test('sso.role:admin rejects users without service role', function () {
    $user = User::factory()->create();

    // 組織アクセスはあるがサービスロールがない
    $orgAccessService = \Mockery::mock(OrgAccessService::class);
    $orgAccessService->shouldReceive('checkAccess')
        ->andReturn([
            'organization_id' => 1,
            'organization_slug' => 'test-org',
            'org_role' => 'member',
            'service_role' => null, // ロールなし
            'service_role_level' => 0,
        ]);

    $this->app->instance(OrgAccessService::class, $orgAccessService);

    $response = $this->actingAs($user)
        ->withHeaders(['X-Org-Id' => 'test-org'])
        ->getJson('/test-admin-only');

    $response->assertStatus(403)
        ->assertJson([
            'error' => 'NO_SERVICE_ROLE',
        ]);
});

test('sso.role:admin rejects member role users', function () {
    $user = User::factory()->create();

    $orgAccessService = \Mockery::mock(OrgAccessService::class);
    $orgAccessService->shouldReceive('checkAccess')
        ->andReturn([
            'organization_id' => 1,
            'organization_slug' => 'test-org',
            'org_role' => 'member',
            'service_role' => 'member',
            'service_role_level' => 10,
        ]);

    $this->app->instance(OrgAccessService::class, $orgAccessService);

    $response = $this->actingAs($user)
        ->withHeaders(['X-Org-Id' => 'test-org'])
        ->getJson('/test-admin-only');

    $response->assertStatus(403)
        ->assertJson([
            'error' => 'INSUFFICIENT_ROLE',
            'required_role' => 'admin',
            'current_role' => 'member',
        ]);
});

test('sso.role:admin rejects manager role users', function () {
    $user = User::factory()->create();

    $orgAccessService = \Mockery::mock(OrgAccessService::class);
    $orgAccessService->shouldReceive('checkAccess')
        ->andReturn([
            'organization_id' => 1,
            'organization_slug' => 'test-org',
            'org_role' => 'member',
            'service_role' => 'manager',
            'service_role_level' => 50,
        ]);

    $this->app->instance(OrgAccessService::class, $orgAccessService);

    $response = $this->actingAs($user)
        ->withHeaders(['X-Org-Id' => 'test-org'])
        ->getJson('/test-admin-only');

    $response->assertStatus(403)
        ->assertJson([
            'error' => 'INSUFFICIENT_ROLE',
            'required_role' => 'admin',
            'current_role' => 'manager',
        ]);
});

test('sso.role:admin allows admin role users', function () {
    $user = User::factory()->create();

    $orgAccessService = \Mockery::mock(OrgAccessService::class);
    $orgAccessService->shouldReceive('checkAccess')
        ->andReturn([
            'organization_id' => 1,
            'organization_slug' => 'test-org',
            'org_role' => 'admin',
            'service_role' => 'admin',
            'service_role_level' => 100,
        ]);

    $this->app->instance(OrgAccessService::class, $orgAccessService);

    $response = $this->actingAs($user)
        ->withHeaders(['X-Org-Id' => 'test-org'])
        ->getJson('/test-admin-only');

    $response->assertStatus(200)
        ->assertJson([
            'message' => 'admin access granted',
        ]);
});

test('sso.role:manager allows manager role users', function () {
    $user = User::factory()->create();

    $orgAccessService = \Mockery::mock(OrgAccessService::class);
    $orgAccessService->shouldReceive('checkAccess')
        ->andReturn([
            'organization_id' => 1,
            'organization_slug' => 'test-org',
            'org_role' => 'member',
            'service_role' => 'manager',
            'service_role_level' => 50,
        ]);

    $this->app->instance(OrgAccessService::class, $orgAccessService);

    $response = $this->actingAs($user)
        ->withHeaders(['X-Org-Id' => 'test-org'])
        ->getJson('/test-manager-only');

    $response->assertStatus(200)
        ->assertJson([
            'message' => 'manager access granted',
        ]);
});

test('sso.role:manager allows admin role users (higher role)', function () {
    $user = User::factory()->create();

    $orgAccessService = \Mockery::mock(OrgAccessService::class);
    $orgAccessService->shouldReceive('checkAccess')
        ->andReturn([
            'organization_id' => 1,
            'organization_slug' => 'test-org',
            'org_role' => 'admin',
            'service_role' => 'admin',
            'service_role_level' => 100,
        ]);

    $this->app->instance(OrgAccessService::class, $orgAccessService);

    $response = $this->actingAs($user)
        ->withHeaders(['X-Org-Id' => 'test-org'])
        ->getJson('/test-manager-only');

    $response->assertStatus(200)
        ->assertJson([
            'message' => 'manager access granted',
        ]);
});

test('sso.role:member allows all authenticated users with role', function () {
    $user = User::factory()->create();

    $orgAccessService = \Mockery::mock(OrgAccessService::class);
    $orgAccessService->shouldReceive('checkAccess')
        ->andReturn([
            'organization_id' => 1,
            'organization_slug' => 'test-org',
            'org_role' => 'member',
            'service_role' => 'member',
            'service_role_level' => 10,
        ]);

    $this->app->instance(OrgAccessService::class, $orgAccessService);

    $response = $this->actingAs($user)
        ->withHeaders(['X-Org-Id' => 'test-org'])
        ->getJson('/test-member-only');

    $response->assertStatus(200)
        ->assertJson([
            'message' => 'member access granted',
        ]);
});
