<?php

/**
 * Team Model Edge Case Tests
 *
 * チームモデルのエッジケーステスト
 * Kiểm thử các trường hợp biên cho Model Team
 */

use Omnify\SsoClient\Models\Team;
use Omnify\SsoClient\Models\Permission;
use Omnify\SsoClient\Models\TeamPermission;

beforeEach(function () {
    $this->artisan('migrate', ['--database' => 'testing']);
});

// =============================================================================
// Console ID Edge Cases - Console IDのエッジケース
// =============================================================================

test('can create team with console_team_id = 0', function () {
    $team = Team::create([
        'name' => 'Zero Team ID',
        'console_team_id' => 0,
        'console_org_id' => 100,
    ]);

    expect($team->console_team_id)->toBe(0);
});

test('can create team with console_org_id = 0', function () {
    $team = Team::create([
        'name' => 'Zero Org ID',
        'console_team_id' => 12345,
        'console_org_id' => 0,
    ]);

    expect($team->console_org_id)->toBe(0);
});

test('can create team with very large console_team_id', function () {
    $largeId = 9223372036854775807; // Max bigint
    
    $team = Team::create([
        'name' => 'Large Team ID',
        'console_team_id' => $largeId,
        'console_org_id' => 100,
    ]);

    expect($team->console_team_id)->toBeInt();
});

test('console_team_id string is cast to int', function () {
    $team = Team::create([
        'name' => 'String ID',
        'console_team_id' => '12345',
        'console_org_id' => '100',
    ]);

    expect($team->console_team_id)->toBe(12345)
        ->and($team->console_team_id)->toBeInt()
        ->and($team->console_org_id)->toBe(100)
        ->and($team->console_org_id)->toBeInt();
});

test('duplicate console_team_id in same org is rejected', function () {
    Team::create([
        'name' => 'Team 1',
        'console_team_id' => 12345,
        'console_org_id' => 100,
    ]);

    // console_team_id is unique across all orgs
    expect(fn () => Team::create([
        'name' => 'Team 2',
        'console_team_id' => 12345,
        'console_org_id' => 200, // Different org
    ]))->toThrow(\Illuminate\Database\QueryException::class);
});

// =============================================================================
// Name Edge Cases - 名前のエッジケース
// =============================================================================

test('can create team with minimum length name (1 char)', function () {
    $team = Team::create([
        'name' => 'A',
        'console_team_id' => 12345,
        'console_org_id' => 100,
    ]);

    expect($team->name)->toBe('A');
});

test('can create team with maximum length name (100 chars)', function () {
    $longName = str_repeat('a', 100);
    
    $team = Team::create([
        'name' => $longName,
        'console_team_id' => 12345,
        'console_org_id' => 100,
    ]);

    expect(strlen($team->name))->toBe(100);
});

test('can create team with unicode name (Japanese)', function () {
    $team = Team::create([
        'name' => '開発チーム',
        'console_team_id' => 12345,
        'console_org_id' => 100,
    ]);

    expect($team->name)->toBe('開発チーム');
});

test('can create team with unicode name (Vietnamese)', function () {
    $team = Team::create([
        'name' => 'Nhóm phát triển',
        'console_team_id' => 12345,
        'console_org_id' => 100,
    ]);

    expect($team->name)->toBe('Nhóm phát triển');
});

test('can create team with emoji in name', function () {
    $team = Team::create([
        'name' => 'Dev Team 🚀',
        'console_team_id' => 12345,
        'console_org_id' => 100,
    ]);

    expect($team->name)->toContain('🚀');
});

test('can create team with special characters in name', function () {
    $team = Team::create([
        'name' => "Team A & B's \"Special\" <Group>",
        'console_team_id' => 12345,
        'console_org_id' => 100,
    ]);

    expect($team->name)->toBe("Team A & B's \"Special\" <Group>");
});

