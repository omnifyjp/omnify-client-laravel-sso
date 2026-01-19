---
id: laravel-controller
description: "Laravel controller patterns: thin controllers with query builder, OpenAPI documentation (NO /api prefix!), validation with $request->validated(), and proper Resource usage. Apply when creating or editing controllers."
priority: medium
globs:
  - "app/Http/Controllers/**/*.php"
tags:
  - laravel
  - controller
---

# Controller Rules

## ⚠️ CRITICAL: Check Route Prefix BEFORE Writing OpenAPI

**MUST check route file prefix first!** Don't assume - VERIFY.

### Before Writing OpenAPI Path:

1. **Check route file** → Which file has your route? (`api.php`, `web.php`, custom?)
2. **Check prefix** → Look in `RouteServiceProvider` or `bootstrap/app.php`
3. **Write path WITHOUT prefix** → OpenAPI path = Route definition path

```php
// Route trong api.php (prefix: /api)
Route::get('/users', [UserController::class, 'index']);

// ❌ SAI - Duplicate prefix → /api/api/users !!
#[OA\Get(path: '/api/users')]

// ✅ ĐÚNG - Path không có prefix
#[OA\Get(path: '/users')]  // → /api/users
```

| Route File | Prefix | Route Definition | OpenAPI Path |
|------------|--------|------------------|--------------|
| `api.php` | `/api` | `/users` | `/users` |
| `web.php` | (none) | `/dashboard` | `/dashboard` |

**Full guide:** `.claude/omnify/guides/laravel/openapi.md`

---

## Golden Rule: Thin Controller

```php
// ✅ PERFECT
public function store(UserStoreRequest $request): UserResource
{
    return new UserResource(User::create($request->validated()));
}

// ❌ BAD: Fat controller with logic
public function store(Request $request)
{
    $validated = $request->validate([...]); // Use FormRequest!
    // 50 lines of business logic... // Use Service!
}
```

## Index Method - Query Builder Template

```php
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

public function index(): AnonymousResourceCollection
{
    $users = QueryBuilder::for(User::class)
        ->allowedFilters([
            AllowedFilter::callback('search', function ($query, $value) {
                $query->where(function ($q) use ($value) {
                    $q->where('name', 'like', "%{$value}%")
                      ->orWhere('email', 'like', "%{$value}%");
                });
            }),
        ])
        ->allowedSorts(['id', 'name', 'email', 'created_at'])
        ->defaultSort('-id')
        ->paginate(request()->input('per_page', 10));

    return UserResource::collection($users);
}
```

## OpenAPI - Schema MUST Match Code

Frontend needs exact response/request structure. Always verify against actual code.

### Golden Rule: Verify Before Writing OpenAPI

1. **Response** → Check `*Resource.php` schema  
2. **Request** → Check `*Request.php` schema  
3. **Parameters** → Check `allowedFilters()` / `allowedSorts()`

### Schema Location

| Type                     | Define At                | Ref In Controller                       |
| ------------------------ | ------------------------ | --------------------------------------- |
| Response                 | `*Resource.php`          | `#/components/schemas/User`             |
| Request body             | `*Request.php`           | `#/components/schemas/UserStoreRequest` |
| Pagination               | `Schemas.php`            | `#/components/schemas/PaginationMeta`   |
| Common params            | `Schemas.php`            | `#/components/parameters/QueryPage`     |
| Resource-specific params | **Inline in Controller** | N/A                                     |

### Common refs from `Schemas.php`

```php
// Parameters
new OA\Parameter(ref: '#/components/parameters/QueryPage'),
new OA\Parameter(ref: '#/components/parameters/QueryPerPage'),
new OA\Parameter(ref: '#/components/parameters/PathId'),

// Responses
new OA\Response(ref: '#/components/responses/ValidationError', response: 422),
new OA\Response(ref: '#/components/responses/NotFound', response: 404),
new OA\Response(ref: '#/components/responses/NoContent', response: 204),

// Pagination
new OA\Property(property: 'links', ref: '#/components/schemas/PaginationLinks'),
new OA\Property(property: 'meta', ref: '#/components/schemas/PaginationMeta'),
```

### Filter & Sort - MUST Document Specifically

`filter` and `sort` differ per resource → Write inline with specific details.

#### Filter Types (Spatie Query Builder)

| Type              | Code                                       | OpenAPI Description        | Example                 |
| ----------------- | ------------------------------------------ | -------------------------- | ----------------------- |
| Callback (search) | `AllowedFilter::callback('search', fn...)` | List all searchable fields | `filter[search]=田中`   |
| Exact             | `AllowedFilter::exact('status')`           | Exact match                | `filter[status]=active` |
| Partial           | `AllowedFilter::partial('name')`           | LIKE %value%               | `filter[name]=田中`     |
| Scope             | `AllowedFilter::scope('active')`           | Model scope                | `filter[active]=1`      |

#### Filter Documentation Template

