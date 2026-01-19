# Naming Conventions Guide

> **Related:** [README](./README.md) | [Testing Guide](./testing-guide.md)

## Overview

Consistent naming is critical for maintainability. This guide defines naming patterns for all backend code.

---

## PHP Imports

**Always use `use` statements. Never use FQCN (Fully Qualified Class Name) inline.**

```php
// ❌ WRONG: Inline FQCN
public function store(): \Illuminate\Http\JsonResponse
{
    return new \App\Http\Resources\UserResource($user);
}

// ✅ CORRECT: Import at top, use short names
use Illuminate\Http\JsonResponse;
use App\Http\Resources\UserResource;

public function store(): JsonResponse
{
    return new UserResource($user);
}
```

| Rule               | Description                      |
| ------------------ | -------------------------------- |
| Import all classes | Use `use` at top of file         |
| Short class names  | Never `\Full\Path\Class` inline  |
| Group imports      | Framework, then App, then Others |
| No unused imports  | Remove unused `use` statements   |

---

## File & Class Naming

### Pattern: `{Model}{Type}.php`

| Type       | Pattern                  | Example                   |
| ---------- | ------------------------ | ------------------------- |
| Controller | `{Model}Controller`      | `UserController.php`      |
| Request    | `{Model}{Action}Request` | `UserStoreRequest.php`    |
| Resource   | `{Model}Resource`        | `UserResource.php`        |
| Model      | `{Model}` (singular)     | `User.php`                |
| Service    | `{Model}Service`         | `OrderService.php`        |
| Action     | `{Verb}{Noun}Action`     | `CreateInvoiceAction.php` |
| Job        | `{Verb}{Noun}Job`        | `SendWelcomeEmailJob.php` |
| Event      | `{Model}{PastTense}`     | `UserRegistered.php`      |
| Observer   | `{Model}Observer`        | `UserObserver.php`        |
| Policy     | `{Model}Policy`          | `UserPolicy.php`          |
| Test       | `{Model}ControllerTest`  | `UserControllerTest.php`  |

### Request Naming

| Action | Pattern                | Example                 |
| ------ | ---------------------- | ----------------------- |
| Create | `{Model}StoreRequest`  | `UserStoreRequest.php`  |
| Update | `{Model}UpdateRequest` | `UserUpdateRequest.php` |

> **Note:** Use `Store` (not `Create`) and `Update` (not `Edit`) to match Laravel CRUD conventions.

---

## Method Naming

### Controller Methods (RESTful)

| HTTP Method | Controller Method | Route             | Description     |
| ----------- | ----------------- | ----------------- | --------------- |
| GET         | `index()`         | `/api/users`      | List all        |
| POST        | `store()`         | `/api/users`      | Create new      |
| GET         | `show()`          | `/api/users/{id}` | Get single      |
| PUT/PATCH   | `update()`        | `/api/users/{id}` | Update existing |
| DELETE      | `destroy()`       | `/api/users/{id}` | Delete          |

### Service Methods

| Pattern               | Example                   |
| --------------------- | ------------------------- |
| `{verb}{Noun}`        | `processPayment()`        |
| `{verb}{Noun}{State}` | `calculateTotalWithTax()` |

```php
// ✅ Good
public function processPayment(Order $order): Payment
public function calculateDiscount(Cart $cart): float
public function sendNotification(User $user): void

// ❌ Bad
public function payment(Order $order)  // Missing verb
public function doStuff()              // Too vague
```

### Model Methods

| Type     | Pattern               | Example                 |
| -------- | --------------------- | ----------------------- |
| Scope    | `scope{Name}`         | `scopeActive($query)`   |
| Accessor | `{attribute}` (PHP 8) | `fullName(): Attribute` |
| Mutator  | `{attribute}` (PHP 8) | `password(): Attribute` |
| Relation | `{relation}` (noun)   | `posts()`, `author()`   |