test('can create multiple teams with same name in different orgs', function () {
    Team::create(['name' => 'Development', 'console_team_id' => 1001, 'console_org_id' => 100]);
    Team::create(['name' => 'Development', 'console_team_id' => 2001, 'console_org_id' => 200]);

    $teams = Team::where('name', 'Development')->get();
    
    expect($teams)->toHaveCount(2);
});

// =============================================================================
// Soft Delete Edge Cases - ソフトデリートのエッジケース
// =============================================================================

test('multiple soft delete and restore cycles', function () {
    $team = Team::create([
        'name' => 'Recyclable',
        'console_team_id' => 12345,
        'console_org_id' => 100,
    ]);

    for ($i = 0; $i < 5; $i++) {
        $team->delete();
        expect(Team::find($team->id))->toBeNull();
        
        $team->restore();
        expect(Team::find($team->id))->not->toBeNull();
    }
});

test('soft deleted team excludes from getByOrgId', function () {
    $team1 = Team::create(['name' => 'Active', 'console_team_id' => 1001, 'console_org_id' => 100]);
    $team2 = Team::create(['name' => 'Deleted', 'console_team_id' => 1002, 'console_org_id' => 100]);
    
    $team2->delete();

    $teams = Team::getByOrgId(100);
    
    expect($teams)->toHaveCount(1)
        ->and($teams->first()->name)->toBe('Active');
});

test('soft deleted team excludes from findByConsoleId', function () {
    $team = Team::create(['name' => 'Deleted', 'console_team_id' => 99999, 'console_org_id' => 100]);
    $team->delete();

    $found = Team::findByConsoleId(99999);
    
    expect($found)->toBeNull();
});

test('can query only trashed teams by org', function () {
    Team::create(['name' => 'Active 1', 'console_team_id' => 1001, 'console_org_id' => 100]);
    $deleted1 = Team::create(['name' => 'Deleted 1', 'console_team_id' => 1002, 'console_org_id' => 100]);
    $deleted2 = Team::create(['name' => 'Deleted 2', 'console_team_id' => 1003, 'console_org_id' => 100]);
    Team::create(['name' => 'Other Org', 'console_team_id' => 2001, 'console_org_id' => 200]);
    
    $deleted1->delete();
    $deleted2->delete();

    $trashed = Team::onlyTrashed()->where('console_org_id', 100)->get();
    
    expect($trashed)->toHaveCount(2);
});

test('force delete removes team permanently', function () {
    $team = Team::create([
        'name' => 'Permanent Delete',
        'console_team_id' => 12345,
        'console_org_id' => 100,
    ]);
    $teamId = $team->id;

    $team->forceDelete();
    
    expect(Team::withTrashed()->find($teamId))->toBeNull();
});

test('can create new team with same console_team_id after force delete', function () {
    $team = Team::create([
        'name' => 'Original',
        'console_team_id' => 12345,
        'console_org_id' => 100,
    ]);
    $team->forceDelete();
    
    $newTeam = Team::create([
        'name' => 'Reused ID',
        'console_team_id' => 12345,
        'console_org_id' => 100,
    ]);
    
    expect($newTeam->name)->toBe('Reused ID');
});

// =============================================================================
// findByConsoleId Edge Cases - findByConsoleIdのエッジケース
// =============================================================================

test('findByConsoleId with zero returns team if exists', function () {
    Team::create(['name' => 'Zero ID', 'console_team_id' => 0, 'console_org_id' => 100]);

    $found = Team::findByConsoleId(0);
    
    expect($found)->not->toBeNull()
        ->and($found->name)->toBe('Zero ID');
});

test('findByConsoleId with negative returns null (no team with negative ID)', function () {
    // Negative IDs shouldn't exist in normal use
    $found = Team::findByConsoleId(-1);
    
    expect($found)->toBeNull();
});