```php
// CODE: allowedFilters() configuration
->allowedFilters([
    AllowedFilter::callback('search', function ($query, $value) {
        $query->where(function ($q) use ($value) {
            $q->where('name_lastname', 'like', "%{$value}%")
              ->orWhere('name_firstname', 'like', "%{$value}%")
              ->orWhere('name_kana_lastname', 'like', "%{$value}%")
              ->orWhere('name_kana_firstname', 'like', "%{$value}%")
              ->orWhere('email', 'like', "%{$value}%");
        });
    }),
    AllowedFilter::exact('status'),
])

// OPENAPI: Document EACH filter with specific description
new OA\Parameter(
    name: 'filter[search]',
    in: 'query',
    description: 'Partial match on: name_lastname, name_firstname, name_kana_lastname, name_kana_firstname, email',
    schema: new OA\Schema(type: 'string'),
    example: '田中'
),
new OA\Parameter(
    name: 'filter[status]',
    in: 'query',
    description: 'Exact match on status',
    schema: new OA\Schema(type: 'string', enum: ['active', 'inactive']),
    example: 'active'
),
```

#### Sort Documentation Template

```php
// CODE: allowedSorts() + defaultSort()
->allowedSorts(['id', 'name_lastname', 'name_firstname', 'email', 'created_at', 'updated_at'])
->defaultSort('-id')

// OPENAPI: enum MUST include both asc and desc for each field
new OA\Parameter(
    name: 'sort',
    in: 'query',
    description: 'Sort field. Prefix `-` for descending. Default: `-id`',
    schema: new OA\Schema(
        type: 'string',
        enum: [
            'id', '-id',
            'name_lastname', '-name_lastname',
            'name_firstname', '-name_firstname',
            'email', '-email',
            'created_at', '-created_at',
            'updated_at', '-updated_at'
        ]
    ),
    example: '-created_at'
),
```

#### Checklist: Filter & Sort Documentation

| Item                          | Check                                           |
| ----------------------------- | ----------------------------------------------- |
| Each `AllowedFilter`          | Has corresponding `filter[name]` parameter?     |
| Callback filter               | Description lists ALL searchable fields?        |
| Exact filter with enum values | `schema.enum` matches valid values?             |
| `allowedSorts()`              | `sort.enum` includes both `field` and `-field`? |
| `defaultSort()`               | Mentioned in `sort.description`?                |

### OpenAPI Checklist per Action

#### `index()` - List

**Verify before writing:**
1. `allowedFilters()` → Each filter has `filter[name]` param with specific description
2. `allowedSorts()` → `sort.enum` includes all fields + `-field` versions
3. `defaultSort()` → Mentioned in sort description
4. Response → ref to Resource + PaginationLinks + PaginationMeta

```php
#[OA\Get(
    parameters: [
        // Each allowedFilter → specific param
        new OA\Parameter(
            name: 'filter[search]',
            in: 'query',
            description: 'Partial match on: name_lastname, name_firstname, email',  // ← List actual fields!
            schema: new OA\Schema(type: 'string'),
            example: '田中'
        ),
        // Pagination
        new OA\Parameter(ref: '#/components/parameters/QueryPage'),
        new OA\Parameter(ref: '#/components/parameters/QueryPerPage'),
        // Sort with full enum
        new OA\Parameter(
            name: 'sort',
            in: 'query',
            description: 'Sort field. Prefix `-` for descending. Default: `-id`',  // ← Include default!
            schema: new OA\Schema(
                type: 'string',
                enum: ['id', '-id', 'name', '-name', 'created_at', '-created_at']  // ← Match allowedSorts!
            ),
            example: '-created_at'
        ),
    ],
    responses: [
        new OA\Response(response: 200, content: new OA\JsonContent(
            properties: [
                new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/User')),
                new OA\Property(property: 'links', ref: '#/components/schemas/PaginationLinks'),
                new OA\Property(property: 'meta', ref: '#/components/schemas/PaginationMeta'),
            ]
        )),
    ]
)]
```

#### `store()` - Create

```php
// 1. Request: ref to *StoreRequest schema
// 2. Response: ref to Resource schema
// 3. Errors: 422 ValidationError

#[OA\Post(
    requestBody: new OA\RequestBody(
        required: true,
        content: new OA\JsonContent(ref: '#/components/schemas/UserStoreRequest')  // ← Check UserStoreRequest.php
    ),
    responses: [
        new OA\Response(response: 201, content: new OA\JsonContent(
            properties: [new OA\Property(property: 'data', ref: '#/components/schemas/User')]
        )),
        new OA\Response(ref: '#/components/responses/ValidationError', response: 422),
    ]
)]
```

#### `show()` - Get Single

```php
// 1. Parameter: PathId
// 2. Response: ref to Resource schema
// 3. Errors: 404 NotFound

#[OA\Get(
    parameters: [new OA\Parameter(ref: '#/components/parameters/PathId')],
    responses: [
        new OA\Response(response: 200, content: new OA\JsonContent(
            properties: [new OA\Property(property: 'data', ref: '#/components/schemas/User')]
        )),
        new OA\Response(ref: '#/components/responses/NotFound', response: 404),
    ]
)]
```

