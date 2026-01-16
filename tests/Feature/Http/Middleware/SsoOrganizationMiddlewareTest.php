<?php

/**
 * SSO Organization Access Middleware Tests
 *
 * 組織アクセスミドルウェアのテスト
 */

use Illuminate\Support\Facades\Route;
use Omnify\SsoClient\Services\OrgAccessService;
use Omnify\SsoClient\Tests\Fixtures\Models\User;

beforeEach(function () {
    // テスト用のルートを定義
    Route::middleware(['sso.auth', 'sso.org'])->get('/test-org-access', function () {
        return response()->json([
            'message' => 'organization access granted',
            'org_id' => request()->attributes->get('orgId'),
            'org_slug' => request()->attributes->get('orgSlug'),
            'org_role' => request()->attributes->get('orgRole'),
            'service_role' => request()->attributes->get('serviceRole'),
        ]);
    });
});

test('sso.org middleware rejects request without X-Org-Id header', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->getJson('/test-org-access');

    $response->assertStatus(400)
        ->assertJson([
            'error' => 'MISSING_ORGANIZATION',
            'message' => 'X-Org-Id header is required',
        ]);
});

test('sso.org middleware rejects unauthorized organization access', function () {
    $user = User::factory()->create();

    // OrgAccessServiceをモック
    $orgAccessService = \Mockery::mock(OrgAccessService::class);
    $orgAccessService->shouldReceive('checkAccess')
        ->with(\Mockery::any(), 'unauthorized-org')
        ->andReturn(null);

    $this->app->instance(OrgAccessService::class, $orgAccessService);

    $response = $this->actingAs($user)
        ->withHeaders(['X-Org-Id' => 'unauthorized-org'])
        ->getJson('/test-org-access');

    $response->assertStatus(403)
        ->assertJson([
            'error' => 'ACCESS_DENIED',
            'message' => 'No access to this organization',
        ]);
});

test('sso.org middleware allows authorized organization access', function () {
    $user = User::factory()->create();

    // OrgAccessServiceをモック
    $orgAccessService = \Mockery::mock(OrgAccessService::class);
    $orgAccessService->shouldReceive('checkAccess')
        ->with(\Mockery::any(), 'my-company')
        ->andReturn([
            'organization_id' => 1,
            'organization_slug' => 'my-company',
            'org_role' => 'admin',
            'service_role' => 'admin',
            'service_role_level' => 100,
        ]);

    $this->app->instance(OrgAccessService::class, $orgAccessService);

    $response = $this->actingAs($user)
        ->withHeaders(['X-Org-Id' => 'my-company'])
        ->getJson('/test-org-access');

    $response->assertStatus(200)
        ->assertJson([
            'message' => 'organization access granted',
            'org_id' => 1,
            'org_slug' => 'my-company',
            'org_role' => 'admin',
            'service_role' => 'admin',
        ]);
});

test('sso.org middleware sets organization info on request attributes', function () {
    $user = User::factory()->create();

    // OrgAccessServiceをモック
    $orgAccessService = \Mockery::mock(OrgAccessService::class);
    $orgAccessService->shouldReceive('checkAccess')
        ->andReturn([
            'organization_id' => 123,
            'organization_slug' => 'test-org',
            'org_role' => 'member',
            'service_role' => 'manager',
            'service_role_level' => 50,
        ]);

    $this->app->instance(OrgAccessService::class, $orgAccessService);

    $response = $this->actingAs($user)
        ->withHeaders(['X-Org-Id' => 'test-org'])
        ->getJson('/test-org-access');

    $response->assertStatus(200)
        ->assertJsonPath('org_id', 123)
        ->assertJsonPath('org_slug', 'test-org')
        ->assertJsonPath('org_role', 'member')
        ->assertJsonPath('service_role', 'manager');
});