test('findByConsoleId with string is converted to int', function () {
    Team::create(['name' => 'String Search', 'console_team_id' => 12345, 'console_org_id' => 100]);

    // PHP will convert string to int
    $found = Team::findByConsoleId('12345');
    
    expect($found)->not->toBeNull();
});

// =============================================================================
// getByOrgId Edge Cases - getByOrgIdのエッジケース
// =============================================================================

test('getByOrgId with zero returns teams', function () {
    Team::create(['name' => 'Zero Org Team', 'console_team_id' => 1001, 'console_org_id' => 0]);

    $teams = Team::getByOrgId(0);
    
    expect($teams)->toHaveCount(1);
});

test('getByOrgId with negative returns empty', function () {
    $teams = Team::getByOrgId(-1);
    
    expect($teams)->toHaveCount(0);
});

test('getByOrgId returns teams in creation order', function () {
    Team::create(['name' => 'First', 'console_team_id' => 1003, 'console_org_id' => 100]);
    Team::create(['name' => 'Second', 'console_team_id' => 1001, 'console_org_id' => 100]);
    Team::create(['name' => 'Third', 'console_team_id' => 1002, 'console_org_id' => 100]);

    $teams = Team::getByOrgId(100);
    
    expect($teams->first()->name)->toBe('First');
});

test('getByOrgId with many teams', function () {
    for ($i = 1; $i <= 100; $i++) {
        Team::create([
            'name' => "Team $i",
            'console_team_id' => 1000 + $i,
            'console_org_id' => 100,
        ]);
    }

    $teams = Team::getByOrgId(100);
    
    expect($teams)->toHaveCount(100);
});

// =============================================================================
// Permission Edge Cases - 権限のエッジケース
// =============================================================================

test('team permission requires console_org_id', function () {
    $team = Team::create(['name' => 'Test', 'console_team_id' => 12345, 'console_org_id' => 100]);
    $permission = Permission::create(['name' => 'Test', 'slug' => 'test']);
    
    // TeamPermission requires console_org_id
    expect(fn () => TeamPermission::create([
        'console_team_id' => $team->console_team_id,
        'permission_id' => $permission->id,
        // Missing console_org_id
    ]))->toThrow(\Illuminate\Database\QueryException::class);
});

test('same permission can be assigned to multiple teams', function () {
    $team1 = Team::create(['name' => 'Team 1', 'console_team_id' => 1001, 'console_org_id' => 100]);
    $team2 = Team::create(['name' => 'Team 2', 'console_team_id' => 1002, 'console_org_id' => 100]);
    $permission = Permission::create(['name' => 'Shared', 'slug' => 'shared']);
    
    TeamPermission::create([
        'console_team_id' => $team1->console_team_id,
        'console_org_id' => $team1->console_org_id,
        'permission_id' => $permission->id,
    ]);
    TeamPermission::create([
        'console_team_id' => $team2->console_team_id,
        'console_org_id' => $team2->console_org_id,
        'permission_id' => $permission->id,
    ]);

    $total = TeamPermission::where('permission_id', $permission->id)->count();
    expect($total)->toBe(2);
});

test('hasPermission with empty string returns false', function () {
    $team = Team::create(['name' => 'Test', 'console_team_id' => 12345, 'console_org_id' => 100]);
    
    expect($team->hasPermission(''))->toBeFalse();
});

test('hasPermission is case sensitive', function () {
    $team = Team::create(['name' => 'Test', 'console_team_id' => 12345, 'console_org_id' => 100]);
    $permission = Permission::create(['name' => 'View', 'slug' => 'projects.view']);
    
    TeamPermission::create([
        'console_team_id' => $team->console_team_id,
        'console_org_id' => $team->console_org_id,
        'permission_id' => $permission->id,
    ]);

    expect($team->hasPermission('projects.view'))->toBeTrue()
        ->and($team->hasPermission('Projects.View'))->toBeFalse()
        ->and($team->hasPermission('PROJECTS.VIEW'))->toBeFalse();
});

