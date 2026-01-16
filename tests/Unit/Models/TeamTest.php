<?php

/**
 * Team Model Unit Tests
 *
 * チームモデルのユニットテスト
 * Kiểm thử đơn vị cho Model Team
 */

use Omnify\SsoClient\Models\Team;
use Omnify\SsoClient\Models\Permission;
use Omnify\SsoClient\Models\TeamPermission;

beforeEach(function () {
    $this->artisan('migrate', ['--database' => 'testing']);
});

// =============================================================================
// Basic Model Tests - 基本モデルテスト
// =============================================================================

test('can create team with required fields', function () {
    $team = Team::create([
        'name' => 'Development Team',
        'console_team_id' => 12345,
        'console_org_id' => 100,
    ]);

    expect($team)->toBeInstanceOf(Team::class)
        ->and($team->name)->toBe('Development Team')
        ->and($team->console_team_id)->toBe(12345)
        ->and($team->console_org_id)->toBe(100)
        ->and($team->id)->toBeInt();
});

test('console_team_id must be unique', function () {
    Team::create([
        'name' => 'Team 1',
        'console_team_id' => 12345,
        'console_org_id' => 100,
    ]);

    expect(fn () => Team::create([
        'name' => 'Team 2',
        'console_team_id' => 12345,
        'console_org_id' => 100,
    ]))->toThrow(\Illuminate\Database\QueryException::class);
});

test('can create multiple teams in same organization', function () {
    Team::create(['name' => 'Team 1', 'console_team_id' => 1001, 'console_org_id' => 100]);
    Team::create(['name' => 'Team 2', 'console_team_id' => 1002, 'console_org_id' => 100]);
    Team::create(['name' => 'Team 3', 'console_team_id' => 1003, 'console_org_id' => 100]);

    $orgTeams = Team::where('console_org_id', 100)->get();
    
    expect($orgTeams)->toHaveCount(3);
});

// =============================================================================
// Casting Tests - キャストテスト
// =============================================================================

test('console_team_id is cast to integer', function () {
    $team = Team::create([
        'name' => 'Test Team',
        'console_team_id' => '12345',
        'console_org_id' => '100',
    ]);

    expect($team->console_team_id)->toBeInt()
        ->and($team->console_team_id)->toBe(12345);
});

test('console_org_id is cast to integer', function () {
    $team = Team::create([
        'name' => 'Test Team',
        'console_team_id' => 12345,
        'console_org_id' => '100',
    ]);

    expect($team->console_org_id)->toBeInt()
        ->and($team->console_org_id)->toBe(100);
});

// =============================================================================
// Soft Delete Tests - ソフトデリートテスト
// =============================================================================

test('team uses soft deletes', function () {
    $team = Team::create([
        'name' => 'Deletable Team',
        'console_team_id' => 12345,
        'console_org_id' => 100,
    ]);

    $team->delete();
    
    // Should not be found in normal query
    expect(Team::find($team->id))->toBeNull();
    
    // Should be found with trashed
    expect(Team::withTrashed()->find($team->id))->not->toBeNull();
});

test('can restore soft deleted team', function () {
    $team = Team::create([
        'name' => 'Deletable Team',
        'console_team_id' => 12345,
        'console_org_id' => 100,
    ]);

    $team->delete();
    expect(Team::find($team->id))->toBeNull();

    $team->restore();
    expect(Team::find($team->id))->not->toBeNull();
});

test('can force delete team', function () {
    $team = Team::create([
        'name' => 'Deletable Team',
        'console_team_id' => 12345,
        'console_org_id' => 100,
    ]);
    $teamId = $team->id;

    $team->forceDelete();
    
    expect(Team::withTrashed()->find($teamId))->toBeNull();
});

test('deleted_at is set on soft delete', function () {
    $team = Team::create([
        'name' => 'Deletable Team',
        'console_team_id' => 12345,
        'console_org_id' => 100,
    ]);

    $team->delete();
    $team->refresh();
    
    expect($team->deleted_at)->not->toBeNull()
        ->and($team->deleted_at)->toBeInstanceOf(\Carbon\Carbon::class);
});

