<?php

/**
 * User Model Unit Tests
 *
 * ユーザーモデルのユニットテスト
 * Kiểm thử đơn vị cho Model User
 * 
 * Updated for UUID primary keys and ManyToMany roles
 */

use Omnify\SsoClient\Models\User;
use Omnify\SsoClient\Models\Role;
use Illuminate\Contracts\Auth\Authenticatable as AuthenticatableContract;
use Illuminate\Contracts\Auth\Access\Authorizable as AuthorizableContract;
use Illuminate\Support\Str;

beforeEach(function () {
    $this->artisan('migrate', ['--database' => 'testing']);
});

// =============================================================================
// Basic Model Tests - 基本モデルテスト
// =============================================================================

test('can create user with required fields', function () {
    $user = User::create([
        'name' => 'Test User',
        'email' => 'test@example.com',
    ]);

    expect($user)->toBeInstanceOf(User::class)
        ->and($user->name)->toBe('Test User')
        ->and($user->email)->toBe('test@example.com')
        ->and($user->id)->toBeString()
        ->and(Str::isUuid($user->id))->toBeTrue();
});

test('can create user with all fields', function () {
    $consoleUserId = (string) Str::uuid();
    
    $user = User::create([
        'name' => 'Full User',
        'email' => 'full@example.com',
        'console_user_id' => $consoleUserId,
        'console_access_token' => 'access_token_123',
        'console_refresh_token' => 'refresh_token_123',
        'console_token_expires_at' => now()->addHour(),
    ]);

    expect($user->name)->toBe('Full User')
        ->and($user->email)->toBe('full@example.com')
        ->and($user->console_user_id)->toBe($consoleUserId);
});

test('email must be unique', function () {
    User::create([
        'name' => 'User 1',
        'email' => 'same@example.com',
    ]);

    expect(fn () => User::create([
        'name' => 'User 2',
        'email' => 'same@example.com',
    ]))->toThrow(\Illuminate\Database\QueryException::class);
});

test('user id is uuid', function () {
    $user = User::create([
        'name' => 'Test User',
        'email' => 'test@example.com',
    ]);

    expect($user->id)->toBeString()
        ->and(Str::isUuid($user->id))->toBeTrue();
});

// =============================================================================
// Authentication Contract Tests - 認証コントラクトテスト
// =============================================================================

test('user implements authenticatable contract', function () {
    $user = new User();
    
    expect($user)->toBeInstanceOf(AuthenticatableContract::class);
});

test('user implements authorizable contract', function () {
    $user = new User();
    
    expect($user)->toBeInstanceOf(AuthorizableContract::class);
});

test('getAuthIdentifierName returns id', function () {
    $user = new User();
    
    expect($user->getAuthIdentifierName())->toBe('id');
});

test('getAuthIdentifier returns user id (uuid)', function () {
    $user = User::create([
        'name' => 'Test User',
        'email' => 'test@example.com',
    ]);

    expect($user->getAuthIdentifier())->toBe($user->id)
        ->and(Str::isUuid($user->getAuthIdentifier()))->toBeTrue();
});

// =============================================================================
// Hidden Attributes Tests - 非表示属性テスト
// =============================================================================

test('console tokens are hidden in array', function () {
    $user = User::create([
        'name' => 'Test User',
        'email' => 'test@example.com',
        'console_access_token' => 'access_token',
        'console_refresh_token' => 'refresh_token',
    ]);

    $array = $user->toArray();
    
    expect($array)->not->toHaveKey('console_access_token')
        ->and($array)->not->toHaveKey('console_refresh_token');
});

// =============================================================================
// Casting Tests - キャストテスト
// =============================================================================

test('console_token_expires_at is cast to datetime', function () {
    $user = User::create([
        'name' => 'Test User',
        'email' => 'test@example.com',
        'console_token_expires_at' => '2024-01-15 10:00:00',
    ]);

    expect($user->console_token_expires_at)->toBeInstanceOf(\Carbon\Carbon::class);
});