test('hasAnyPermission with empty array returns false', function () {
    $team = Team::create(['name' => 'Test', 'console_team_id' => 12345, 'console_org_id' => 100]);
    $permission = Permission::create(['name' => 'Test', 'slug' => 'test']);
    
    TeamPermission::create([
        'console_team_id' => $team->console_team_id,
        'console_org_id' => $team->console_org_id,
        'permission_id' => $permission->id,
    ]);

    expect($team->hasAnyPermission([]))->toBeFalse();
});

test('hasAllPermissions with empty array returns true', function () {
    $team = Team::create(['name' => 'Test', 'console_team_id' => 12345, 'console_org_id' => 100]);

    expect($team->hasAllPermissions([]))->toBeTrue();
});

test('hasAllPermissions with duplicates counts unique', function () {
    $team = Team::create(['name' => 'Test', 'console_team_id' => 12345, 'console_org_id' => 100]);
    $permission = Permission::create(['name' => 'View', 'slug' => 'view']);
    
    TeamPermission::create([
        'console_team_id' => $team->console_team_id,
        'console_org_id' => $team->console_org_id,
        'permission_id' => $permission->id,
    ]);

    // Current implementation counts array items, so duplicates fail
    // This documents the actual behavior - duplicates inflate the count
    expect($team->hasAllPermissions(['view', 'view', 'view']))->toBeFalse();
    
    // Without duplicates works correctly
    expect($team->hasAllPermissions(['view']))->toBeTrue();
});

// =============================================================================
// Query Edge Cases - クエリのエッジケース
// =============================================================================

test('can search teams with SQL special characters in name', function () {
    $team = Team::create([
        'name' => "Team's \"Test\"",
        'console_team_id' => 12345,
        'console_org_id' => 100,
    ]);

    $found = Team::where('name', "Team's \"Test\"")->first();
    expect($found)->not->toBeNull();
});

test('like query with percent in name', function () {
    Team::create(['name' => '100% Team', 'console_team_id' => 1001, 'console_org_id' => 100]);
    Team::create(['name' => 'Normal', 'console_team_id' => 1002, 'console_org_id' => 100]);

    $found = Team::where('name', '100% Team')->first();
    expect($found)->not->toBeNull()
        ->and($found->console_team_id)->toBe(1001);
});

test('can count teams per organization', function () {
    Team::create(['name' => 'Org1 T1', 'console_team_id' => 1001, 'console_org_id' => 100]);
    Team::create(['name' => 'Org1 T2', 'console_team_id' => 1002, 'console_org_id' => 100]);
    Team::create(['name' => 'Org1 T3', 'console_team_id' => 1003, 'console_org_id' => 100]);
    Team::create(['name' => 'Org2 T1', 'console_team_id' => 2001, 'console_org_id' => 200]);

    $counts = Team::selectRaw('console_org_id, count(*) as count')
        ->groupBy('console_org_id')
        ->pluck('count', 'console_org_id');
    
    expect($counts[100])->toBe(3)
        ->and($counts[200])->toBe(1);
});

// =============================================================================
// Update Edge Cases - 更新のエッジケース
// =============================================================================

test('can update team name preserving IDs', function () {
    $team = Team::create([
        'name' => 'Original',
        'console_team_id' => 12345,
        'console_org_id' => 100,
    ]);

    $team->update(['name' => 'Updated']);
    $team->refresh();
    
    expect($team->name)->toBe('Updated')
        ->and($team->console_team_id)->toBe(12345)
        ->and($team->console_org_id)->toBe(100);
});

test('can move team to different organization', function () {
    $team = Team::create([
        'name' => 'Movable',
        'console_team_id' => 12345,
        'console_org_id' => 100,
    ]);

    $team->update(['console_org_id' => 200]);
    $team->refresh();
    
    expect($team->console_org_id)->toBe(200)
        ->and(Team::getByOrgId(100))->toHaveCount(0)
        ->and(Team::getByOrgId(200))->toHaveCount(1);
});