#### `update()` - Update

```php
// 1. Parameter: PathId
// 2. Request: ref to *UpdateRequest schema (NOT StoreRequest!)
// 3. Response: ref to Resource schema
// 4. Errors: 404, 422

#[OA\Put(
    parameters: [new OA\Parameter(ref: '#/components/parameters/PathId')],
    requestBody: new OA\RequestBody(
        content: new OA\JsonContent(ref: '#/components/schemas/UserUpdateRequest')  // ← Check UserUpdateRequest.php
    ),
    responses: [
        new OA\Response(response: 200, content: ...),
        new OA\Response(ref: '#/components/responses/NotFound', response: 404),
        new OA\Response(ref: '#/components/responses/ValidationError', response: 422),
    ]
)]
```

#### `destroy()` - Delete

```php
// 1. Parameter: PathId
// 2. Response: 204 NoContent
// 3. Errors: 404 NotFound

#[OA\Delete(
    parameters: [new OA\Parameter(ref: '#/components/parameters/PathId')],
    responses: [
        new OA\Response(ref: '#/components/responses/NoContent', response: 204),
        new OA\Response(ref: '#/components/responses/NotFound', response: 404),
    ]
)]
```

## Response Status Codes

| Action  | Code | Return Type                   |
| ------- | ---- | ----------------------------- |
| index   | 200  | Collection                    |
| store   | 201  | Resource + status             |
| show    | 200  | Resource                      |
| update  | 200  | Resource                      |
| destroy | 204  | `response()->json(null, 204)` |

## Imports - MUST use short names

```php
// ✅ CORRECT
use Illuminate\Http\JsonResponse;
use Spatie\QueryBuilder\QueryBuilder;

public function store(): JsonResponse

// ❌ WRONG - Never FQCN inline
public function store(): \Illuminate\Http\JsonResponse
```

## Keep It Simple

```php
// ✅ DO
->allowedFilters([
    AllowedFilter::callback('search', fn($q, $v) => ...),
])
->allowedSorts(['id', 'name', 'created_at'])

// ❌ DON'T over-engineer
->allowedFilters([
    AllowedFilter::exact('author.company.country'),  // Too nested!
])
```

## Don't Mix Concepts

| Concept          | Use For          | DON'T Use For        |
| ---------------- | ---------------- | -------------------- |
| `*StoreRequest`  | POST create      | GET list, PUT update |
| `*UpdateRequest` | PUT/PATCH update | POST create          |
| `*Resource`      | Response output  | Request input        |
| `index()`        | List (no body)   | Create/Update        |
| `store()`        | Create new       | Update existing      |
| `update()`       | Update existing  | Create new           |

```php
// ❌ WRONG: Using StoreRequest for update
public function update(UserStoreRequest $request) // WRONG!

// ✅ CORRECT: Each action has its own Request
public function store(UserStoreRequest $request)   // Create
public function update(UserUpdateRequest $request) // Update
```

## After Coding Checklist

### Code
1. ✅ Run tests: `./artisan test --filter=ControllerTest`

### OpenAPI (only if annotations changed)

| Check           | Code               | OpenAPI                 | Match                                 |
| --------------- | ------------------ | ----------------------- | ------------------------------------- |
| Response        | `*Resource.php`    | `ref: User`             | Schema exists? Properties match?      |
| Request         | `*Request.php`     | `ref: UserStoreRequest` | Schema exists? Required fields match? |
| Filters         | `allowedFilters()` | `filter[name]` params   | Each filter documented?               |
| Callback filter | Fields in callback | `description`           | All fields listed?                    |
| Exact filter    | Valid values       | `schema.enum`           | Enum matches valid values?            |
| Sort            | `allowedSorts()`   | `sort.enum`             | Includes `field` AND `-field`?        |
| Default sort    | `defaultSort()`    | `sort.description`      | Default mentioned?                    |

```bash
# Generate and verify
./artisan l5-swagger:generate

# Check json output
cat backend/storage/api-docs/api-docs.json | jq '.components.schemas.User'
cat backend/storage/api-docs/api-docs.json | jq '.components.schemas.UserStoreRequest'
```

### Common Mistakes

| Mistake                         | Fix                                                                       |
| ------------------------------- | ------------------------------------------------------------------------- |
| `ref: User` missing             | Add `#[OA\Schema]` to `UserResource.php`                                  |
| `ref: UserStoreRequest` missing | Add `#[OA\Schema]` to `UserStoreRequest.php`                              |
| sort enum incomplete            | Include BOTH `field` AND `-field` for each `allowedSorts()`               |
| sort missing default            | Add "Default: `-id`" to sort description                                  |
| filter description vague        | List ALL fields: "Partial match on: name_lastname, name_firstname, email" |
| filter[status] no enum          | Add `enum: ['active', 'inactive']` for exact filters                      |
| Using StoreRequest for update   | Use UpdateRequest for PUT/PATCH                                           |