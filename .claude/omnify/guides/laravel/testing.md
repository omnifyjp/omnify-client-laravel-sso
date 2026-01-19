# Testing Guide (PEST)

> **Related:** [README](./README.md) | [Naming Conventions](./naming-conventions.md) | [Checklist](./checklist.md)

## Quick Start - How to Run Tests

```bash
# Run ALL tests (from project root - uses Docker wrapper)
./artisan test

# Run specific test file
./artisan test --filter=UserControllerTest

# Run specific test method
./artisan test --filter="creates user with valid data"

# Run with verbose output
./artisan test -v
```

> **Note:** The root `./artisan` script is a wrapper that runs `docker compose exec backend php artisan` automatically.

## Critical: Database Trait

**MUST use `RefreshDatabase` for SQLite in-memory testing:**

```php
// ✅ CORRECT - Use RefreshDatabase
use Illuminate\Foundation\Testing\RefreshDatabase;
uses(RefreshDatabase::class);

// ❌ WRONG - DatabaseTransactions doesn't run migrations
// Will fail with "no such table" error!
use Illuminate\Foundation\Testing\DatabaseTransactions;
uses(DatabaseTransactions::class);
```

| Trait                  | Database         | Behavior                                      |
| ---------------------- | ---------------- | --------------------------------------------- |
| `RefreshDatabase`      | SQLite in-memory | Runs migrations → truncates after each test   |
| `DatabaseTransactions` | MySQL/PostgreSQL | Only wraps in transaction (tables must exist) |

---

## Overview

This project uses **PEST** for testing. Every API endpoint MUST have tests covering:

- **Normal cases (正常系)** - Happy path, expected behavior
- **Abnormal cases (異常系)** - Validation errors, edge cases

**Principle**: If you can't test it, you can't ship it.

---

## Test Categories

| Category              | Description                       | HTTP Codes    |
| --------------------- | --------------------------------- | ------------- |
| **Normal (正常系)**   | Happy path, expected behavior     | 200, 201, 204 |
| **Abnormal (異常系)** | Validation errors, business rules | 422           |
| **Not Found**         | Resource doesn't exist            | 404           |
| **Auth Required**     | Unauthenticated request           | 401           |
| **Forbidden**         | Unauthorized action               | 403           |

---

## Test Structure

```
tests/
├── Feature/
│   ├── Api/                        # API endpoint tests
│   │   ├── UserControllerTest.php
│   │   └── PostControllerTest.php
│   └── Auth/                       # Authentication flow tests
│       ├── LoginTest.php
│       └── RegistrationTest.php
├── Unit/
│   ├── Services/                   # Service class tests
│   │   └── OrderServiceTest.php
│   ├── Models/                     # Model tests (accessors, scopes)
│   │   └── UserTest.php
│   └── Rules/                      # Custom validation rules
│       └── KatakanaRuleTest.php
└── Pest.php                        # PEST configuration
```

---

## Feature vs Unit Tests

### When to Use Feature Tests

**Feature tests** test the full HTTP request/response cycle.

```php
// ✅ Feature Test: Full HTTP cycle
// tests/Feature/Api/UserControllerTest.php
it('正常: creates user with valid data', function () {
    $response = $this->postJson('/api/users', validUserData());
    
    $response->assertCreated();
    $this->assertDatabaseHas('users', ['email' => 'test@example.com']);
});
```

**Use Feature tests for:**
- API endpoints (Controllers)
- Authentication flows (Login, Logout, Register)
- Middleware behavior
- Full request validation
- Database state verification

### When to Use Unit Tests

**Unit tests** test isolated classes/methods without HTTP.

```php
// ✅ Unit Test: Isolated logic
// tests/Unit/Services/OrderServiceTest.php
it('正常: calculates total with tax', function () {
    $service = new OrderService();
    
    $total = $service->calculateTotal(items: $items, taxRate: 0.1);
    
    expect($total)->toBe(1100);
});

// tests/Unit/Models/UserTest.php
it('正常: returns full name', function () {
    $user = new User([
        'name_lastname' => '田中',
        'name_firstname' => '太郎',
    ]);
    
    expect($user->name_full_name)->toBe('田中 太郎');
});
```

**Use Unit tests for:**
- Service/Action classes
- Model accessors/mutators
- Model scopes
- Helper functions
- Custom validation rules
- Pure business logic

### Decision Matrix

| What to Test    | Test Type | Location              |
| --------------- | --------- | --------------------- |
| API endpoint    | Feature   | `Feature/Api/`        |
| Login/Logout    | Feature   | `Feature/Auth/`       |
| Middleware      | Feature   | `Feature/Middleware/` |
| Service class   | Unit      | `Unit/Services/`      |
| Model accessor  | Unit      | `Unit/Models/`        |
| Custom rule     | Unit      | `Unit/Rules/`         |
| Helper function | Unit      | `Unit/Helpers/`       |