// =============================================================================
// Relationship Tests - リレーションシップテスト (ManyToMany Roles)
// =============================================================================

test('user has many roles (ManyToMany)', function () {
    $role1 = Role::create(['name' => 'Admin', 'slug' => 'admin', 'level' => 100]);
    $role2 = Role::create(['name' => 'Editor', 'slug' => 'editor', 'level' => 50]);
    
    $user = User::create([
        'name' => 'Test User',
        'email' => 'test@example.com',
    ]);
    
    $user->roles()->attach([$role1->id, $role2->id]);

    expect($user->roles)->toHaveCount(2)
        ->and($user->roles->pluck('slug')->toArray())->toContain('admin', 'editor');
});

test('user can have no roles', function () {
    $user = User::create([
        'name' => 'Test User',
        'email' => 'test@example.com',
    ]);

    expect($user->roles)->toHaveCount(0);
});

test('user can sync roles', function () {
    $role1 = Role::create(['name' => 'Member', 'slug' => 'member', 'level' => 10]);
    $role2 = Role::create(['name' => 'Admin', 'slug' => 'admin', 'level' => 100]);
    $role3 = Role::create(['name' => 'Editor', 'slug' => 'editor', 'level' => 50]);
    
    $user = User::create([
        'name' => 'Test User',
        'email' => 'test@example.com',
    ]);
    
    $user->roles()->attach([$role1->id, $role2->id]);
    expect($user->roles)->toHaveCount(2);
    
    // Sync to different roles
    $user->roles()->sync([$role2->id, $role3->id]);
    $user->refresh();
    
    expect($user->roles)->toHaveCount(2)
        ->and($user->roles->pluck('slug')->toArray())->toContain('admin', 'editor')
        ->and($user->roles->pluck('slug')->toArray())->not->toContain('member');
});

test('user can detach all roles', function () {
    $role = Role::create(['name' => 'Admin', 'slug' => 'admin', 'level' => 100]);
    
    $user = User::create([
        'name' => 'Test User',
        'email' => 'test@example.com',
    ]);
    
    $user->roles()->attach($role->id);
    expect($user->roles)->toHaveCount(1);
    
    $user->roles()->detach();
    $user->refresh();
    
    expect($user->roles)->toHaveCount(0);
});

// =============================================================================
// Console SSO Fields Tests - Console SSOフィールドテスト
// =============================================================================

test('can store console sso fields', function () {
    $consoleUserId = (string) Str::uuid();
    $expiresAt = now()->addHour();
    
    $user = User::create([
        'name' => 'SSO User',
        'email' => 'sso@example.com',
        'console_user_id' => $consoleUserId,
        'console_access_token' => 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
        'console_refresh_token' => 'refresh_token_abc123',
        'console_token_expires_at' => $expiresAt,
    ]);

    expect($user->console_user_id)->toBe($consoleUserId)
        ->and($user->console_access_token)->toBe('eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...')
        ->and($user->console_refresh_token)->toBe('refresh_token_abc123')
        ->and($user->console_token_expires_at->format('Y-m-d H:i'))->toBe($expiresAt->format('Y-m-d H:i'));
});

test('console fields can be null', function () {
    $user = User::create([
        'name' => 'Local User',
        'email' => 'local@example.com',
    ]);

    expect($user->console_user_id)->toBeNull()
        ->and($user->console_access_token)->toBeNull()
        ->and($user->console_refresh_token)->toBeNull()
        ->and($user->console_token_expires_at)->toBeNull();
});

test('can update console tokens', function () {
    $user = User::create([
        'name' => 'SSO User',
        'email' => 'sso@example.com',
        'console_access_token' => 'old_token',
    ]);

    $user->update([
        'console_access_token' => 'new_token',
        'console_refresh_token' => 'new_refresh',
        'console_token_expires_at' => now()->addHours(2),
    ]);

    $user->refresh();
    
    expect($user->console_access_token)->toBe('new_token')
        ->and($user->console_refresh_token)->toBe('new_refresh');
});

