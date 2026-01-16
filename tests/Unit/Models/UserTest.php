<?php

/**
 * User Model Unit Tests
 *
 * ユーザーモデルのユニットテスト
 * Kiểm thử đơn vị cho Model User
 */

use Omnify\SsoClient\Models\User;
use Omnify\SsoClient\Models\Role;
use Illuminate\Support\Facades\Hash;
use Illuminate\Contracts\Auth\Authenticatable as AuthenticatableContract;
use Illuminate\Contracts\Auth\Access\Authorizable as AuthorizableContract;
use Illuminate\Contracts\Auth\CanResetPassword as CanResetPasswordContract;

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
        'password' => 'password123',
    ]);

    expect($user)->toBeInstanceOf(User::class)
        ->and($user->name)->toBe('Test User')
        ->and($user->email)->toBe('test@example.com')
        ->and($user->id)->toBeInt();
});

test('can create user with all fields', function () {
    $role = Role::create(['name' => 'Admin', 'slug' => 'admin', 'level' => 100]);
    
    $user = User::create([
        'name' => 'Full User',
        'email' => 'full@example.com',
        'password' => 'password123',
        'email_verified_at' => now(),
        'console_user_id' => 12345,
        'console_access_token' => 'access_token_123',
        'console_refresh_token' => 'refresh_token_123',
        'console_token_expires_at' => now()->addHour(),
        'role_id' => $role->id,
    ]);

    expect($user->name)->toBe('Full User')
        ->and($user->email)->toBe('full@example.com')
        ->and($user->console_user_id)->toBe(12345)
        ->and($user->role_id)->toBe($role->id);
});

