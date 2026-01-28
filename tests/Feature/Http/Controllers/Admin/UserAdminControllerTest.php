<?php

/**
 * UserAdminController Feature Tests
 *
 * Comprehensive tests for user management and permissions breakdown API.
 * Includes edge cases for multi-scope role assignments.
 */

use Illuminate\Support\Str;
use Omnify\SsoClient\Models\Permission;
use Omnify\SsoClient\Models\Role;
use Omnify\SsoClient\Models\UserCache as User;

beforeEach(function () {
    $this->artisan('migrate', ['--database' => 'testing']);

    // Create authenticated admin user
    $this->adminUser = User::factory()->create([
        'name' => 'Admin User',
        'email' => 'admin@example.com',
    ]);

    $this->actingAs($this->adminUser);
});

// =============================================================================
// User Permissions Breakdown Tests - ユーザー権限詳細テスト
// =============================================================================

describe('GET /api/admin/sso/users/{user}/permissions', function () {
    test('returns permissions breakdown for user with roles', function () {
        $user = User::factory()->create();

        // Create role with permissions
        $role = Role::create(['name' => 'Manager', 'slug' => 'manager', 'level' => 50]);
        $perm1 = Permission::create(['name' => 'View Users', 'slug' => 'users.view', 'group' => 'users']);
        $perm2 = Permission::create(['name' => 'Edit Users', 'slug' => 'users.edit', 'group' => 'users']);
        $role->permissions()->attach([$perm1->id, $perm2->id]);

        // Assign role to user (global scope)
        $user->assignRole($role);

        $response = $this->getJson("/api/admin/sso/users/{$user->id}/permissions", [
            'X-Organization-Id' => 'test-org',
        ]);

        $response->assertOk()
            ->assertJsonStructure([
                'user' => ['id', 'name', 'email'],
                'context' => ['org_id', 'branch_id'],
                'role_assignments' => [
                    '*' => [
                        'role' => ['id', 'name', 'slug', 'level'],
                        'scope',
                        'console_org_id',
                        'console_branch_id',
                        'permissions',
                    ],
                ],
                'team_memberships',
                'aggregated_permissions',
            ]);

        // Verify role assignment
        expect($response->json('role_assignments'))->toHaveCount(1);
        expect($response->json('role_assignments.0.role.slug'))->toBe('manager');
        expect($response->json('role_assignments.0.scope'))->toBe('global');
        expect($response->json('role_assignments.0.permissions'))->toContain('users.view', 'users.edit');

        // Verify aggregated permissions
        expect($response->json('aggregated_permissions'))->toContain('users.view', 'users.edit');
    });

    test('returns scoped role assignments correctly', function () {
        $user = User::factory()->create();
        $orgId = (string) Str::uuid();
        $branchId = (string) Str::uuid();

        // Create roles
        $globalRole = Role::create(['name' => 'Global Admin', 'slug' => 'global-admin', 'level' => 100]);
        $orgRole = Role::create(['name' => 'Org Manager', 'slug' => 'org-manager', 'level' => 50]);
        $branchRole = Role::create(['name' => 'Branch Staff', 'slug' => 'branch-staff', 'level' => 10]);

        // Create permissions
        $globalPerm = Permission::create(['name' => 'Global Perm', 'slug' => 'global.perm', 'group' => 'global']);
        $orgPerm = Permission::create(['name' => 'Org Perm', 'slug' => 'org.perm', 'group' => 'org']);
        $branchPerm = Permission::create(['name' => 'Branch Perm', 'slug' => 'branch.perm', 'group' => 'branch']);

        $globalRole->permissions()->attach($globalPerm->id);
        $orgRole->permissions()->attach($orgPerm->id);
        $branchRole->permissions()->attach($branchPerm->id);

        // Assign roles with different scopes
        $user->assignRole($globalRole, null, null); // Global
        $user->assignRole($orgRole, $orgId, null);  // Org-wide
        $user->assignRole($branchRole, $orgId, $branchId); // Branch-specific

        $response = $this->getJson("/api/admin/sso/users/{$user->id}/permissions?org_id={$orgId}&branch_id={$branchId}", [
            'X-Organization-Id' => 'test-org',
        ]);

        $response->assertOk();

        // Should have 3 role assignments
        expect($response->json('role_assignments'))->toHaveCount(3);

        // Verify scopes
        $scopes = collect($response->json('role_assignments'))->pluck('scope')->toArray();
        expect($scopes)->toContain('global', 'org-wide', 'branch');

        // Verify aggregated permissions include all 3
        $aggregated = $response->json('aggregated_permissions');
        expect($aggregated)->toContain('global.perm', 'org.perm', 'branch.perm');
    });

    test('filters role assignments by org context', function () {
        $user = User::factory()->create();
        $orgId = (string) Str::uuid();
        $otherOrgId = (string) Str::uuid();

        $role = Role::create(['name' => 'Manager', 'slug' => 'manager', 'level' => 50]);
        $perm = Permission::create(['name' => 'Test Perm', 'slug' => 'test.perm', 'group' => 'test']);
        $role->permissions()->attach($perm->id);

        // Assign role to specific org only
        $user->assignRole($role, $otherOrgId, null);

        // Query with different org
        $response = $this->getJson("/api/admin/sso/users/{$user->id}/permissions?org_id={$orgId}", [
            'X-Organization-Id' => 'test-org',
        ]);

        $response->assertOk();
        // Should have 0 role assignments (wrong org)
        expect($response->json('role_assignments'))->toHaveCount(0);
        expect($response->json('aggregated_permissions'))->toHaveCount(0);
    });

    test('returns empty arrays for user with no roles', function () {
        $user = User::factory()->create();

        $response = $this->getJson("/api/admin/sso/users/{$user->id}/permissions", [
            'X-Organization-Id' => 'test-org',
        ]);

        $response->assertOk();
        expect($response->json('role_assignments'))->toHaveCount(0);
        expect($response->json('team_memberships'))->toHaveCount(0);
        expect($response->json('aggregated_permissions'))->toHaveCount(0);
    });

    test('returns 404 for non-existent user', function () {
        $fakeId = (string) Str::uuid();

        $response = $this->getJson("/api/admin/sso/users/{$fakeId}/permissions", [
            'X-Organization-Id' => 'test-org',
        ]);

        $response->assertNotFound();
    });

    test('same role in multiple branches shows as separate assignments', function () {
        $user = User::factory()->create();
        $orgId = (string) Str::uuid();
        $branch1 = (string) Str::uuid();
        $branch2 = (string) Str::uuid();

        $role = Role::create(['name' => 'Manager', 'slug' => 'manager', 'level' => 50]);
        $perm = Permission::create(['name' => 'Manage', 'slug' => 'manage', 'group' => 'general']);
        $role->permissions()->attach($perm->id);

        // Assign same role to multiple branches
        $user->assignRole($role, $orgId, $branch1);
        $user->assignRole($role, $orgId, $branch2);

        // Query for branch1
        $response = $this->getJson("/api/admin/sso/users/{$user->id}/permissions?org_id={$orgId}&branch_id={$branch1}", [
            'X-Organization-Id' => 'test-org',
        ]);

        $response->assertOk();
        // Should only see the branch1 assignment
        expect($response->json('role_assignments'))->toHaveCount(1);
        expect($response->json('role_assignments.0.console_branch_id'))->toBe($branch1);
    });

    test('global role appears in any context', function () {
        $user = User::factory()->create();
        $orgId = (string) Str::uuid();
        $branchId = (string) Str::uuid();

        $role = Role::create(['name' => 'Super Admin', 'slug' => 'super-admin', 'level' => 100]);
        $perm = Permission::create(['name' => 'All', 'slug' => 'all', 'group' => 'system']);
        $role->permissions()->attach($perm->id);

        $user->assignRole($role, null, null); // Global

        // Query with specific org/branch context
        $response = $this->getJson("/api/admin/sso/users/{$user->id}/permissions?org_id={$orgId}&branch_id={$branchId}", [
            'X-Organization-Id' => 'test-org',
        ]);

        $response->assertOk();
        expect($response->json('role_assignments'))->toHaveCount(1);
        expect($response->json('role_assignments.0.scope'))->toBe('global');
        expect($response->json('aggregated_permissions'))->toContain('all');
    });

    test('permissions are deduplicated in aggregated list', function () {
        $user = User::factory()->create();
        $orgId = (string) Str::uuid();

        $role1 = Role::create(['name' => 'Admin', 'slug' => 'admin', 'level' => 100]);
        $role2 = Role::create(['name' => 'Manager', 'slug' => 'manager', 'level' => 50]);

        // Same permission on both roles
        $sharedPerm = Permission::create(['name' => 'View', 'slug' => 'view', 'group' => 'general']);
        $uniquePerm = Permission::create(['name' => 'Delete', 'slug' => 'delete', 'group' => 'general']);

        $role1->permissions()->attach([$sharedPerm->id, $uniquePerm->id]);
        $role2->permissions()->attach($sharedPerm->id);

        $user->assignRole($role1, null, null);
        $user->assignRole($role2, $orgId, null);

        $response = $this->getJson("/api/admin/sso/users/{$user->id}/permissions?org_id={$orgId}", [
            'X-Organization-Id' => 'test-org',
        ]);

        $response->assertOk();
        $aggregated = $response->json('aggregated_permissions');

        // Should have exactly 2 unique permissions
        expect($aggregated)->toHaveCount(2);
        expect($aggregated)->toContain('view', 'delete');
    });

    test('context is returned correctly in response', function () {
        $user = User::factory()->create();
        $orgId = (string) Str::uuid();
        $branchId = (string) Str::uuid();

        $response = $this->getJson("/api/admin/sso/users/{$user->id}/permissions?org_id={$orgId}&branch_id={$branchId}", [
            'X-Organization-Id' => 'test-org',
        ]);

        $response->assertOk();
        expect($response->json('context.org_id'))->toBe($orgId);
        expect($response->json('context.branch_id'))->toBe($branchId);
    });

    test('context is null when not provided', function () {
        $user = User::factory()->create();

        $response = $this->getJson("/api/admin/sso/users/{$user->id}/permissions", [
            'X-Organization-Id' => 'test-org',
        ]);

        $response->assertOk();
        expect($response->json('context.org_id'))->toBeNull();
        expect($response->json('context.branch_id'))->toBeNull();
    });
});