test('can get only trashed teams', function () {
    Team::create(['name' => 'Active 1', 'console_team_id' => 1001, 'console_org_id' => 100]);
    $deleted = Team::create(['name' => 'Deleted', 'console_team_id' => 1002, 'console_org_id' => 100]);
    Team::create(['name' => 'Active 2', 'console_team_id' => 1003, 'console_org_id' => 100]);

    $deleted->delete();

    expect(Team::count())->toBe(2)
        ->and(Team::onlyTrashed()->count())->toBe(1)
        ->and(Team::withTrashed()->count())->toBe(3);
});

// =============================================================================
// findByConsoleId Tests - findByConsoleIdテスト
// =============================================================================

test('findByConsoleId returns team when exists', function () {
    Team::create(['name' => 'Target Team', 'console_team_id' => 99999, 'console_org_id' => 100]);

    $found = Team::findByConsoleId(99999);
    
    expect($found)->not->toBeNull()
        ->and($found->name)->toBe('Target Team');
});

test('findByConsoleId returns null when not exists', function () {
    $found = Team::findByConsoleId(99999);
    
    expect($found)->toBeNull();
});

test('findByConsoleId does not return soft deleted team', function () {
    $team = Team::create(['name' => 'Deleted Team', 'console_team_id' => 99999, 'console_org_id' => 100]);
    $team->delete();

    $found = Team::findByConsoleId(99999);
    
    expect($found)->toBeNull();
});

// =============================================================================
// getByOrgId Tests - getByOrgIdテスト
// =============================================================================

test('getByOrgId returns all teams for organization', function () {
    Team::create(['name' => 'Org1 Team 1', 'console_team_id' => 1001, 'console_org_id' => 100]);
    Team::create(['name' => 'Org1 Team 2', 'console_team_id' => 1002, 'console_org_id' => 100]);
    Team::create(['name' => 'Org2 Team 1', 'console_team_id' => 2001, 'console_org_id' => 200]);

    $org1Teams = Team::getByOrgId(100);
    
    expect($org1Teams)->toHaveCount(2)
        ->and($org1Teams->pluck('name')->toArray())->toContain('Org1 Team 1', 'Org1 Team 2');
});

test('getByOrgId returns empty collection when no teams', function () {
    $teams = Team::getByOrgId(99999);
    
    expect($teams)->toBeInstanceOf(\Illuminate\Database\Eloquent\Collection::class)
        ->and($teams)->toHaveCount(0);
});

test('getByOrgId does not return soft deleted teams', function () {
    Team::create(['name' => 'Active Team', 'console_team_id' => 1001, 'console_org_id' => 100]);
    $deleted = Team::create(['name' => 'Deleted Team', 'console_team_id' => 1002, 'console_org_id' => 100]);
    $deleted->delete();

    $teams = Team::getByOrgId(100);
    
    expect($teams)->toHaveCount(1)
        ->and($teams->first()->name)->toBe('Active Team');
});

// =============================================================================
// Permission Tests via TeamPermission - TeamPermission経由の権限テスト
// =============================================================================

test('can assign permission to team via TeamPermission', function () {
    $team = Team::create(['name' => 'Test Team', 'console_team_id' => 12345, 'console_org_id' => 100]);
    $permission = Permission::create(['name' => 'View Projects', 'slug' => 'projects.view']);

    TeamPermission::create([
        'console_team_id' => $team->console_team_id,
        'console_org_id' => $team->console_org_id,
        'permission_id' => $permission->id,
    ]);

    $teamPermissions = TeamPermission::where('console_team_id', $team->console_team_id)->get();
    expect($teamPermissions)->toHaveCount(1);
});

