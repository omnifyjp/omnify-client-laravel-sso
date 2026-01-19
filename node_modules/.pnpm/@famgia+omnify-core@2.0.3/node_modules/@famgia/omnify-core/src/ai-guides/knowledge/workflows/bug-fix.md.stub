# Bug Fix Workflow

> Step-by-step guide for fixing bugs.

## Overview

```mermaid
flowchart LR
    Reproduce --> Locate --> Fix --> Test --> PR
```

| Step | Action                | Output                         |
| ---- | --------------------- | ------------------------------ |
| 1    | Reproduce the bug     | Clear reproduction steps       |
| 2    | Locate the cause      | File(s) and line(s) identified |
| 3    | Write failing test    | Test that reproduces bug       |
| 4    | Fix the bug           | Code changes                   |
| 5    | Verify test passes    | `./artisan test`               |
| 6    | Check for regressions | All tests pass                 |
| 7    | Create PR             | Pull request                   |

---

## Step 1: Reproduce

Before fixing, confirm you can reproduce:

```bash
# Check logs
tail -f backend/storage/logs/laravel.log

# Test the endpoint
curl -X GET https://api.boilerplate.app/api/users
```

**Document:**
- Steps to reproduce
- Expected behavior
- Actual behavior
- Error message/stack trace

---

## Step 2: Locate the Cause

### Common Locations

| Symptom             | Check                            |
| ------------------- | -------------------------------- |
| 500 error           | `storage/logs/laravel.log`       |
| 422 validation      | `*Request.php` rules             |
| Wrong data returned | `*Resource.php`                  |
| 404 not found       | `routes/api.php` + model binding |
| N+1 queries         | Missing `with()` in controller   |
| Date format wrong   | Missing `->toISOString()`        |

### Debug Commands

```bash
# Check route exists
./artisan route:list | grep users

# Check model
./artisan tinker
>>> User::find(1)
```

---

## Step 3: Write Failing Test

**ALWAYS write a test that reproduces the bug first.**

```php
// tests/Feature/Api/UserControllerTest.php

it('異常: bug #123 - returns 500 when name is null', function () {
    // This should NOT happen but currently does
    $response = $this->postJson('/api/users', [
        'email' => 'test@example.com',
        'password' => 'password123',
        // name is missing - should return 422, not 500
    ]);
    
    $response->assertUnprocessable(); // Currently fails with 500
});
```

Run test to confirm it fails:

```bash
./artisan test --filter="bug #123"
```

---

## Step 4: Fix the Bug

Make the minimal change to fix the issue.

**Don't:**
- Refactor unrelated code
- Add features
- Change coding style

**Do:**
- Fix only the bug
- Keep changes focused
- Follow existing patterns

---

## Step 5: Verify Fix

```bash
# Run the specific test
./artisan test --filter="bug #123"

# Run all tests for the affected controller
./artisan test --filter=UserControllerTest

# Run all tests
./artisan test
```

---

## Step 6: Check for Regressions

```bash
# All backend tests
./artisan test

# Specific test file
./artisan test tests/Feature/Api/UserControllerTest.php
```

---

## Step 7: Create PR

### PR Title Format

```
fix: [#issue] brief description
```

Example: `fix: [#123] return 422 instead of 500 when name is missing`

### PR Description

```markdown
## Bug

[Link to issue or description]

## Root Cause

[Explanation of what caused the bug]

## Fix

[Description of the fix]

## Test

- [ ] Added test that reproduces bug
- [ ] Test passes after fix
- [ ] All existing tests pass
```

---

## Debugging Tips

### Laravel Logs

```php
// Add temporary logging
Log::info('Debug', ['user' => $user, 'request' => $request->all()]);
```

### Database Queries

```php
// Enable query log
DB::enableQueryLog();

// ... your code ...

// Dump queries
dd(DB::getQueryLog());
```

### Tinker

```bash
./artisan tinker
>>> User::where('email', 'test@example.com')->first()
>>> app(UserService::class)->someMethod()
```