test('console_user_id must be unique', function () {
    $consoleUserId = (string) Str::uuid();
    
    User::create([
        'name' => 'User 1',
        'email' => 'user1@example.com',
        'console_user_id' => $consoleUserId,
    ]);

    expect(fn () => User::create([
        'name' => 'User 2',
        'email' => 'user2@example.com',
        'console_user_id' => $consoleUserId,
    ]))->toThrow(\Illuminate\Database\QueryException::class);
});

// =============================================================================
// Query Tests - クエリテスト
// =============================================================================

test('can find user by email', function () {
    User::create([
        'name' => 'Test User',
        'email' => 'findme@example.com',
    ]);

    $found = User::where('email', 'findme@example.com')->first();
    
    expect($found)->not->toBeNull()
        ->and($found->name)->toBe('Test User');
});

test('can find user by console_user_id (uuid)', function () {
    $consoleUserId = (string) Str::uuid();
    
    User::create([
        'name' => 'Console User',
        'email' => 'console@example.com',
        'console_user_id' => $consoleUserId,
    ]);

    $found = User::where('console_user_id', $consoleUserId)->first();
    
    expect($found)->not->toBeNull()
        ->and($found->email)->toBe('console@example.com');
});

test('can filter users by role', function () {
    $adminRole = Role::create(['name' => 'Admin', 'slug' => 'admin', 'level' => 100]);
    $memberRole = Role::create(['name' => 'Member', 'slug' => 'member', 'level' => 10]);
    
    $admin1 = User::create(['name' => 'Admin 1', 'email' => 'admin1@example.com']);
    $admin2 = User::create(['name' => 'Admin 2', 'email' => 'admin2@example.com']);
    $member = User::create(['name' => 'Member 1', 'email' => 'member1@example.com']);
    
    $admin1->roles()->attach($adminRole->id);
    $admin2->roles()->attach($adminRole->id);
    $member->roles()->attach($memberRole->id);

    $admins = User::whereHas('roles', fn($q) => $q->where('slug', 'admin'))->get();
    
    expect($admins)->toHaveCount(2);
});

// =============================================================================
// Timestamp Tests - タイムスタンプテスト
// =============================================================================

test('timestamps are automatically set', function () {
    $user = User::create([
        'name' => 'Test User',
        'email' => 'test@example.com',
    ]);

    expect($user->created_at)->not->toBeNull()
        ->and($user->updated_at)->not->toBeNull()
        ->and($user->created_at)->toBeInstanceOf(\Carbon\Carbon::class);
});

test('updated_at changes on update', function () {
    $user = User::create([
        'name' => 'Test User',
        'email' => 'test@example.com',
    ]);
    
    $originalUpdatedAt = $user->updated_at;
    
    // Wait a moment to ensure timestamp difference
    usleep(100000); // 0.1 second
    
    $user->update(['name' => 'Updated Name']);
    
    expect($user->updated_at->gte($originalUpdatedAt))->toBeTrue();
});

// =============================================================================
// Factory Tests - ファクトリーテスト
// =============================================================================

test('factory creates valid user', function () {
    $user = User::factory()->create();
    
    expect($user)->toBeInstanceOf(User::class)
        ->and($user->id)->toBeString()
        ->and(Str::isUuid($user->id))->toBeTrue()
        ->and($user->name)->toBeString()
        ->and($user->email)->toBeString();
});

test('factory withoutTokens creates user without tokens', function () {
    $user = User::factory()->withoutTokens()->create();
    
    expect($user->console_access_token)->toBeNull()
        ->and($user->console_refresh_token)->toBeNull()
        ->and($user->console_token_expires_at)->toBeNull();
});

test('factory withExpiredTokens creates user with expired tokens', function () {
    $user = User::factory()->withExpiredTokens()->create();
    
    expect($user->console_token_expires_at)->not->toBeNull()
        ->and($user->console_token_expires_at->isPast())->toBeTrue();
});