---

## Mocking & Faking

### Fake Mail

```php
use Illuminate\Support\Facades\Mail;
use App\Mail\WelcomeEmail;

it('正常: sends welcome email on registration', function () {
    Mail::fake();
    
    $this->postJson('/api/register', validUserData())
        ->assertCreated();
    
    Mail::assertSent(WelcomeEmail::class, function ($mail) {
        return $mail->hasTo('test@example.com');
    });
});

it('異常: does not send email on validation failure', function () {
    Mail::fake();
    
    $this->postJson('/api/register', [])
        ->assertUnprocessable();
    
    Mail::assertNothingSent();
});
```

### Fake Queue

```php
use Illuminate\Support\Facades\Queue;
use App\Jobs\ProcessOrder;

it('正常: dispatches job on order creation', function () {
    Queue::fake();
    
    $this->postJson('/api/orders', validOrderData())
        ->assertCreated();
    
    Queue::assertPushed(ProcessOrder::class);
});
```

### Fake Storage

```php
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;

it('正常: uploads avatar', function () {
    Storage::fake('public');
    
    $file = UploadedFile::fake()->image('avatar.jpg');
    
    $this->postJson('/api/users/avatar', ['avatar' => $file])
        ->assertOk();
    
    Storage::disk('public')->assertExists('avatars/' . $file->hashName());
});
```

### Fake Notification

```php
use Illuminate\Support\Facades\Notification;
use App\Notifications\OrderShipped;

it('正常: notifies user when order ships', function () {
    Notification::fake();
    
    $order = Order::factory()->create();
    
    $this->postJson("/api/orders/{$order->id}/ship")
        ->assertOk();
    
    Notification::assertSentTo($order->user, OrderShipped::class);
});
```

### Fake HTTP (External APIs)

```php
use Illuminate\Support\Facades\Http;

it('正常: fetches data from external API', function () {
    Http::fake([
        'api.example.com/*' => Http::response(['data' => 'value'], 200),
    ]);
    
    $response = $this->getJson('/api/external-data');
    
    $response->assertOk()
        ->assertJsonPath('data', 'value');
});

it('異常: handles external API failure', function () {
    Http::fake([
        'api.example.com/*' => Http::response([], 500),
    ]);
    
    $response = $this->getJson('/api/external-data');
    
    $response->assertServiceUnavailable();
});
```

### Mock Service

```php
use App\Services\PaymentService;

it('正常: processes payment', function () {
    $mock = Mockery::mock(PaymentService::class);
    $mock->shouldReceive('charge')
        ->once()
        ->with(1000, 'tok_visa')
        ->andReturn(true);
    
    $this->app->instance(PaymentService::class, $mock);
    
    $this->postJson('/api/orders/pay', ['token' => 'tok_visa'])
        ->assertOk();
});
```

---

## Authentication Tests

### Login Tests

```php
// tests/Feature/Auth/LoginTest.php

describe('POST /api/login', function () {
    
    it('正常: logs in with valid credentials', function () {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);
        
        $response = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);
        
        $response->assertOk()
            ->assertJsonStructure(['token', 'user']);
    });
    
    it('異常: fails with wrong password', function () {
        User::factory()->create([
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);
        
        $response = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'wrongpassword',
        ]);
        
        $response->assertUnauthorized();
    });
    
    it('異常: fails with nonexistent email', function () {
        $response = $this->postJson('/api/login', [
            'email' => 'notexist@example.com',
            'password' => 'password123',
        ]);
        
        $response->assertUnauthorized();
    });
});
```

### Logout Tests

```php
describe('POST /api/logout', function () {
    
    it('正常: logs out authenticated user', function () {
        $user = User::factory()->create();
        
        $response = $this->actingAs($user)
            ->postJson('/api/logout');
        
        $response->assertNoContent();
    });
    
    it('異常: returns 401 when not authenticated', function () {
        $response = $this->postJson('/api/logout');
        
        $response->assertUnauthorized();
    });
});
```

### Protected Route Tests

```php
describe('Protected routes', function () {
    
    it('正常: allows authenticated user', function () {
        $user = User::factory()->create();
        
        $response = $this->actingAs($user)
            ->getJson('/api/me');
        
        $response->assertOk()
            ->assertJsonPath('data.id', $user->id);
    });
    
    it('異常: returns 401 without token', function () {
        $response = $this->getJson('/api/me');
        
        $response->assertUnauthorized();
    });
    
    it('異常: returns 401 with invalid token', function () {
        $response = $this->getJson('/api/me', [
            'Authorization' => 'Bearer invalid_token',
        ]);
        
        $response->assertUnauthorized();
    });
});
```

### Token Refresh Tests (if applicable)

```php
describe('POST /api/refresh', function () {
    
    it('正常: refreshes token', function () {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;
        
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/refresh');
        
        $response->assertOk()
            ->assertJsonStructure(['token']);
    });
});
```

