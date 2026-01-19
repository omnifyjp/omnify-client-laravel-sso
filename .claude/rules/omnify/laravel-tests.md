# Testing Rules (PEST)

## Test Naming Convention (Japanese Style)

```php
describe('UserController', function () {
    // 正常系 (Happy Path)
    describe('正常系', function () {
        test('一覧が取得できる', function () { ... });
        test('新規作成ができる', function () { ... });
    });
    
    // 異常系 (Error Cases)
    describe('異常系', function () {
        test('認証なしで401', function () { ... });
        test('存在しないIDで404', function () { ... });
    });
});
```

## Required Setup

```php
uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->actingAs($this->user);
});
```

## Assertion Patterns

```php
// API Response
$response->assertStatus(200)
    ->assertJsonStructure(['data' => ['id', 'name']]);

// Database
$this->assertDatabaseHas('users', ['email' => 'test@example.com']);
$this->assertDatabaseMissing('users', ['id' => $user->id]);
$this->assertDatabaseCount('users', 3);
```

## Full Documentation

See @.claude/omnify/guides/laravel/testing.md for complete patterns.