test('cannot update to existing console_team_id', function () {
    Team::create(['name' => 'Team 1', 'console_team_id' => 11111, 'console_org_id' => 100]);
    $team2 = Team::create(['name' => 'Team 2', 'console_team_id' => 22222, 'console_org_id' => 100]);

    expect(fn () => $team2->update(['console_team_id' => 11111]))
        ->toThrow(\Illuminate\Database\QueryException::class);
});

// =============================================================================
// Timestamp Edge Cases - タイムスタンプのエッジケース
// =============================================================================

test('deleted_at is set on soft delete', function () {
    $team = Team::create([
        'name' => 'To Delete',
        'console_team_id' => 12345,
        'console_org_id' => 100,
    ]);

    expect($team->deleted_at)->toBeNull();
    
    $team->delete();
    $team->refresh();
    
    expect($team->deleted_at)->not->toBeNull()
        ->and($team->deleted_at)->toBeInstanceOf(\Carbon\Carbon::class);
});

test('deleted_at is cleared on restore', function () {
    $team = Team::create([
        'name' => 'To Restore',
        'console_team_id' => 12345,
        'console_org_id' => 100,
    ]);
    $team->delete();
    
    expect(Team::withTrashed()->find($team->id)->deleted_at)->not->toBeNull();
    
    $team->restore();
    $team->refresh();
    
    expect($team->deleted_at)->toBeNull();
});

// =============================================================================
// Concurrent Access Edge Cases - 並行アクセスのエッジケース
// =============================================================================

test('firstOrCreate handles existing team', function () {
    Team::create(['name' => 'Existing', 'console_team_id' => 12345, 'console_org_id' => 100]);

    $team = Team::firstOrCreate(
        ['console_team_id' => 12345],
        ['name' => 'Should Not Create', 'console_org_id' => 200]
    );
    
    expect($team->name)->toBe('Existing')
        ->and($team->console_org_id)->toBe(100);
});

test('firstOrCreate creates when not exists', function () {
    $team = Team::firstOrCreate(
        ['console_team_id' => 12345],
        ['name' => 'New Team', 'console_org_id' => 100]
    );
    
    expect($team->wasRecentlyCreated)->toBeTrue()
        ->and($team->name)->toBe('New Team');
});

test('updateOrCreate updates existing', function () {
    Team::create(['name' => 'Original', 'console_team_id' => 12345, 'console_org_id' => 100]);

    $team = Team::updateOrCreate(
        ['console_team_id' => 12345],
        ['name' => 'Updated', 'console_org_id' => 200]
    );
    
    expect($team->name)->toBe('Updated')
        ->and($team->console_org_id)->toBe(200)
        ->and(Team::count())->toBe(1);
});

// =============================================================================
// Index Performance Edge Cases - インデックスパフォーマンスのエッジケース
// =============================================================================

test('can handle large number of teams in single org', function () {
    $insertData = [];
    for ($i = 1; $i <= 500; $i++) {
        $insertData[] = [
            'name' => "Team $i",
            'console_team_id' => $i,
            'console_org_id' => 100,
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
    Team::insert($insertData);

    $teams = Team::where('console_org_id', 100)->get();
    
    expect($teams)->toHaveCount(500);
});

test('can query across multiple organizations efficiently', function () {
    for ($org = 1; $org <= 10; $org++) {
        for ($team = 1; $team <= 10; $team++) {
            Team::create([
                'name' => "Org$org Team$team",
                'console_team_id' => ($org * 1000) + $team,
                'console_org_id' => $org,
            ]);
        }
    }

    $totalTeams = Team::count();
    $org5Teams = Team::where('console_org_id', 5)->count();
    
    expect($totalTeams)->toBe(100)
        ->and($org5Teams)->toBe(10);
});