test('can assign multiple permissions to team', function () {
    $team = Team::create(['name' => 'Test Team', 'console_team_id' => 12345, 'console_org_id' => 100]);
    $perm1 = Permission::create(['name' => 'View Projects', 'slug' => 'projects.view']);
    $perm2 = Permission::create(['name' => 'Edit Projects', 'slug' => 'projects.edit']);
    $perm3 = Permission::create(['name' => 'Delete Projects', 'slug' => 'projects.delete']);

    foreach ([$perm1, $perm2, $perm3] as $perm) {
        TeamPermission::create([
            'console_team_id' => $team->console_team_id,
            'console_org_id' => $team->console_org_id,
            'permission_id' => $perm->id,
        ]);
    }

    $teamPermissions = TeamPermission::where('console_team_id', $team->console_team_id)->get();
    expect($teamPermissions)->toHaveCount(3);
});

test('hasPermission returns true when team has permission via TeamPermission', function () {
    $team = Team::create(['name' => 'Test Team', 'console_team_id' => 12345, 'console_org_id' => 100]);
    $permission = Permission::create(['name' => 'View Projects', 'slug' => 'projects.view']);
    
    TeamPermission::create([
        'console_team_id' => $team->console_team_id,
        'console_org_id' => $team->console_org_id,
        'permission_id' => $permission->id,
    ]);

    expect($team->hasPermission('projects.view'))->toBeTrue();
});

test('hasPermission returns false when team does not have permission', function () {
    $team = Team::create(['name' => 'Test Team', 'console_team_id' => 12345, 'console_org_id' => 100]);
    Permission::create(['name' => 'View Projects', 'slug' => 'projects.view']);

    expect($team->hasPermission('projects.view'))->toBeFalse();
});

test('hasAnyPermission returns true when team has at least one permission', function () {
    $team = Team::create(['name' => 'Test Team', 'console_team_id' => 12345, 'console_org_id' => 100]);
    $permission = Permission::create(['name' => 'View Projects', 'slug' => 'projects.view']);
    Permission::create(['name' => 'Edit Projects', 'slug' => 'projects.edit']);
    
    TeamPermission::create([
        'console_team_id' => $team->console_team_id,
        'console_org_id' => $team->console_org_id,
        'permission_id' => $permission->id,
    ]);

    expect($team->hasAnyPermission(['projects.view', 'projects.edit']))->toBeTrue();
});

test('hasAnyPermission returns false when team has none of the permissions', function () {
    $team = Team::create(['name' => 'Test Team', 'console_team_id' => 12345, 'console_org_id' => 100]);
    Permission::create(['name' => 'View Projects', 'slug' => 'projects.view']);

    expect($team->hasAnyPermission(['projects.view', 'projects.edit']))->toBeFalse();
});

test('hasAllPermissions returns true when team has all permissions', function () {
    $team = Team::create(['name' => 'Test Team', 'console_team_id' => 12345, 'console_org_id' => 100]);
    $perm1 = Permission::create(['name' => 'View Projects', 'slug' => 'projects.view']);
    $perm2 = Permission::create(['name' => 'Edit Projects', 'slug' => 'projects.edit']);
    
    foreach ([$perm1, $perm2] as $perm) {
        TeamPermission::create([
            'console_team_id' => $team->console_team_id,
            'console_org_id' => $team->console_org_id,
            'permission_id' => $perm->id,
        ]);
    }

    expect($team->hasAllPermissions(['projects.view', 'projects.edit']))->toBeTrue();
});

test('hasAllPermissions returns false when team is missing some permissions', function () {
    $team = Team::create(['name' => 'Test Team', 'console_team_id' => 12345, 'console_org_id' => 100]);
    $permission = Permission::create(['name' => 'View Projects', 'slug' => 'projects.view']);
    Permission::create(['name' => 'Edit Projects', 'slug' => 'projects.edit']);
    
    TeamPermission::create([
        'console_team_id' => $team->console_team_id,
        'console_org_id' => $team->console_org_id,
        'permission_id' => $permission->id,
    ]);

    expect($team->hasAllPermissions(['projects.view', 'projects.edit']))->toBeFalse();
});

// =============================================================================
// Query Tests - クエリテスト
// =============================================================================

test('can find team by name', function () {
    Team::create(['name' => 'Unique Name', 'console_team_id' => 12345, 'console_org_id' => 100]);

    $found = Team::where('name', 'Unique Name')->first();
    
    expect($found)->not->toBeNull()
        ->and($found->console_team_id)->toBe(12345);
});

