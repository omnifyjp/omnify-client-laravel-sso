# Backend Checklist

> Quick reference. For details, see linked guides.

## New Resource

| Step | Action                | Guide                                                       |
| ---- | --------------------- | ----------------------------------------------------------- |
| 1    | Create schema         | [guides/omnify/schema-guide.md](../guides/omnify/schema-guide.md) |
| 2    | `npx omnify generate` |                                                             |
| 3    | `./artisan migrate`   |                                                             |
| 4    | Model (extend base)   | [guides/laravel/README.md](../guides/laravel/README.md)     |
| 5    | Controller (thin)     |                                                             |
| 6    | Resource              |                                                             |
| 7    | Routes                |                                                             |
| 8    | **Tests**             | [guides/laravel/testing.md](../guides/laravel/testing.md)   |
| 9    | `./artisan test`      |                                                             |
| 10   | OpenAPI               | [guides/laravel/openapi.md](../guides/laravel/openapi.md)   |

> **Full workflow**: [workflows/new-feature.md](../workflows/new-feature.md)

---

## Before Commit

### Code
- [ ] No `dd()`, `dump()`, `console.log`
- [ ] No commented-out code
- [ ] Type hints on methods

### Security
- [ ] `$fillable` defined in Model
- [ ] `$request->validated()` (not `all()`)
- [ ] Sensitive data in `$hidden`

### API
- [ ] Dates use `->toISOString()`
- [ ] Return Resource (not Model)
- [ ] Proper HTTP status codes

### Performance
- [ ] `with()` for relations
- [ ] `whenLoaded()` in Resources
- [ ] `paginate()` for lists

> **Details**: [rules/](../rules/)

---

## Tests

### Coverage Required

| Endpoint    | 正常系             | 異常系                |
| ----------- | ------------------ | --------------------- |
| **index**   | List, filter, sort | Empty, invalid params |
| **store**   | Creates → 201      | 422 (validation)      |
| **show**    | Returns → 200      | 404                   |
| **update**  | Updates → 200      | 404, 422              |
| **destroy** | Deletes → 204      | 404                   |

### Auth Tests (if protected)
- 401: Not authenticated
- 403: Not authorized

> **Full guide**: [guides/laravel/testing.md](../guides/laravel/testing.md)

---

## OpenAPI

1. Check `OmnifyBase/*RequestBase.php` for request fields
2. Check `OmnifyBase/*ResourceBase.php` for response fields
3. Use `$ref` from `Schemas.php`
4. Run `./artisan l5-swagger:generate`

> **Full guide**: [guides/laravel/openapi.md](../guides/laravel/openapi.md)

---

## Controller Methods

### index
```php
return UserResource::collection(
    User::with('relation')
        ->when($request->search, fn($q, $s) => $q->where('name', 'like', "%{$s}%"))
        ->paginate($request->input('per_page', 15))
);
```

### store
```php
return new UserResource(User::create($request->validated()));
```

### show
```php
return new UserResource($user->load('relation'));
```

### update
```php
$user->update($request->validated());
return new UserResource($user);
```

### destroy
```php
$user->delete();
return response()->noContent();
```