// =============================================================================
// User Update Tests - ユーザー更新テスト
// =============================================================================

describe('PUT /api/admin/sso/users/{user}', function () {
    test('can update user name', function () {
        $user = User::factory()->create(['name' => 'Old Name']);

        $response = $this->putJson("/api/admin/sso/users/{$user->id}", [
            'name' => 'New Name',
        ], [
            'X-Organization-Id' => 'test-org',
        ]);

        $response->assertOk();
        expect($response->json('data.name'))->toBe('New Name');

        $user->refresh();
        expect($user->name)->toBe('New Name');
    });

    test('can update user email to unique value', function () {
        $user = User::factory()->create(['email' => 'original@example.com']);

        $response = $this->putJson("/api/admin/sso/users/{$user->id}", [
            'email' => 'new-unique@example.com',
        ], [
            'X-Organization-Id' => 'test-org',
        ]);

        $response->assertOk();
        $user->refresh();
        expect($user->email)->toBe('new-unique@example.com');
    });

    test('returns 404 for non-existent user', function () {
        $fakeId = (string) Str::uuid();

        $response = $this->putJson("/api/admin/sso/users/{$fakeId}", [
            'name' => 'New Name',
        ], [
            'X-Organization-Id' => 'test-org',
        ]);

        $response->assertNotFound();
    });
});