test('email must be unique', function () {
    User::create([
        'name' => 'User 1',
        'email' => 'same@example.com',
        'password' => 'password123',
    ]);

    expect(fn () => User::create([
        'name' => 'User 2',
        'email' => 'same@example.com',
        'password' => 'password123',
    ]))->toThrow(\Illuminate\Database\QueryException::class);
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

test('user implements can reset password contract', function () {
    $user = new User();
    
    expect($user)->toBeInstanceOf(CanResetPasswordContract::class);
});

test('password is automatically hashed', function () {
    $user = User::create([
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'plain_password',
    ]);

    // Password should not be stored as plain text
    expect($user->password)->not->toBe('plain_password')
        ->and(Hash::check('plain_password', $user->password))->toBeTrue();
});

test('getAuthIdentifierName returns id', function () {
    $user = new User();
    
    expect($user->getAuthIdentifierName())->toBe('id');
});

test('getAuthIdentifier returns user id', function () {
    $user = User::create([
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password123',
    ]);

    expect($user->getAuthIdentifier())->toBe($user->id);
});

test('getAuthPassword returns password hash', function () {
    $user = User::create([
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password123',
    ]);

    expect($user->getAuthPassword())->toBe($user->password);
});

// =============================================================================
// Hidden Attributes Tests - 非表示属性テスト
// =============================================================================

test('password is hidden in array', function () {
    $user = User::create([
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password123',
    ]);

    $array = $user->toArray();
    
    expect($array)->not->toHaveKey('password');
});

test('remember token is hidden in array', function () {
    $user = User::create([
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password123',
        'remember_token' => 'some_token',
    ]);

    $array = $user->toArray();
    
    expect($array)->not->toHaveKey('remember_token');
});

test('console tokens are hidden in array', function () {
    $user = User::create([
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password123',
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

test('email_verified_at is cast to datetime', function () {
    $user = User::create([
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password123',
        'email_verified_at' => '2024-01-15 10:00:00',
    ]);

    expect($user->email_verified_at)->toBeInstanceOf(\Carbon\Carbon::class);
});

test('console_user_id is cast to integer', function () {
    $user = User::create([
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password123',
        'console_user_id' => '12345',
    ]);

    expect($user->console_user_id)->toBeInt()
        ->and($user->console_user_id)->toBe(12345);
});

test('console_token_expires_at is cast to datetime', function () {
    $user = User::create([
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password123',
        'console_token_expires_at' => '2024-01-15 10:00:00',
    ]);

    expect($user->console_token_expires_at)->toBeInstanceOf(\Carbon\Carbon::class);
});

// =============================================================================
// Relationship Tests - リレーションシップテスト
// =============================================================================

test('user belongs to role', function () {
    $role = Role::create(['name' => 'Admin', 'slug' => 'admin', 'level' => 100]);
    $user = User::create([
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password123',
        'role_id' => $role->id,
    ]);

    expect($user->role)->toBeInstanceOf(Role::class)
        ->and($user->role->id)->toBe($role->id)
        ->and($user->role->name)->toBe('Admin');
});

test('user role can be null', function () {
    $user = User::create([
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password123',
    ]);

    expect($user->role)->toBeNull();
});

test('user can change role', function () {
    $role1 = Role::create(['name' => 'Member', 'slug' => 'member', 'level' => 10]);
    $role2 = Role::create(['name' => 'Admin', 'slug' => 'admin', 'level' => 100]);
    
    $user = User::create([
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password123',
        'role_id' => $role1->id,
    ]);

    expect($user->role->slug)->toBe('member');
    
    $user->update(['role_id' => $role2->id]);
    $user->refresh();
    
    expect($user->role->slug)->toBe('admin');
});

// =============================================================================
// Console SSO Fields Tests - Console SSOフィールドテスト
// =============================================================================

test('can store console sso fields', function () {
    $expiresAt = now()->addHour();
    
    $user = User::create([
        'name' => 'SSO User',
        'email' => 'sso@example.com',
        'password' => 'password123',
        'console_user_id' => 99999,
        'console_access_token' => 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
        'console_refresh_token' => 'refresh_token_abc123',
        'console_token_expires_at' => $expiresAt,
    ]);

    expect($user->console_user_id)->toBe(99999)
        ->and($user->console_access_token)->toBe('eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...')
        ->and($user->console_refresh_token)->toBe('refresh_token_abc123')
        ->and($user->console_token_expires_at->format('Y-m-d H:i'))->toBe($expiresAt->format('Y-m-d H:i'));
});

test('console fields can be null', function () {
    $user = User::create([
        'name' => 'Local User',
        'email' => 'local@example.com',
        'password' => 'password123',
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
        'password' => 'password123',
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

// =============================================================================
// Query Tests - クエリテスト
// =============================================================================

test('can find user by email', function () {
    User::create([
        'name' => 'Test User',
        'email' => 'findme@example.com',
        'password' => 'password123',
    ]);

    $found = User::where('email', 'findme@example.com')->first();
    
    expect($found)->not->toBeNull()
        ->and($found->name)->toBe('Test User');
});

test('can find user by console_user_id', function () {
    User::create([
        'name' => 'Console User',
        'email' => 'console@example.com',
        'password' => 'password123',
        'console_user_id' => 77777,
    ]);

    $found = User::where('console_user_id', 77777)->first();
    
    expect($found)->not->toBeNull()
        ->and($found->email)->toBe('console@example.com');
});

test('can filter users by role', function () {
    $adminRole = Role::create(['name' => 'Admin', 'slug' => 'admin', 'level' => 100]);
    $memberRole = Role::create(['name' => 'Member', 'slug' => 'member', 'level' => 10]);
    
    User::create(['name' => 'Admin 1', 'email' => 'admin1@example.com', 'password' => 'p', 'role_id' => $adminRole->id]);
    User::create(['name' => 'Admin 2', 'email' => 'admin2@example.com', 'password' => 'p', 'role_id' => $adminRole->id]);
    User::create(['name' => 'Member 1', 'email' => 'member1@example.com', 'password' => 'p', 'role_id' => $memberRole->id]);

    $admins = User::where('role_id', $adminRole->id)->get();
    
    expect($admins)->toHaveCount(2);
});

test('can get verified users', function () {
    User::create(['name' => 'Verified', 'email' => 'verified@example.com', 'password' => 'p', 'email_verified_at' => now()]);
    User::create(['name' => 'Unverified', 'email' => 'unverified@example.com', 'password' => 'p']);

    $verified = User::whereNotNull('email_verified_at')->get();
    
    expect($verified)->toHaveCount(1)
        ->and($verified->first()->name)->toBe('Verified');
});

// =============================================================================
// Timestamp Tests - タイムスタンプテスト
// =============================================================================

test('timestamps are automatically set', function () {
    $user = User::create([
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password123',
    ]);

    expect($user->created_at)->not->toBeNull()
        ->and($user->updated_at)->not->toBeNull()
        ->and($user->created_at)->toBeInstanceOf(\Carbon\Carbon::class);
});

test('updated_at changes on update', function () {
    $user = User::create([
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password123',
    ]);
    
    $originalUpdatedAt = $user->updated_at;
    
    // Wait a moment to ensure timestamp difference
    usleep(100000); // 0.1 second
    
    $user->update(['name' => 'Updated Name']);
    
    expect($user->updated_at->gte($originalUpdatedAt))->toBeTrue();
});
