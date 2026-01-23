<?php

/**
 * Branch Model Unit Tests
 *
 * 支店モデルのユニットテスト
 * Kiểm thử đơn vị cho Model Branch
 */

use Illuminate\Support\Str;
use Omnify\SsoClient\Models\BranchCache as Branch;

beforeEach(function () {
    $this->artisan('migrate', ['--database' => 'testing']);
});

// =============================================================================
// Basic Model Tests - 基本モデルテスト
// =============================================================================

test('can create branch with required fields', function () {
    $consoleBranchId = (string) Str::uuid();
    $consoleOrgId = (string) Str::uuid();

    $branch = Branch::create([
        'console_branch_id' => $consoleBranchId,
        'console_org_id' => $consoleOrgId,
        'code' => 'HQ',
        'name' => 'Headquarters',
    ]);

    expect($branch)->toBeInstanceOf(Branch::class)
        ->and($branch->console_branch_id)->toBe($consoleBranchId)
        ->and($branch->console_org_id)->toBe($consoleOrgId)
        ->and($branch->code)->toBe('HQ')
        ->and($branch->name)->toBe('Headquarters')
        ->and($branch->id)->toBeString()
        ->and(Str::isUuid($branch->id))->toBeTrue();
});

test('branch id is uuid', function () {
    $branch = Branch::factory()->create();

    expect($branch->id)->toBeString()
        ->and(Str::isUuid($branch->id))->toBeTrue();
});

test('console_branch_id must be unique', function () {
    $consoleBranchId = (string) Str::uuid();

    Branch::factory()->create(['console_branch_id' => $consoleBranchId]);

    expect(fn () => Branch::factory()->create(['console_branch_id' => $consoleBranchId]))
        ->toThrow(\Illuminate\Database\QueryException::class);
});

// =============================================================================
// Query Tests - クエリテスト
// =============================================================================

test('can find branch by console_branch_id', function () {
    $consoleBranchId = (string) Str::uuid();

    Branch::factory()->create([
        'console_branch_id' => $consoleBranchId,
        'name' => 'Test Branch',
    ]);

    $found = Branch::where('console_branch_id', $consoleBranchId)->first();

    expect($found)->not->toBeNull()
        ->and($found->name)->toBe('Test Branch');
});

test('can filter branches by organization', function () {
    $orgId1 = (string) Str::uuid();
    $orgId2 = (string) Str::uuid();

    Branch::factory()->count(3)->forOrganization($orgId1)->create();
    Branch::factory()->count(2)->forOrganization($orgId2)->create();

    $org1Branches = Branch::where('console_org_id', $orgId1)->get();

    expect($org1Branches)->toHaveCount(3);
});

test('can find branch by code within organization', function () {
    $orgId = (string) Str::uuid();

    Branch::factory()->forOrganization($orgId)->create(['code' => 'HQ', 'name' => 'Head Office']);
    Branch::factory()->forOrganization($orgId)->create(['code' => 'BR1', 'name' => 'Branch 1']);

    $hq = Branch::where('console_org_id', $orgId)->where('code', 'HQ')->first();

    expect($hq)->not->toBeNull()
        ->and($hq->name)->toBe('Head Office');
});

// =============================================================================
// Soft Delete Tests - ソフトデリートテスト
// =============================================================================

test('branch uses soft deletes', function () {
    $branch = Branch::factory()->create();
    $branchId = $branch->id;

    $branch->delete();

    // Cannot find with normal query
    expect(Branch::find($branchId))->toBeNull();

    // Can find with trashed
    expect(Branch::withTrashed()->find($branchId))->not->toBeNull();
});

test('soft deleted branch can be restored', function () {
    $branch = Branch::factory()->create();
    $branchId = $branch->id;

    $branch->delete();

    Branch::withTrashed()->find($branchId)->restore();

    expect(Branch::find($branchId))->not->toBeNull();
});

// =============================================================================
// Factory Tests - ファクトリーテスト
// =============================================================================

test('factory creates valid branch', function () {
    $branch = Branch::factory()->create();

    expect($branch)->toBeInstanceOf(Branch::class)
        ->and($branch->id)->toBeString()
        ->and(Str::isUuid($branch->id))->toBeTrue()
        ->and(Str::isUuid($branch->console_branch_id))->toBeTrue()
        ->and(Str::isUuid($branch->console_org_id))->toBeTrue()
        ->and($branch->code)->toBeString()
        ->and($branch->name)->toBeString();
});

test('factory forOrganization creates branches for same org', function () {
    $orgId = (string) Str::uuid();

    $branches = Branch::factory()->count(3)->forOrganization($orgId)->create();

    expect($branches)->toHaveCount(3);
    foreach ($branches as $branch) {
        expect($branch->console_org_id)->toBe($orgId);
    }
});

test('factory headquarters creates HQ branch', function () {
    $branch = Branch::factory()->headquarters()->create();

    expect($branch->code)->toBe('HQ')
        ->and($branch->name)->toBe('Headquarters');
});

// =============================================================================
// Timestamp Tests - タイムスタンプテスト
// =============================================================================

test('timestamps are automatically set', function () {
    $branch = Branch::factory()->create();

    expect($branch->created_at)->not->toBeNull()
        ->and($branch->updated_at)->not->toBeNull()
        ->and($branch->created_at)->toBeInstanceOf(\Carbon\Carbon::class);
});