---

## Middleware Tests

### Rate Limiting

```php
describe('Rate limiting', function () {
    
    it('異常: returns 429 when rate limit exceeded', function () {
        $user = User::factory()->create();
        
        // Hit the endpoint many times
        for ($i = 0; $i < 60; $i++) {
            $this->actingAs($user)->getJson('/api/users');
        }
        
        // Next request should be rate limited
        $response = $this->actingAs($user)->getJson('/api/users');
        
        $response->assertStatus(429);
    });
});
```

### CORS (if custom implementation)

```php
describe('CORS', function () {
    
    it('正常: includes CORS headers', function () {
        $response = $this->getJson('/api/users');
        
        $response->assertHeader('Access-Control-Allow-Origin');
    });
    
    it('正常: handles preflight OPTIONS request', function () {
        $response = $this->options('/api/users', [], [
            'Origin' => 'http://localhost:3000',
            'Access-Control-Request-Method' => 'POST',
        ]);
        
        $response->assertOk()
            ->assertHeader('Access-Control-Allow-Methods');
    });
});
```

### Custom Middleware

```php
// Example: Admin only middleware
describe('Admin middleware', function () {
    
    it('正常: allows admin user', function () {
        $admin = User::factory()->create(['role' => 'admin']);
        
        $response = $this->actingAs($admin)
            ->getJson('/api/admin/dashboard');
        
        $response->assertOk();
    });
    
    it('異常: returns 403 for non-admin', function () {
        $user = User::factory()->create(['role' => 'user']);
        
        $response = $this->actingAs($user)
            ->getJson('/api/admin/dashboard');
        
        $response->assertForbidden();
    });
});
```

---

## Naming Conventions

