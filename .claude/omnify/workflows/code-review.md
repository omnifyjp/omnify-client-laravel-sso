# Code Review Workflow

> Checklist for reviewing pull requests.

## Overview

```mermaid
flowchart LR
    Read --> Security --> Performance --> Quality --> Test --> Approve
```

---

## 1. Understand the Change

- [ ] Read PR description
- [ ] Understand the purpose
- [ ] Check linked issue/ticket

---

## 2. Security Review

> **Reference:** [/rules/security.md](../rules/security.md)

### Must Check

| Item            | Look For                                            |
| --------------- | --------------------------------------------------- |
| Mass Assignment | Using `$request->validated()` not `$request->all()` |
| SQL Injection   | No raw SQL with user input                          |
| `$fillable`     | Defined in models, no sensitive fields              |
| `$hidden`       | Password and tokens hidden                          |
| XSS             | No `{!! $userInput !!}` in Blade                    |

### Code Review

```php
// ❌ REJECT: Mass assignment vulnerability
User::create($request->all());

// ✅ APPROVE: Using validated data
User::create($request->validated());
```

---

## 3. Performance Review

> **Reference:** [/rules/performance.md](../rules/performance.md)

### Must Check

| Item          | Look For                         |
| ------------- | -------------------------------- |
| N+1 Queries   | `with()` used for relationships  |
| Pagination    | List endpoints use `paginate()`  |
| Resources     | `whenLoaded()` for relationships |
| Eager Loading | No lazy loading in loops         |

### Code Review

```php
// ❌ REJECT: N+1 problem
$posts = Post::all();
foreach ($posts as $post) {
    echo $post->author->name;
}

// ✅ APPROVE: Eager loaded
$posts = Post::with('author')->get();
```

---

## 4. Code Quality Review

### Must Check

| Item          | Look For                           |
| ------------- | ---------------------------------- |
| Validation    | FormRequest not inline validation  |
| Response      | Resource not raw model             |
| Route binding | `User $user` not `findOrFail($id)` |
| Dates         | `->toISOString()` in Resources     |
| Types         | Return type hints on methods       |

### Naming

> **Reference:** [/rules/naming.md](../rules/naming.md)

| Type       | Pattern                  |
| ---------- | ------------------------ |
| Controller | `{Model}Controller`      |
| Request    | `{Model}{Action}Request` |
| Resource   | `{Model}Resource`        |
| Test       | `{Model}ControllerTest`  |

---

## 5. Test Review

### Must Have

| Endpoint | 正常系             | 異常系                |
| -------- | ------------------ | --------------------- |
| index    | List, filter, sort | Empty, invalid params |
| store    | Creates → 201      | 422 (validation)      |
| show     | Returns → 200      | 404                   |
| update   | Updates → 200      | 404, 422              |
| destroy  | Deletes → 204      | 404                   |

### Test Naming

```php
// ✅ Good naming
it('正常: creates user with valid data')
it('異常: fails to create user with invalid email')
it('異常: returns 404 when user not found')
```

---

## 6. Final Checks

- [ ] All tests pass
- [ ] No debug code (`dd()`, `dump()`, `Log::debug()`)
- [ ] No commented-out code
- [ ] No console.log or debug statements
- [ ] Follows existing patterns in codebase

---

## Review Decision

### ✅ Approve If

- All security checks pass
- All performance checks pass
- Tests cover 正常系 + 異常系
- Code follows conventions

### 🔄 Request Changes If

- Security vulnerability found
- Performance issue (N+1, no pagination)
- Missing tests
- Naming/pattern violations

### Example Comments

```markdown
## Security Issue
❌ Line 45: Using `$request->all()` - please use `$request->validated()`

## Performance Issue
❌ Line 23: Missing `with('author')` - will cause N+1 queries

## Missing Test
❌ No test for 422 validation error case

## Naming
❌ `UserCreateRequest` should be `UserStoreRequest` (Laravel convention)
```