```php
// Scope - filter queries
public function scopeActive(Builder $query): Builder
{
    return $query->where('status', 'active');
}

// Accessor (PHP 8+)
protected function fullName(): Attribute
{
    return Attribute::get(fn () => "{$this->first_name} {$this->last_name}");
}

// Relationship
public function posts(): HasMany
{
    return $this->hasMany(Post::class);
}
```

---

## Test Naming (PEST)

Use `describe()` to group tests by endpoint, `it()` for individual test cases.

### Naming Rules

| Category              | Prefix  | Pattern                                  | Example                                               |
| --------------------- | ------- | ---------------------------------------- | ----------------------------------------------------- |
| **正常系 (Normal)**   | `正常:` | `it('正常: {verb} {what}')`              | `it('正常: creates user with valid data')`            |
| **異常系 (Abnormal)** | `異常:` | `it('異常: fails to {action} {reason}')` | `it('異常: fails to create user with invalid email')` |
| **異常系 (404/401)**  | `異常:` | `it('異常: returns {status} {reason}')`  | `it('異常: returns 404 when user not found')`         |

### 正常系 (Normal Cases) - Success Behavior

**Pattern:** `it('正常: {verb} {what}')`

**Common verbs:** `returns`, `creates`, `updates`, `deletes`, `filters`, `sorts`, `paginates`

```php
// GET (index)
it('正常: returns paginated users')
it('正常: returns users filtered by search')
it('正常: returns users sorted by created_at')

// POST (store)
it('正常: creates user with valid data')

// GET (show)
it('正常: returns user by id')

// PUT (update)
it('正常: updates user with valid data')
it('正常: updates user with partial data')

// DELETE (destroy)
it('正常: deletes user')
```

### 異常系 (Abnormal Cases) - Failure Behavior

**Pattern:** `it('異常: fails to {action} {reason}')` or `it('異常: returns {status} {reason}')`

```php
// Validation errors (422) - use "fails to"
it('異常: fails to create user with missing email')
it('異常: fails to create user with invalid email format')
it('異常: fails to create user with duplicate email')
it('異常: fails to create user with short password')
it('異常: fails to create user with invalid kana format')   // Japanese
it('異常: fails to update user with invalid data')

// Not found (404) - use "returns 404"
it('異常: returns 404 when user not found')
it('異常: returns 404 when updating nonexistent user')
it('異常: returns 404 when deleting nonexistent user')

// Authentication (401) - use "returns 401"
it('異常: returns 401 when not authenticated')

// Authorization (403) - use "returns 403"
it('異常: returns 403 when user cannot access resource')
it('異常: returns 403 when deleting without admin role')
```

### Complete Example

```php
describe('POST /api/users', function () {
    // ================================================================
    // 正常系 (Normal Cases)
    // ================================================================
    it('正常: creates user with valid data', function () { ... });
    
    // ================================================================
    // 異常系 (Abnormal Cases)
    // ================================================================
    
    // Required fields
    it('異常: fails to create user with missing email', function () { ... });
    it('異常: fails to create user with missing password', function () { ... });
    
    // Format validation
    it('異常: fails to create user with invalid email format', function () { ... });
    it('異常: fails to create user with short password', function () { ... });
    
    // Unique constraint
    it('異常: fails to create user with duplicate email', function () { ... });
    
    // Japanese field validation
    it('異常: fails to create user with invalid kana format', function () { ... });
});

describe('GET /api/users/{id}', function () {
    // 正常系
    it('正常: returns user by id', function () { ... });
    
    // 異常系
    it('異常: returns 404 when user not found', function () { ... });
});
```

---

## Database Naming

### Tables

| Pattern                  | Example     |
| ------------------------ | ----------- |
| Plural, snake_case       | `users`     |
| Pivot: singular_singular | `post_tag`  |
| (alphabetical order)     | `role_user` |

### Columns

| Type          | Pattern            | Example              |
| ------------- | ------------------ | -------------------- |
| Primary key   | `id`               | `id`                 |
| Foreign key   | `{table}_id`       | `user_id`            |
| Boolean       | `is_{state}`       | `is_active`          |
| Timestamp     | `{action}_at`      | `verified_at`        |
| Japanese name | `name_{part}`      | `name_lastname`      |
| Japanese kana | `name_kana_{part}` | `name_kana_lastname` |

