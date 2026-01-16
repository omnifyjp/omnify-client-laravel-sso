<?php

/**
 * RoleAdminController Feature Tests
 *
 * ロール管理コントローラーのテスト
 */

use Omnify\SsoClient\Models\Permission;
use Omnify\SsoClient\Models\Role;
use Omnify\SsoClient\Tests\Fixtures\Models\User;

beforeEach(function () {
    // ロールとパーミッションのマイグレーションを実行
    $this->artisan('migrate', ['--database' => 'testing']);
});

// =============================================================================
// Index Tests - 一覧取得のテスト
// =============================================================================

test('index returns all roles ordered by level desc', function () {
    $admin = Role::create(['slug' => 'admin', 'name' => 'Admin', 'level' => 100]);
    $manager = Role::create(['slug' => 'manager', 'name' => 'Manager', 'level' => 50]);
    $member = Role::create(['slug' => 'member', 'name' => 'Member', 'level' => 10]);

    $user = User::factory()->create();

    $response = $this->actingAs($user)->getJson('/api/admin/sso/roles');

    $response->assertStatus(200)
        ->assertJsonCount(3, 'data')
        ->assertJsonPath('data.0.slug', 'admin')
        ->assertJsonPath('data.1.slug', 'manager')
        ->assertJsonPath('data.2.slug', 'member');
});

test('index includes permissions_count', function () {
    $role = Role::create(['slug' => 'editor', 'name' => 'Editor', 'level' => 30]);
    $permission1 = Permission::create(['slug' => 'posts.create', 'name' => 'Create Posts']);
    $permission2 = Permission::create(['slug' => 'posts.edit', 'name' => 'Edit Posts']);
    $role->permissions()->attach([$permission1->id, $permission2->id]);

    $user = User::factory()->create();

    $response = $this->actingAs($user)->getJson('/api/admin/sso/roles');

    $response->assertStatus(200)
        ->assertJsonPath('data.0.permissions_count', 2);
});

// =============================================================================
// Store Tests - 作成のテスト
// =============================================================================

test('store creates a new role', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson('/api/admin/sso/roles', [
        'slug' => 'reviewer',
        'name' => 'Reviewer',
        'level' => 25,
        'description' => 'Can review content',
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('data.slug', 'reviewer')
        ->assertJsonPath('data.name', 'Reviewer')
        ->assertJsonPath('data.level', 25);

    $this->assertDatabaseHas('roles', [
        'slug' => 'reviewer',
        'name' => 'Reviewer',
    ]);
});

test('store validates required fields', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson('/api/admin/sso/roles', []);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['slug', 'name', 'level']);
});

test('store validates unique slug', function () {
    Role::create(['slug' => 'existing', 'name' => 'Existing', 'level' => 10]);
    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson('/api/admin/sso/roles', [
        'slug' => 'existing',
        'name' => 'Another',
        'level' => 20,
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['slug']);
});

test('store validates level range', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson('/api/admin/sso/roles', [
        'slug' => 'test',
        'name' => 'Test',
        'level' => 150, // max is 100
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['level']);
});

// =============================================================================
// Show Tests - 詳細取得のテスト
// =============================================================================

test('show returns role with permissions', function () {
    $role = Role::create(['slug' => 'admin', 'name' => 'Admin', 'level' => 100]);
    $permission = Permission::create(['slug' => 'users.manage', 'name' => 'Manage Users']);
    $role->permissions()->attach($permission->id);

    $user = User::factory()->create();

    $response = $this->actingAs($user)->getJson("/api/admin/sso/roles/{$role->id}");

    $response->assertStatus(200)
        ->assertJsonPath('data.slug', 'admin')
        ->assertJsonCount(1, 'data.permissions')
        ->assertJsonPath('data.permissions.0.slug', 'users.manage');
});

test('show returns 404 for non-existent role', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->getJson('/api/admin/sso/roles/9999');

    $response->assertStatus(404);
});

// =============================================================================
// Update Tests - 更新のテスト
// =============================================================================

test('update modifies role', function () {
    $role = Role::create(['slug' => 'editor', 'name' => 'Editor', 'level' => 30]);
    $user = User::factory()->create();

    $response = $this->actingAs($user)->putJson("/api/admin/sso/roles/{$role->id}", [
        'name' => 'Senior Editor',
        'level' => 40,
        'description' => 'Updated description',
    ]);

    $response->assertStatus(200)
        ->assertJsonPath('data.name', 'Senior Editor')
        ->assertJsonPath('data.level', 40);

    $this->assertDatabaseHas('roles', [
        'id' => $role->id,
        'name' => 'Senior Editor',
        'level' => 40,
    ]);
});

test('update does not change slug', function () {
    $role = Role::create(['slug' => 'original', 'name' => 'Original', 'level' => 10]);
    $user = User::factory()->create();

    $response = $this->actingAs($user)->putJson("/api/admin/sso/roles/{$role->id}", [
        'slug' => 'changed',
        'name' => 'Changed',
    ]);

    $response->assertStatus(200);

    $this->assertDatabaseHas('roles', [
        'id' => $role->id,
        'slug' => 'original', // unchanged
    ]);
});

// =============================================================================
// Destroy Tests - 削除のテスト
// =============================================================================

