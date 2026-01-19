# PHP Standards & Best Practices

> **PHP 8+ features** and coding standards for Laravel projects.

## 🔵 Strict Types

**Always declare strict types at the top of PHP files.**

```php
<?php

declare(strict_types=1);

namespace App\Services;

// ... class definition
```

| Rule | Description |
| ---- | ----------- |
| `declare(strict_types=1)` | Required in all PHP files |
| Place at very top | Before namespace declaration |

---

## 🔵 Constructor Property Promotion (PHP 8.0+)

**Use constructor promotion for dependency injection.**

```php
// ❌ OLD STYLE: Verbose
class UserService
{
    private UserRepository $repository;
    private CacheManager $cache;
    
    public function __construct(UserRepository $repository, CacheManager $cache)
    {
        $this->repository = $repository;
        $this->cache = $cache;
    }
}

// ✅ PHP 8.0+: Constructor promotion
class UserService
{
    public function __construct(
        private readonly UserRepository $repository,
        private readonly CacheManager $cache
    ) {}
}
```

| Modifier | Usage |
| -------- | ----- |
| `private readonly` | Immutable dependencies (preferred) |
| `private` | Mutable internal state |
| `protected readonly` | For extension by subclasses |

---

## 🔵 PHP 8+ Features

### Named Arguments

```php
// ✅ Clear intent
$this->checkEmailLockout(
    email: $request->email,
    checkOnly: true
);

// Use when function has many optional parameters
```

### Nullsafe Operator

```php
// ❌ OLD STYLE
$country = $user->address ? ($user->address->country ? $user->address->country->name : null) : null;

// ✅ PHP 8.0+: Nullsafe operator
$country = $user->address?->country?->name;
```

### Union Types

```php
public function process(int|string $id): Response|RedirectResponse
{
    // ...
}
```

### Match Expression

```php
// ❌ OLD: switch statement
switch ($status) {
    case 'active': return 'Active';
    case 'inactive': return 'Inactive';
    default: return 'Unknown';
}

// ✅ PHP 8.0+: match expression
return match($status) {
    'active' => 'Active',
    'inactive' => 'Inactive',
    default => 'Unknown',
};
```

---

## 🔵 Constants Organization

**Use dedicated Constants classes instead of magic values.**

```php
// ❌ BAD: Magic strings scattered in code
if ($user->role === 'admin') { ... }
Cache::get('user:' . $id);
session()->get('2fa:user_id');

// ✅ GOOD: Constants in dedicated class
namespace App\Constants;

class TwoFactorConstants
{
    public const ENABLED = true;
    public const CODE_LENGTH = 6;
    public const EXPIRY_MINUTES = 5;
    
    // Session keys
    public const SESSION_USER_ID = '2fa:user_id';
    public const SESSION_EMAIL = '2fa:email';
}

// Usage
use App\Constants\TwoFactorConstants;

if (TwoFactorConstants::ENABLED) {
    $code = Str::random(TwoFactorConstants::CODE_LENGTH);
    session()->put(TwoFactorConstants::SESSION_USER_ID, $user->id);
}
```

| Location | Purpose |
| -------- | ------- |
| `app/Constants/` | Application-wide constants |
| Class constants | Domain-specific constants |
| `config/*.php` | Environment-dependent values |

---

## 🔵 PHPDoc Standards

### Method Documentation

```php
/**
 * Get user's authorization for a service.
 *
 * @param User $user The user to check
 * @param Service $service The service being accessed
 *
 * @return array{
 *     organization_id: int,
 *     organization_slug: string,
 *     role: string,
 *     level: int
 * }|null Returns null if user has no access
 *
 * @throws AuthorizationException When service is inactive
 */
public function getUserAuthorization(User $user, Service $service): ?array
{
    // ...
}
```

### Array Shape Documentation

```php
/**
 * @return array{
 *     id: int,
 *     name: string,
 *     email: string,
 *     roles: string[]
 * }
 */
public function toArray(): array
```

### When to Document

| Document | Don't Document |
| -------- | -------------- |
| Complex return types | Obvious getters/setters |
| Array shapes | Simple CRUD methods |
| Exception conditions | Self-explanatory code |
| Business logic | Framework conventions |

---

## 🔵 Code Complexity Limits

### Method Guidelines

| Metric | Limit | Action if exceeded |
| ------ | ----- | ------------------ |
| Lines per method | Max 50 | Extract to helper/service |
| Parameters | Max 4 | Use DTO or config object |
| Cyclomatic complexity | Max 10 | Split into smaller methods |
| Nesting depth | Max 3 | Early return pattern |

### Class Guidelines

| Metric | Limit | Action if exceeded |
| ------ | ----- | ------------------ |
| Public methods | Max 10 | Split class (SRP violation) |
| Dependencies | Max 5 | Facade or aggregate service |
| Lines per class | Max 500 | Extract sub-classes |

### Early Return Pattern

```php
// ❌ BAD: Deep nesting
public function process($user)
{
    if ($user) {
        if ($user->isActive()) {
            if ($user->hasPermission('edit')) {
                // do something
            }
        }
    }
}

// ✅ GOOD: Early returns
public function process($user)
{
    if (!$user) {
        return;
    }
    
    if (!$user->isActive()) {
        return;
    }
    
    if (!$user->hasPermission('edit')) {
        return;
    }
    
    // do something
}
```

---

## 🔵 Interface & Trait Naming

```php
// Interfaces: suffix with Interface
interface PaymentGatewayInterface
{
    public function charge(int $amount): PaymentResult;
}

// Traits: suffix with Trait (optional but recommended)
trait HasApiTokens
{
    // ...
}

// Or descriptive name without suffix
trait Searchable
{
    public function scopeSearch(Builder $query, string $term): Builder
    {
        // ...
    }
}
```

---

## Quick Reference

| Category | Rule |
| -------- | ---- |
| **Strict** | `declare(strict_types=1)` at top |
| **Constructor** | Use property promotion with `readonly` |
| **Nullsafe** | `$obj?->prop?->value` instead of null checks |
| **Match** | Prefer `match` over `switch` |
| **Constants** | Use `App\Constants\*` classes |
| **Complexity** | Max 50 lines/method, 4 params, 10 complexity |
| **Nesting** | Max 3 levels, use early returns |
| **PHPDoc** | Document complex types and exceptions |