// =============================================================================
// User Delete Tests - ユーザー削除テスト
// =============================================================================

describe('DELETE /api/admin/sso/users/{user}', function () {
    test('can delete user', function () {
        $user = User::factory()->create();
        $userId = $user->id;

        $response = $this->deleteJson("/api/admin/sso/users/{$userId}", [], [
            'X-Organization-Id' => 'test-org',
        ]);

        $response->assertNoContent();
        expect(User::find($userId))->toBeNull();
    });

    test('deleting user with roles succeeds', function () {
        $user = User::factory()->create();
        $userId = $user->id;

        $role = Role::create(['name' => 'Admin', 'slug' => 'admin', 'level' => 100]);
        $orgId = (string) Str::uuid();

        $user->assignRole($role, null, null);
        $user->assignRole($role, $orgId, null);

        // Verify assignments exist
        expect($user->getRoleAssignments())->toHaveCount(2);

        $response = $this->deleteJson("/api/admin/sso/users/{$userId}", [], [
            'X-Organization-Id' => 'test-org',
        ]);

        $response->assertNoContent();

        // Verify user is deleted
        expect(User::find($userId))->toBeNull();
    });

    test('returns 404 for non-existent user', function () {
        $fakeId = (string) Str::uuid();

        $response = $this->deleteJson("/api/admin/sso/users/{$fakeId}", [], [
            'X-Organization-Id' => 'test-org',
        ]);

        $response->assertNotFound();
    });
});

// =============================================================================
// User Show Tests - ユーザー詳細テスト
// =============================================================================

describe('GET /api/admin/sso/users/{user}', function () {
    test('returns user details', function () {
        $user = User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        $response = $this->getJson("/api/admin/sso/users/{$user->id}", [
            'X-Organization-Id' => 'test-org',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.name', 'Test User')
            ->assertJsonPath('data.email', 'test@example.com');
    });

    test('returns 404 for non-existent user', function () {
        $fakeId = (string) Str::uuid();

        $response = $this->getJson("/api/admin/sso/users/{$fakeId}", [
            'X-Organization-Id' => 'test-org',
        ]);

        $response->assertNotFound();
    });
});