test('destroy deletes role', function () {
    $role = Role::create(['slug' => 'deletable', 'name' => 'Deletable', 'level' => 5]);
    $user = User::factory()->create();

    $response = $this->actingAs($user)->deleteJson("/api/admin/sso/roles/{$role->id}");

    $response->assertStatus(204);

    $this->assertDatabaseMissing('roles', ['id' => $role->id]);
});

test('destroy cannot delete system roles', function () {
    $admin = Role::create(['slug' => 'admin', 'name' => 'Admin', 'level' => 100]);
    $user = User::factory()->create();

    $response = $this->actingAs($user)->deleteJson("/api/admin/sso/roles/{$admin->id}");

    $response->assertStatus(422)
        ->assertJson([
            'error' => 'CANNOT_DELETE_SYSTEM_ROLE',
        ]);

    $this->assertDatabaseHas('roles', ['id' => $admin->id]);
});

test('destroy cannot delete manager role', function () {
    $manager = Role::create(['slug' => 'manager', 'name' => 'Manager', 'level' => 50]);
    $user = User::factory()->create();

    $response = $this->actingAs($user)->deleteJson("/api/admin/sso/roles/{$manager->id}");

    $response->assertStatus(422);
});

test('destroy cannot delete member role', function () {
    $member = Role::create(['slug' => 'member', 'name' => 'Member', 'level' => 10]);
    $user = User::factory()->create();

    $response = $this->actingAs($user)->deleteJson("/api/admin/sso/roles/{$member->id}");

    $response->assertStatus(422);
});

// =============================================================================
// Permissions Tests - パーミッション関連のテスト
// =============================================================================

test('permissions returns role with its permissions', function () {
    $role = Role::create(['slug' => 'editor', 'name' => 'Editor', 'level' => 30]);
    $permission1 = Permission::create(['slug' => 'posts.create', 'name' => 'Create Posts']);
    $permission2 = Permission::create(['slug' => 'posts.edit', 'name' => 'Edit Posts']);
    $role->permissions()->attach([$permission1->id, $permission2->id]);

    $user = User::factory()->create();

    $response = $this->actingAs($user)->getJson("/api/admin/sso/roles/{$role->id}/permissions");

    $response->assertStatus(200)
        ->assertJsonStructure([
            'role' => ['id', 'slug', 'name'],
            'permissions',
        ])
        ->assertJsonCount(2, 'permissions');
});

test('syncPermissions attaches new permissions', function () {
    $role = Role::create(['slug' => 'editor', 'name' => 'Editor', 'level' => 30]);
    $permission1 = Permission::create(['slug' => 'posts.create', 'name' => 'Create Posts']);
    $permission2 = Permission::create(['slug' => 'posts.edit', 'name' => 'Edit Posts']);

    $user = User::factory()->create();

    $response = $this->actingAs($user)->putJson("/api/admin/sso/roles/{$role->id}/permissions", [
        'permissions' => [$permission1->id, $permission2->id],
    ]);

    $response->assertStatus(200)
        ->assertJsonPath('attached', 2)
        ->assertJsonPath('detached', 0);

    expect($role->permissions()->count())->toBe(2);
});

test('syncPermissions detaches removed permissions', function () {
    $role = Role::create(['slug' => 'editor', 'name' => 'Editor', 'level' => 30]);
    $permission1 = Permission::create(['slug' => 'posts.create', 'name' => 'Create Posts']);
    $permission2 = Permission::create(['slug' => 'posts.edit', 'name' => 'Edit Posts']);
    $role->permissions()->attach([$permission1->id, $permission2->id]);

    $user = User::factory()->create();

    // Only keep permission1
    $response = $this->actingAs($user)->putJson("/api/admin/sso/roles/{$role->id}/permissions", [
        'permissions' => [$permission1->id],
    ]);

    $response->assertStatus(200)
        ->assertJsonPath('attached', 0)
        ->assertJsonPath('detached', 1);

    expect($role->permissions()->count())->toBe(1);
    expect($role->permissions()->first()->slug)->toBe('posts.create');
});

test('syncPermissions accepts permission slugs', function () {
    $role = Role::create(['slug' => 'editor', 'name' => 'Editor', 'level' => 30]);
    Permission::create(['slug' => 'posts.create', 'name' => 'Create Posts']);
    Permission::create(['slug' => 'posts.edit', 'name' => 'Edit Posts']);

    $user = User::factory()->create();

    $response = $this->actingAs($user)->putJson("/api/admin/sso/roles/{$role->id}/permissions", [
        'permissions' => ['posts.create', 'posts.edit'],
    ]);

    $response->assertStatus(200)
        ->assertJsonPath('attached', 2);

    expect($role->permissions()->count())->toBe(2);
});

test('syncPermissions accepts mixed IDs and slugs', function () {
    $role = Role::create(['slug' => 'editor', 'name' => 'Editor', 'level' => 30]);
    $permission1 = Permission::create(['slug' => 'posts.create', 'name' => 'Create Posts']);
    Permission::create(['slug' => 'posts.edit', 'name' => 'Edit Posts']);

    $user = User::factory()->create();

    $response = $this->actingAs($user)->putJson("/api/admin/sso/roles/{$role->id}/permissions", [
        'permissions' => [$permission1->id, 'posts.edit'],
    ]);

    $response->assertStatus(200)
        ->assertJsonPath('attached', 2);

    expect($role->permissions()->count())->toBe(2);
});