### Japanese Name Fields (JapaneseName type)

| Field                 | Description      | Max Length |
| --------------------- | ---------------- | ---------- |
| `name_lastname`       | Family name (姓) | 50         |
| `name_firstname`      | Given name (名)  | 50         |
| `name_kana_lastname`  | Family name kana | 100        |
| `name_kana_firstname` | Given name kana  | 100        |

---

## Route Naming

### API Routes

| Pattern            | Example                    |
| ------------------ | -------------------------- |
| Plural resource    | `/api/users`               |
| Nested resource    | `/api/users/{user}/posts`  |
| Action on resource | `/api/orders/{order}/ship` |

```php
// routes/api.php
Route::apiResource('users', UserController::class);
Route::apiResource('posts', PostController::class);

// Nested
Route::apiResource('users.posts', UserPostController::class);

// Custom actions
Route::post('/orders/{order}/ship', [OrderController::class, 'ship']);
```

---

## Variable Naming

### PHP Variables

| Type           | Pattern      | Example            |
| -------------- | ------------ | ------------------ |
| Model instance | `$camelCase` | `$user`, `$post`   |
| Collection     | `$plural`    | `$users`, `$posts` |
| Boolean        | `$is{State}` | `$isActive`        |
| Query builder  | `$query`     | `$query`           |

```php
// ✅ Good
$user = User::find($id);
$users = User::all();
$isActive = $user->status === 'active';

// ❌ Bad
$u = User::find($id);      // Too short
$userData = User::find($id); // Redundant "Data"
$active = true;            // Missing "is" prefix for boolean
```

---

## OpenAPI/Swagger Naming

### Tag Names

| Pattern            | Example |
| ------------------ | ------- |
| Plural, PascalCase | `Users` |

### Parameter Names

| Type  | Pattern       | Example       |
| ----- | ------------- | ------------- |
| Query | `Query{Name}` | `QuerySearch` |
| Path  | `Path{Name}`  | `PathId`      |

### Response Names

| Pattern         | Example           |
| --------------- | ----------------- |
| `{Description}` | `Success`         |
| `{HttpStatus}`  | `NotFound`        |
| `{Error}Error`  | `ValidationError` |

---

## Summary Table

| Type                 | Convention                               | Example                                               |
| -------------------- | ---------------------------------------- | ----------------------------------------------------- |
| **Imports**          |                                          |                                                       |
| PHP imports          | `use` at top, short name inline          | `use JsonResponse;` → `: JsonResponse`                |
| **Files**            |                                          |                                                       |
| Controller           | `{Model}Controller`                      | `UserController.php`                                  |
| Request              | `{Model}{Action}Request`                 | `UserStoreRequest.php`                                |
| Resource             | `{Model}Resource`                        | `UserResource.php`                                    |
| Test                 | `{Model}ControllerTest`                  | `UserControllerTest.php`                              |
| **Methods**          |                                          |                                                       |
| Controller           | RESTful verbs                            | `index`, `store`, `show`                              |
| Service              | `{verb}{Noun}`                           | `processPayment()`                                    |
| Scope                | `scope{Name}`                            | `scopeActive()`                                       |
| **Test Naming**      |                                          |                                                       |
| 正常系 (Normal)      | `it('正常: {verb} {what}')`              | `it('正常: creates user with valid data')`            |
| 異常系 (Abnormal)    | `it('異常: fails to {action} {reason}')` | `it('異常: fails to create user with invalid email')` |
| 異常系 (404/401/403) | `it('異常: returns {status} {reason}')`  | `it('異常: returns 404 when user not found')`         |
| **Database**         |                                          |                                                       |
| Table                | plural, snake_case                       | `users`, `order_items`                                |
| Column               | snake_case                               | `user_id`, `created_at`                               |
| Boolean column       | `is_{state}`                             | `is_verified`                                         |
| **Routes**           |                                          |                                                       |
| API                  | plural, kebab-case                       | `/api/users`, `/api/order-items`                      |