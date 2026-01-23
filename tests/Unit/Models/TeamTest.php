<?php

/**
 * Team Model Unit Tests
 *
 * チームモデルのユニットテスト
 * Kiểm thử đơn vị cho Model Team
 */

use Illuminate\Support\Str;
use Omnify\SsoClient\Models\TeamCache as Team;

beforeEach(function () {
    $this->artisan('migrate', ['--database' => 'testing']);
});

// =============================================================================
// Basic Model Tests - 基本モデルテスト
// =============================================================================

test('can create team with required fields', function () {
    $consoleTeamId = (string) Str::uuid();
    $consoleOrgId = (string) Str::uuid();

    $team = Team::create([
        'console_team_id' => $consoleTeamId,
        'console_org_id' => $consoleOrgId,
        'name' => 'Development Team',
    ]);

    expect($team)->toBeInstanceOf(Team::class)
        ->and($team->console_team_id)->toBe($consoleTeamId)
        ->and($team->console_org_id)->toBe($consoleOrgId)
        ->and($team->name)->toBe('Development Team')
        ->and($team->id)->toBeString()
        ->and(Str::isUuid($team->id))->toBeTrue();
});

test('team id is uuid', function () {
    $team = Team::factory()->create();

    expect($team->id)->toBeString()
        ->and(Str::isUuid($team->id))->toBeTrue();
});

test('console_team_id must be unique', function () {
    $consoleTeamId = (string) Str::uuid();

    Team::factory()->create(['console_team_id' => $consoleTeamId]);

    expect(fn () => Team::factory()->create(['console_team_id' => $consoleTeamId]))
        ->toThrow(\Illuminate\Database\QueryException::class);
});

// =============================================================================
// Query Tests - クエリテスト
// =============================================================================

test('can find team by console_team_id', function () {
    $consoleTeamId = (string) Str::uuid();

    Team::factory()->create([
        'console_team_id' => $consoleTeamId,
        'name' => 'Test Team',
    ]);

    $found = Team::where('console_team_id', $consoleTeamId)->first();

    expect($found)->not->toBeNull()
        ->and($found->name)->toBe('Test Team');
});

test('can filter teams by organization', function () {
    $orgId1 = (string) Str::uuid();
    $orgId2 = (string) Str::uuid();

    Team::factory()->count(3)->forOrganization($orgId1)->create();
    Team::factory()->count(2)->forOrganization($orgId2)->create();

    $org1Teams = Team::where('console_org_id', $orgId1)->get();

    expect($org1Teams)->toHaveCount(3);
});

test('can search teams by name', function () {
    $orgId = (string) Str::uuid();

    Team::factory()->forOrganization($orgId)->create(['name' => 'Development Team']);
    Team::factory()->forOrganization($orgId)->create(['name' => 'Marketing Team']);
    Team::factory()->forOrganization($orgId)->create(['name' => 'Sales Team']);

    $devTeams = Team::where('name', 'like', '%Development%')->get();

    expect($devTeams)->toHaveCount(1)
        ->and($devTeams->first()->name)->toBe('Development Team');
});

// =============================================================================
// Soft Delete Tests - ソフトデリートテスト
// =============================================================================

test('team uses soft deletes', function () {
    $team = Team::factory()->create();
    $teamId = $team->id;

    $team->delete();

    // Cannot find with normal query
    expect(Team::find($teamId))->toBeNull();

    // Can find with trashed
    expect(Team::withTrashed()->find($teamId))->not->toBeNull();
});

test('soft deleted team can be restored', function () {
    $team = Team::factory()->create();
    $teamId = $team->id;

    $team->delete();

    Team::withTrashed()->find($teamId)->restore();

    expect(Team::find($teamId))->not->toBeNull();
});

// =============================================================================
// Factory Tests - ファクトリーテスト
// =============================================================================

test('factory creates valid team', function () {
    $team = Team::factory()->create();

    expect($team)->toBeInstanceOf(Team::class)
        ->and($team->id)->toBeString()
        ->and(Str::isUuid($team->id))->toBeTrue()
        ->and(Str::isUuid($team->console_team_id))->toBeTrue()
        ->and(Str::isUuid($team->console_org_id))->toBeTrue()
        ->and($team->name)->toBeString();
});

test('factory forOrganization creates teams for same org', function () {
    $orgId = (string) Str::uuid();

    $teams = Team::factory()->count(3)->forOrganization($orgId)->create();

    expect($teams)->toHaveCount(3);
    foreach ($teams as $team) {
        expect($team->console_org_id)->toBe($orgId);
    }
});

// =============================================================================
// Timestamp Tests - タイムスタンプテスト
// =============================================================================

test('timestamps are automatically set', function () {
    $team = Team::factory()->create();

    expect($team->created_at)->not->toBeNull()
        ->and($team->updated_at)->not->toBeNull()
        ->and($team->created_at)->toBeInstanceOf(\Carbon\Carbon::class);
});