> **See:** [Naming Conventions - Test Naming](./naming-conventions.md#test-naming-pest) for complete naming rules

### Quick Reference

| Category              | Prefix  | Example                                               |
| --------------------- | ------- | ----------------------------------------------------- |
| **正常系 (Normal)**   | `正常:` | `it('正常: creates user with valid data')`            |
| **異常系 (Abnormal)** | `異常:` | `it('異常: fails to create user with invalid email')` |

### Test File Names

```
{Model}ControllerTest.php       # Feature tests for API
{Model}Test.php                 # Unit tests for Model
{Service}Test.php               # Unit tests for Service
```

---

## Test Coverage Matrix

### CRUD Endpoint Coverage

| Endpoint                                  | Normal (正常系)         | Abnormal (異常系)       |
| ----------------------------------------- | ----------------------- | ----------------------- |
| **GET /api/{resource}** (index)           | Returns paginated list  | Empty list when no data |
|                                           | Filters by search       | Invalid query params    |
|                                           | Sorts by field          | Invalid sort field      |
|                                           | Pagination works        |                         |
| **POST /api/{resource}** (store)          | Creates with valid data | Missing required fields |
|                                           | Returns 201 + resource  | Invalid field format    |
|                                           |                         | Duplicate unique field  |
|                                           |                         | Validation errors (422) |
| **GET /api/{resource}/{id}** (show)       | Returns resource        | Not found (404)         |
|                                           |                         | Invalid ID format       |
| **PUT /api/{resource}/{id}** (update)     | Updates with valid data | Not found (404)         |
|                                           | Partial update works    | Invalid data (422)      |
|                                           |                         | Duplicate unique field  |
| **DELETE /api/{resource}/{id}** (destroy) | Deletes resource        | Not found (404)         |
|                                           | Returns 204             |                         |

### Field Validation Coverage

| Field Type   | Normal (正常系)  | Abnormal (異常系)        |
| ------------ | ---------------- | ------------------------ |
| **required** | Field present    | Field missing            |
|              |                  | Field empty              |
|              |                  | Field null               |
| **string**   | Valid string     | Non-string type          |
|              |                  | Too long (max)           |
| **email**    | Valid email      | Invalid format           |
|              |                  | Missing @                |
| **unique**   | New value        | Duplicate value          |
| **min:N**    | At limit         | Below limit              |
| **max:N**    | At limit         | Above limit              |
| **integer**  | Valid integer    | Non-integer              |
|              |                  | Negative (if applicable) |
| **date**     | Valid date       | Invalid format           |
| **enum**     | Valid option     | Invalid option           |
| **regex**    | Matching pattern | Non-matching pattern     |

### Authentication & Authorization Coverage

| Scenario             | Normal (正常系)         | Abnormal (異常系)     |
| -------------------- | ----------------------- | --------------------- |
| **No auth required** | Returns data            | -                     |
| **Auth required**    | Authenticated → success | Unauthenticated → 401 |
| **Owner only**       | Owner → success         | Non-owner → 403       |
| **Admin only**       | Admin → success         | Non-admin → 403       |
| **Role-based**       | Has role → success      | Missing role → 403    |

### Japanese Field Validation Coverage

| Field                 | Normal (正常系)       | Abnormal (異常系)              |
| --------------------- | --------------------- | ------------------------------ |
| `name_lastname`       | Valid kanji/hiragana  | Empty, too long (>50)          |
| `name_firstname`      | Valid kanji/hiragana  | Empty, too long (>50)          |
| `name_kana_lastname`  | Valid katakana        | Hiragana, kanji, romaji        |
| `name_kana_firstname` | Valid katakana        | Hiragana, kanji, romaji        |
| `phone`               | Valid Japanese format | Invalid format, too short/long |
| `postal_code`         | 7 digits (no hyphen)  | With hyphen, wrong length      |

---

## PEST Test Template (CRUD)

```php
<?php

use App\Models\User;

// Helper function for valid user data
function validUserData(array $overrides = []): array
{
    return array_merge([
        'name_lastname' => 'Tanaka',
        'name_firstname' => 'Taro',
        'name_kana_lastname' => 'タナカ',
        'name_kana_firstname' => 'タロウ',
        'email' => 'tanaka@example.com',
        'password' => 'password123',
    ], $overrides);
}

// =============================================================================
// INDEX (GET /api/users)
// =============================================================================

describe('GET /api/users', function () {
    
    // Normal cases (正常系)
    
    it('正常: returns paginated users', function () {
        User::factory()->count(15)->create();

        $response = $this->getJson('/api/users');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [['id', 'name_lastname', 'name_firstname', 'email']],
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
            ])
            ->assertJsonCount(10, 'data');
    });

    it('正常: filters users by search term', function () {
        User::factory()->create(['name_lastname' => 'Tanaka']);
        User::factory()->create(['name_lastname' => 'Yamada']);

        $response = $this->getJson('/api/users?search=Tanaka');

        $response->assertOk()
            ->assertJsonCount(1, 'data');
    });

    it('正常: sorts users by specified field', function () {
        User::factory()->create(['name_lastname' => 'B']);
        User::factory()->create(['name_lastname' => 'A']);

        $response = $this->getJson('/api/users?sort_by=name_lastname&sort_order=asc');

        $response->assertOk();
        expect($response->json('data.0.name_lastname'))->toBe('A');
    });

    it('正常: paginates with custom per_page', function () {
        User::factory()->count(10)->create();

        $response = $this->getJson('/api/users?per_page=5');

        $response->assertOk()
            ->assertJsonCount(5, 'data')
            ->assertJsonPath('meta.per_page', 5);
    });

    // Abnormal cases (異常系)

    it('異常: returns empty array when no users exist', function () {
        $response = $this->getJson('/api/users');

        $response->assertOk()
            ->assertJsonCount(0, 'data');
    });
});

// =============================================================================
// STORE (POST /api/users)
// =============================================================================

describe('POST /api/users', function () {
    
    // Normal cases (正常系)

    it('正常: creates user with valid data', function () {
        $data = validUserData();

        $response = $this->postJson('/api/users', $data);

        $response->assertCreated()
            ->assertJsonPath('data.email', 'tanaka@example.com');

        $this->assertDatabaseHas('users', ['email' => 'tanaka@example.com']);
    });

    // Abnormal cases (異常系)

    it('異常: fails with missing required fields', function () {
        $response = $this->postJson('/api/users', []);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors([
                'name_lastname',
                'name_firstname',
                'name_kana_lastname',
                'name_kana_firstname',
                'email',
                'password',
            ]);
    });

    it('異常: fails with invalid email format', function () {
        $response = $this->postJson('/api/users', validUserData([
            'email' => 'invalid-email',
        ]));

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    });

    it('異常: fails with duplicate email', function () {
        User::factory()->create(['email' => 'existing@example.com']);

        $response = $this->postJson('/api/users', validUserData([
            'email' => 'existing@example.com',
        ]));

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    });

    it('異常: fails with password too short', function () {
        $response = $this->postJson('/api/users', validUserData([
            'password' => '123',
        ]));

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);
    });
});

// =============================================================================
// SHOW (GET /api/users/{id})
// =============================================================================

describe('GET /api/users/{id}', function () {
    
    // Normal cases (正常系)

    it('正常: returns user by id', function () {
        $user = User::factory()->create();

        $response = $this->getJson("/api/users/{$user->id}");

        $response->assertOk()
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.email', $user->email);
    });

    // Abnormal cases (異常系)

    it('異常: returns 404 for nonexistent user', function () {
        $response = $this->getJson('/api/users/99999');

        $response->assertNotFound();
    });
});

// =============================================================================
// UPDATE (PUT /api/users/{id})
// =============================================================================

describe('PUT /api/users/{id}', function () {
    
    // Normal cases (正常系)

    it('正常: updates user with valid data', function () {
        $user = User::factory()->create();

        $response = $this->putJson("/api/users/{$user->id}", [
            'name_lastname' => 'Yamada',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.name_lastname', 'Yamada');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name_lastname' => 'Yamada',
        ]);
    });

    it('正常: allows partial update', function () {
        $user = User::factory()->create(['name_lastname' => 'Tanaka']);

        $response = $this->putJson("/api/users/{$user->id}", [
            'name_firstname' => 'Jiro',
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name_lastname' => 'Tanaka',  // Unchanged
            'name_firstname' => 'Jiro',   // Updated
        ]);
    });

    it('正常: allows keeping same email', function () {
        $user = User::factory()->create(['email' => 'same@example.com']);

        $response = $this->putJson("/api/users/{$user->id}", [
            'email' => 'same@example.com',
        ]);

        $response->assertOk();
    });

    // Abnormal cases (異常系)

    it('異常: returns 404 for nonexistent user', function () {
        $response = $this->putJson('/api/users/99999', [
            'name_lastname' => 'Yamada',
        ]);

        $response->assertNotFound();
    });

    it('異常: fails with duplicate email', function () {
        $user1 = User::factory()->create(['email' => 'user1@example.com']);
        User::factory()->create(['email' => 'user2@example.com']);

        $response = $this->putJson("/api/users/{$user1->id}", [
            'email' => 'user2@example.com',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    });
});

// =============================================================================
// DESTROY (DELETE /api/users/{id})
// =============================================================================

describe('DELETE /api/users/{id}', function () {
    
    // Normal cases (正常系)

    it('正常: deletes user', function () {
        $user = User::factory()->create();

        $response = $this->deleteJson("/api/users/{$user->id}");

        $response->assertNoContent();
        $this->assertDatabaseMissing('users', ['id' => $user->id]);
    });

    // Abnormal cases (異常系)

    it('異常: returns 404 for nonexistent user', function () {
        $response = $this->deleteJson('/api/users/99999');

        $response->assertNotFound();
    });
});

// =============================================================================
// AUTHENTICATION (401)
// =============================================================================

// Uncomment when auth is required
// describe('Authentication', function () {
//     it('異常: returns 401 when unauthenticated for index', function () {
//         $response = $this->getJson('/api/users');
//         $response->assertUnauthorized();
//     });
//
//     it('異常: returns 401 when unauthenticated for store', function () {
//         $response = $this->postJson('/api/users', validUserData());
//         $response->assertUnauthorized();
//     });
// });

// =============================================================================
// AUTHORIZATION (403)
// =============================================================================

// Uncomment when authorization is required
// describe('Authorization', function () {
//     it('異常: returns 403 when updating other user', function () {
//         $user = User::factory()->create();
//         $otherUser = User::factory()->create();
//
//         $this->actingAs($otherUser);
//
//         $response = $this->putJson("/api/users/{$user->id}", [
//             'name_lastname' => 'Yamada',
//         ]);
//
//         $response->assertForbidden();
//     });
//
//     it('異常: returns 403 when deleting without admin role', function () {
//         $user = User::factory()->create();
//         $normalUser = User::factory()->create();
//
//         $this->actingAs($normalUser);
//
//         $response = $this->deleteJson("/api/users/{$user->id}");
//
//         $response->assertForbidden();
//     });
// });

// =============================================================================
// JAPANESE FIELD VALIDATION
// =============================================================================

describe('Japanese field validation', function () {
    
    it('異常: fails with hiragana in kana field', function () {
        $response = $this->postJson('/api/users', validUserData([
            'name_kana_lastname' => 'たなか',  // Hiragana - should be Katakana
        ]));

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['name_kana_lastname']);
    });

    it('異常: fails with romaji in kana field', function () {
        $response = $this->postJson('/api/users', validUserData([
            'name_kana_lastname' => 'Tanaka',  // Romaji - should be Katakana
        ]));

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['name_kana_lastname']);
    });

    it('正常: accepts valid katakana', function () {
        $response = $this->postJson('/api/users', validUserData([
            'name_kana_lastname' => 'タナカ',
            'name_kana_firstname' => 'タロウ',
        ]));

        $response->assertCreated();
    });

    it('正常: accepts katakana with long vowel mark', function () {
        $response = $this->postJson('/api/users', validUserData([
            'name_kana_lastname' => 'サトー',
            'name_kana_firstname' => 'ユーコ',
        ]));

        $response->assertCreated();
    });

    it('異常: fails with name exceeding max length', function () {
        $response = $this->postJson('/api/users', validUserData([
            'name_lastname' => str_repeat('a', 51),  // Over 50 chars
        ]));

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['name_lastname']);
    });
});
```

---

## Test Checklist

### Per Endpoint

- [ ] **Normal cases (正常系)**
  - [ ] Happy path with valid data
  - [ ] All optional features work (search, sort, pagination)
  - [ ] Response structure is correct
  - [ ] Database state is correct

- [ ] **Abnormal cases (異常系)**
  - [ ] 404 Not Found for missing resource
  - [ ] 422 Validation Error for invalid data
  - [ ] All required fields checked
  - [ ] All format validations checked
  - [ ] Unique constraints checked

### Per Field (Validation)

For each field in FormRequest:

- [ ] **Present & valid** → Success
- [ ] **Missing (if required)** → 422
- [ ] **Empty string** → 422 (if required)
- [ ] **Invalid format** → 422
- [ ] **Exceeds max length** → 422
- [ ] **Below min length** → 422
- [ ] **Duplicate (if unique)** → 422

---

## Testing Database Setup

Tests use a separate database `omnify_testing` (auto-created by Docker).

**Files:**
- `docker/mysql/init/01-create-testing-db.sql` - Creates testing database on Docker init
- `backend/.env.testing` - Testing environment config (generated by `npm run setup`)

**Key differences from `.env`:**

| Setting            | `.env` (dev) | `.env.testing`   |
| ------------------ | ------------ | ---------------- |
| `DB_DATABASE`      | `omnify`     | `omnify_testing` |
| `SESSION_DRIVER`   | `cookie`     | `array`          |
| `CACHE_STORE`      | `file`       | `array`          |
| `QUEUE_CONNECTION` | `sync`       | `sync`           |
| `MAIL_MAILER`      | `smtp`       | `array`          |
| `BCRYPT_ROUNDS`    | `12`         | `4` (faster)     |

---

## Running Tests

```bash
# Run all tests (from project root)
./artisan test

# Run specific test file
./artisan test --filter=UserControllerTest

# Run specific describe block
./artisan test --filter="GET /api/users"

# Run specific test
./artisan test --filter="creates user with valid data"

# Run with coverage
./artisan test --coverage

# Run in parallel
./artisan test --parallel
```

### First Time Setup

If testing database doesn't exist:

```bash
# Option 1: Recreate Docker containers (recommended)
docker compose down -v
docker compose up -d

# Option 2: Create manually
docker compose exec mysql mysql -uroot -proot -e "CREATE DATABASE omnify_testing; GRANT ALL ON omnify_testing.* TO 'omnify'@'%';"
```

---

## PEST Assertions Reference

### HTTP Assertions

```php
$response->assertOk();                    // 200
$response->assertCreated();               // 201
$response->assertNoContent();             // 204
$response->assertNotFound();              // 404
$response->assertUnprocessable();         // 422
$response->assertUnauthorized();          // 401
$response->assertForbidden();             // 403
```

### JSON Assertions

```php
$response->assertJsonStructure(['data' => ['id', 'email']]);
$response->assertJsonPath('data.email', 'test@example.com');
$response->assertJsonCount(10, 'data');
$response->assertJsonValidationErrors(['email', 'password']);
```

### Database Assertions

```php
$this->assertDatabaseHas('users', ['email' => 'test@example.com']);
$this->assertDatabaseMissing('users', ['id' => $user->id]);
$this->assertDatabaseCount('users', 5);
```

### PEST Expectations

```php
expect($value)->toBe('expected');
expect($value)->toBeTrue();
expect($value)->toBeFalse();
expect($value)->toBeNull();
expect($value)->toBeEmpty();
expect($value)->toHaveCount(5);
expect($value)->toContain('item');
expect($value)->toMatchArray(['key' => 'value']);
```

---

## Test Data Creation Strategy

### Golden Rule: Use API to Create Data

**Create test data through the API whenever possible** - this ensures data passes through the same validation and business logic as real users.

```php
// ❌ BAD: Create directly with factory (bypasses validation)
it('can update user', function () {
    $user = User::factory()->create([
        'email' => 'invalid',  // Factory allows invalid data!
    ]);
    // Test may pass but real API would reject this
});

// ✅ GOOD: Create via API (same flow as real users)
it('can update user', function () {
    // Create user through API
    $createResponse = $this->postJson('/api/users', validUserData());
    $createResponse->assertCreated();
    
    $userId = $createResponse->json('data.id');
    
    // Now test update
    $updateResponse = $this->putJson("/api/users/{$userId}", [
        'name_lastname' => 'Updated',
    ]);
    
    $updateResponse->assertOk();
});
```

### When to Use Factory vs API

| Scenario                        | Use Factory                 | Use API                         |
| ------------------------------- | --------------------------- | ------------------------------- |
| **Testing the endpoint itself** | ❌                           | ✅                               |
| **Creating prerequisite data**  | ⚠️ OK but be careful         | ✅ Preferred                     |
| **Testing relationships**       | ✅ OK for related models     | ✅ When testing the relation API |
| **Performance (many records)**  | ✅ Faster                    | ❌ Too slow                      |
| **Testing edge cases**          | ✅ Can create invalid states | ❌ API will reject               |

### Recommended Pattern

```php
describe('PUT /api/users/{id}', function () {
    
    // Use API to create the user we'll update
    beforeEach(function () {
        $response = $this->postJson('/api/users', validUserData([
            'email' => 'original@example.com',
        ]));
        $response->assertCreated();
        
        $this->testUser = $response->json('data');
    });

    it('updates user with valid data', function () {
        $response = $this->putJson("/api/users/{$this->testUser['id']}", [
            'name_lastname' => 'NewName',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.name_lastname', 'NewName');
    });
    
    it('fails with duplicate email', function () {
        // Create another user via API
        $this->postJson('/api/users', validUserData([
            'email' => 'other@example.com',
        ]))->assertCreated();
        
        // Try to update to existing email
        $response = $this->putJson("/api/users/{$this->testUser['id']}", [
            'email' => 'other@example.com',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    });
});
```

### Factory Usage Guidelines

**When Factory is OK:**

```php
// ✅ OK: Creating many records for list/pagination tests
it('returns paginated users', function () {
    User::factory()->count(25)->create();  // OK - testing pagination, not user creation
    
    $response = $this->getJson('/api/users?per_page=10');
    
    $response->assertOk()
        ->assertJsonCount(10, 'data');
});

// ✅ OK: Creating related data for relationship tests
it('returns user with posts', function () {
    $user = User::factory()
        ->has(Post::factory()->count(3))
        ->create();
    
    $response = $this->getJson("/api/users/{$user->id}?include=posts");
    
    $response->assertOk()
        ->assertJsonCount(3, 'data.posts');
});
```

**When Factory is DANGEROUS:**

```php
// ❌ DANGEROUS: Testing validation with factory-created data
it('updates user', function () {
    // Factory may create data that doesn't match real validation rules!
    $user = User::factory()->create();
    
    // This test doesn't prove the API works correctly
});
```

---

## Debugging Test Failures

### Test Failed - Now What?

When a test fails, you MUST determine the root cause:

| Root Cause                          | Description                       | Action                                      |
| ----------------------------------- | --------------------------------- | ------------------------------------------- |
| **Code Bug**                        | Actual application code is broken | Fix the application code                    |
| **Test Bug**                        | Test code is incorrect            | Fix the test                                |
| **Business Logic Misunderstanding** | Test doesn't match requirements   | Clarify requirements, then fix test or code |
| **Environment Issue**               | Database, config, timing issue    | Fix environment/setup                       |

### Debugging Checklist

```mermaid
flowchart TD
    A[TEST FAILED] --> B[1. Read error message carefully]
    B --> C[2. Check test code]
    C --> D{Is test code correct?}
    
    D -->|NO| E[Fix test code]
    D -->|YES| F[Check actual code]
    
    F --> G{Is it a business logic issue?}
    
    G -->|YES| H[Clarify requirements]
    G -->|NO| I[Fix code bug]
    
    C -.-> C1[Correct endpoint?]
    C -.-> C2[Correct data?]
    C -.-> C3[Correct assertion?]
```

### Debugging Techniques

#### 1. Print Response Data

```php
it('creates user', function () {
    $response = $this->postJson('/api/users', validUserData());
    
    // Debug: Print full response
    dump($response->json());
    dump($response->status());
    
    $response->assertCreated();
});
```

#### 2. Check Database State

```php
it('creates user', function () {
    $response = $this->postJson('/api/users', validUserData([
        'email' => 'test@example.com',
    ]));
    
    // Debug: Check what's actually in database
    dump(User::where('email', 'test@example.com')->first());
    dump(User::count());
    
    $response->assertCreated();
});
```

#### 3. Check Validation Errors

```php
it('creates user', function () {
    $response = $this->postJson('/api/users', validUserData());
    
    // If 422, check which fields failed
    if ($response->status() === 422) {
        dump($response->json('errors'));
    }
    
    $response->assertCreated();
});
```

#### 4. Isolate the Problem

```php
// Break down complex test into smaller parts
it('debug: check data is valid', function () {
    $data = validUserData();
    dump($data);
    
    // Check each field manually
    expect($data['email'])->toContain('@');
    expect(strlen($data['password']))->toBeGreaterThanOrEqual(8);
});

it('debug: check API accepts data', function () {
    $response = $this->postJson('/api/users', validUserData());
    dump($response->status());
    dump($response->json());
});
```

### Common Failure Patterns

#### Pattern 1: Test Passes Locally, Fails in CI

```php
// ❌ Problem: Depends on database state
it('gets user', function () {
    $response = $this->getJson('/api/users/1');  // ID 1 may not exist!
    $response->assertOk();
});

// ✅ Solution: Create own test data
it('gets user', function () {
    $user = User::factory()->create();
    $response = $this->getJson("/api/users/{$user->id}");
    $response->assertOk();
});
```

#### Pattern 2: Test Depends on Order

```php
// ❌ Problem: Tests affect each other
it('creates user', function () {
    $this->postJson('/api/users', ['email' => 'test@example.com']);
});

it('fails with duplicate email', function () {
    // This only works if previous test ran first!
    $this->postJson('/api/users', ['email' => 'test@example.com'])
        ->assertUnprocessable();
});

// ✅ Solution: Each test is independent
it('fails with duplicate email', function () {
    // Create first user in THIS test
    $this->postJson('/api/users', validUserData(['email' => 'test@example.com']))
        ->assertCreated();
    
    // Now test duplicate
    $this->postJson('/api/users', validUserData(['email' => 'test@example.com']))
        ->assertUnprocessable();
});
```

#### Pattern 3: Wrong Assertion

```php
// ❌ Problem: Asserting wrong thing
it('creates user', function () {
    $response = $this->postJson('/api/users', validUserData());
    
    // Wrong: assertOk is 200, but POST returns 201
    $response->assertOk();
});

// ✅ Solution: Use correct assertion
it('creates user', function () {
    $response = $this->postJson('/api/users', validUserData());
    
    // Correct: POST returns 201 Created
    $response->assertCreated();
});
```

#### Pattern 4: Test Data Doesn't Match Validation

```php
// ❌ Problem: Test data is invalid
function validUserData(array $overrides = []): array {
    return array_merge([
        'name_kana_lastname' => 'たなか',  // Wrong! Must be Katakana
    ], $overrides);
}

// ✅ Solution: Match validation rules exactly
function validUserData(array $overrides = []): array {
    return array_merge([
        'name_kana_lastname' => 'タナカ',  // Correct: Katakana
    ], $overrides);
}
```

### When Test Fails, Ask These Questions

1. **Is the test testing the right thing?**
   - Does the endpoint exist?
   - Is the HTTP method correct?
   - Are we asserting the right status code?

2. **Is the test data correct?**
   - Does it match validation rules?
   - Are required fields present?
   - Are formats correct (email, date, etc.)?

3. **Is the test isolated?**
   - Does it depend on other tests?
   - Does it depend on existing database data?
   - Does it clean up after itself?

4. **Is this actually a bug?**
   - Check the business requirements
   - Maybe the code is correct and test is wrong
   - Maybe requirements changed

---

## Best Practices

### DO

```php
// ✅ Use describe() to group related tests
describe('POST /api/users', function () {
    it('正常: creates user with valid data', function () { ... });
    it('異常: fails with invalid email', function () { ... });
});

// ✅ Use helper functions for test data
function validUserData(array $overrides = []): array {
    return array_merge([...], $overrides);
}

// ✅ Use API to create test data when testing mutations
it('正常: updates user', function () {
    $createResponse = $this->postJson('/api/users', validUserData());
    $userId = $createResponse->json('data.id');
    
    $this->putJson("/api/users/{$userId}", ['name' => 'New'])
        ->assertOk();
});

// ✅ Use PEST expectations for cleaner assertions
expect($response->json('data.email'))->toBe('test@example.com');

// ✅ Check database state after mutations
$this->assertDatabaseHas('users', ['email' => 'test@example.com']);
```

### DON'T

```php
// ❌ Hardcode IDs
$this->getJson('/api/users/1');

// ❌ Skip abnormal cases (異常系)
// Only testing happy path (正常系) is NOT enough!

// ❌ Test multiple things in one test
it('does everything', function () { ... });  // Too broad

// ❌ Depend on database state from other tests
// Tests should be isolated

// ❌ Assume test failure = code bug
// Always analyze: Is it test bug? Code bug? Business logic misunderstanding?

// ❌ Create test data that bypasses validation
User::factory()->create(['email' => 'invalid']);  // API would reject this!

// ❌ Test without understanding requirements
// Read the spec first, then write tests

// ❌ Copy-paste tests without understanding
// Each test should test ONE specific scenario
```

---

## Test Failure Analysis Checklist

Before fixing a failed test, answer these questions:

| Question                                              | If Yes                                |
| ----------------------------------------------------- | ------------------------------------- |
| Is the test code correct? (endpoint, data, assertion) | Check application code                |
| Is the test data valid according to business rules?   | Fix test data                         |
| Does the test depend on other tests or data?          | Make test independent                 |
| Is the assertion correct for this endpoint?           | Fix assertion (e.g., 201 not 200)     |
| Did the requirements change?                          | Update test to match new requirements |
| Is this actually expected behavior?                   | Test is correct, code is a bug        |

**Remember**: A failing test is information. Analyze it carefully before "fixing" anything.

---

## Summary

| Test Type             | What to Test                   | When             |
| --------------------- | ------------------------------ | ---------------- |
| **Normal (正常系)**   | Happy path, expected behavior  | Always           |
| **Abnormal (異常系)** | Errors, validation, edge cases | Always           |
| **Unit**              | Pure logic, no HTTP            | Complex services |
| **Feature**           | Full HTTP cycle                | Every endpoint   |

**Rule**: No endpoint is complete without both normal AND abnormal test cases.