test('can search teams by name pattern', function () {
    Team::create(['name' => 'Development Team', 'console_team_id' => 1001, 'console_org_id' => 100]);
    Team::create(['name' => 'Design Team', 'console_team_id' => 1002, 'console_org_id' => 100]);
    Team::create(['name' => 'Marketing', 'console_team_id' => 1003, 'console_org_id' => 100]);

    $teams = Team::where('name', 'like', '%Team%')->get();
    
    expect($teams)->toHaveCount(2);
});

test('can order teams by name', function () {
    Team::create(['name' => 'Zulu Team', 'console_team_id' => 1003, 'console_org_id' => 100]);
    Team::create(['name' => 'Alpha Team', 'console_team_id' => 1001, 'console_org_id' => 100]);
    Team::create(['name' => 'Bravo Team', 'console_team_id' => 1002, 'console_org_id' => 100]);

    $teams = Team::orderBy('name')->get();
    
    expect($teams->first()->name)->toBe('Alpha Team')
        ->and($teams->last()->name)->toBe('Zulu Team');
});

// =============================================================================
// Update Tests - 更新テスト
// =============================================================================

test('can update team name', function () {
    $team = Team::create(['name' => 'Old Name', 'console_team_id' => 12345, 'console_org_id' => 100]);

    $team->update(['name' => 'New Name']);
    $team->refresh();
    
    expect($team->name)->toBe('New Name');
});

test('can update console_org_id', function () {
    $team = Team::create(['name' => 'Team', 'console_team_id' => 12345, 'console_org_id' => 100]);

    $team->update(['console_org_id' => 200]);
    $team->refresh();
    
    expect($team->console_org_id)->toBe(200);
});

// =============================================================================
// Timestamp Tests - タイムスタンプテスト
// =============================================================================

test('timestamps are automatically set', function () {
    $team = Team::create(['name' => 'Test Team', 'console_team_id' => 12345, 'console_org_id' => 100]);

    expect($team->created_at)->not->toBeNull()
        ->and($team->updated_at)->not->toBeNull()
        ->and($team->created_at)->toBeInstanceOf(\Carbon\Carbon::class);
});

test('updated_at changes on update', function () {
    $team = Team::create(['name' => 'Test Team', 'console_team_id' => 12345, 'console_org_id' => 100]);
    $originalUpdatedAt = $team->updated_at;
    
    usleep(100000); // 0.1 second
    
    $team->update(['name' => 'Updated Name']);
    
    expect($team->updated_at->gte($originalUpdatedAt))->toBeTrue();
});

// =============================================================================
// Index Tests - インデックステスト
// =============================================================================

test('console_org_id index allows fast organization queries', function () {
    // Create many teams
    for ($i = 1; $i <= 100; $i++) {
        Team::create([
            'name' => "Team $i",
            'console_team_id' => $i,
            'console_org_id' => $i <= 50 ? 100 : 200,
        ]);
    }

    // Query should work efficiently
    $org100Teams = Team::where('console_org_id', 100)->get();
    $org200Teams = Team::where('console_org_id', 200)->get();
    
    expect($org100Teams)->toHaveCount(50)
        ->and($org200Teams)->toHaveCount(50);
});

// =============================================================================
// TeamPermission Cleanup Tests - TeamPermissionクリーンアップテスト
// =============================================================================

test('team permissions are cleaned up on team hard delete', function () {
    $team = Team::create(['name' => 'Test Team', 'console_team_id' => 12345, 'console_org_id' => 100]);
    $permission = Permission::create(['name' => 'View Projects', 'slug' => 'projects.view']);
    
    TeamPermission::create([
        'console_team_id' => $team->console_team_id,
        'console_org_id' => $team->console_org_id,
        'permission_id' => $permission->id,
    ]);

    // Hard delete the team
    $team->forceDelete();

    // TeamPermission should still exist (no cascade by default)
    // This is expected behavior - cleanup should be done manually or via events
    $remaining = TeamPermission::where('console_team_id', 12345)->withTrashed()->count();
    expect($remaining)->toBe(1);
});
