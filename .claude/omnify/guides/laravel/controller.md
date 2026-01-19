# Controller Guide

> **Related:** [README](./README.md) | [Service Guide](./service-guide.md) | [Request Guide](./request-guide.md)

## Golden Rule: Thin Controller

Controllers should only:
1. **Receive** validated input (via FormRequest)
2. **Delegate** to Model or Service
3. **Return** formatted response (via Resource)

```php
// ✅ PERFECT: Thin controller
public function store(UserStoreRequest $request): UserResource
{
    $user = User::create($request->validated());
    return new UserResource($user);
}

// ❌ BAD: Fat controller
public function store(Request $request)
{
    $validated = $request->validate([...]);  // Validation here
    $user = new User();
    $user->name = $validated['name'];        // Manual assignment
    $user->password = bcrypt($validated['password']);  // Logic here
    $user->save();
    Mail::to($user)->send(new WelcomeMail());  // Side effects here
    return response()->json([                 // Manual formatting
        'id' => $user->id,
        'name' => $user->name,
    ]);
}
```

---

## CRUD Controller Template

```php
<?php

namespace App\Http\Controllers;

use App\Http\Requests\UserStoreRequest;
use App\Http\Requests\UserUpdateRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     * GET /api/users?filter[search]=keyword&sort=-created_at&per_page=10
     */
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
            ->allowedSorts(['id', 'name', 'email', 'created_at', 'updated_at'])
            ->defaultSort('-id')
            ->paginate(request()->input('per_page', 10));

        return UserResource::collection($users);
    }

    /**
     * Store a newly created resource in storage.
     * POST /api/users
     */
    public function store(UserStoreRequest $request): JsonResponse
    {
        $user = User::create($request->validated());

        return (new UserResource($user))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Display the specified resource.
     * GET /api/users/{user}
     */
    public function show(User $user): UserResource
    {
        return new UserResource($user);
    }

    /**
     * Update the specified resource in storage.
     * PUT /api/users/{user}
     */
    public function update(UserUpdateRequest $request, User $user): UserResource
    {
        $user->update($request->validated());

        return new UserResource($user);
    }

    /**
     * Remove the specified resource from storage.
     * DELETE /api/users/{user}
     */
    public function destroy(User $user): JsonResponse
    {
        $user->delete();

        return response()->json(null, 204);
    }
}
```

---

## Controller Rules

### 1. Always Type-Hint Return Types

```php
// ✅ DO: Type-hint everything
public function index(): AnonymousResourceCollection
public function store(UserStoreRequest $request): UserResource
public function show(User $user): UserResource
public function destroy(User $user): JsonResponse

// ❌ DON'T: Missing return types
public function index()
public function store(Request $request)
```

### 2. Use Route Model Binding

```php
// ✅ DO: Auto-resolve model from route parameter
public function show(User $user): UserResource
{
    return new UserResource($user);
}

// ❌ DON'T: Manual find
public function show(int $id): UserResource
{
    $user = User::findOrFail($id);
    return new UserResource($user);
}
```

### 3. Always Use FormRequest for Validation

```php
// ✅ DO: Separate FormRequest class
public function store(UserStoreRequest $request): UserResource
{
    $user = User::create($request->validated());
    return new UserResource($user);
}

// ❌ DON'T: Validate in controller
public function store(Request $request): UserResource
{
    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|email|unique:users',
    ]);
    // ...
}
```

### 4. Always Return Resource

```php
// ✅ DO: Use Resource for consistent formatting
return new UserResource($user);
return UserResource::collection($users);

// ❌ DON'T: Return model or array directly
return $user;
return response()->json(['data' => $user]);
```

### 5. Use Dependency Injection for Services

```php
// ✅ DO: Constructor injection
class OrderController extends Controller
{
    public function __construct(
        private OrderService $orderService
    ) {}

    public function store(OrderRequest $request): OrderResource
    {
        $order = $this->orderService->checkout(...);
        return new OrderResource($order);
    }
}

// ❌ DON'T: Create service in method
public function store(OrderRequest $request): OrderResource
{
    $service = new OrderService();  // Hard to test
    // ...
}
```

---

## Query Parameters - List Endpoint

### Template

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

### API Example

```bash
GET /api/users?filter[search]=田中&sort=-created_at&per_page=20
```

### OpenAPI - Use Reusable Parameters

```php
#[OA\Get(
    path: '/api/users',
    summary: 'List users',
    description: 'Allowed sorts: id, name, email, created_at',
    parameters: [
        new OA\Parameter(ref: '#/components/parameters/FilterSearch'),
        new OA\Parameter(ref: '#/components/parameters/QueryPage'),
        new OA\Parameter(ref: '#/components/parameters/QueryPerPage'),
        new OA\Parameter(ref: '#/components/parameters/QuerySort'),
    ],
)]
```

### Keep It Simple

```php
// ✅ DO: Simple, flat filters
->allowedFilters([
    AllowedFilter::callback('search', fn($q, $v) => ...),
    AllowedFilter::exact('status'),
])
->allowedSorts(['id', 'name', 'created_at'])

// ❌ DON'T: Over-engineer
->allowedFilters([
    AllowedFilter::exact('author.company.country'),  // Too nested!
])
->allowedIncludes(['a', 'b', 'c', 'd', 'e'])  // Too many!
```

---

## OpenAPI Schema Location

Define schemas close to the code that uses them:

| Type         | Location                  | Example                                 |
| ------------ | ------------------------- | --------------------------------------- |
| Request body | `*Request.php`            | `UserStoreRequest`, `UserUpdateRequest` |
| Response     | `*Resource.php`           | `UserResource`                          |
| Pagination   | `app/OpenApi/Schemas.php` | `PaginationMeta`, `PaginationLinks`     |
| Parameters   | `app/OpenApi/Schemas.php` | `FilterSearch`, `QuerySort`             |

### Request Schema (on FormRequest class)

```php
// app/Http/Requests/UserStoreRequest.php
#[OA\Schema(
    schema: 'UserStoreRequest',
    required: ['name', 'email', 'password'],
    properties: [
        new OA\Property(property: 'name', type: 'string', example: '田中'),
        new OA\Property(property: 'email', type: 'string', format: 'email'),
        new OA\Property(property: 'password', type: 'string', minLength: 8),
    ]
)]
class UserStoreRequest extends FormRequest
```

### Response Schema (on Resource class)

```php
// app/Http/Resources/UserResource.php
#[OA\Schema(
    schema: 'User',
    properties: [
        new OA\Property(property: 'id', type: 'integer'),
        new OA\Property(property: 'name', type: 'string'),
        new OA\Property(property: 'email', type: 'string'),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time'),
    ]
)]
class UserResource extends JsonResource
```

### Controller uses refs

```php
#[OA\Post(
    path: '/api/users',
    requestBody: new OA\RequestBody(
        content: new OA\JsonContent(ref: '#/components/schemas/UserStoreRequest')
    ),
    responses: [
        new OA\Response(
            response: 201,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'data', ref: '#/components/schemas/User'),
                ]
            )
        ),
    ]
)]
```

---

## Don't Mix Concepts

| Concept          | Use For          | DON'T Use For        |
| ---------------- | ---------------- | -------------------- |
| `*StoreRequest`  | POST create      | GET list, PUT update |
| `*UpdateRequest` | PUT/PATCH update | POST create          |
| `*Resource`      | Response output  | Request input        |
| `index()`        | List (no body)   | Create/Update        |
| `store()`        | Create new       | Update existing      |
| `update()`       | Update existing  | Create new           |

---

## Response Status Codes

| Action  | Success Code   | Resource   |
| ------- | -------------- | ---------- |
| index   | 200 OK         | Collection |
| store   | 201 Created    | Resource   |
| show    | 200 OK         | Resource   |
| update  | 200 OK         | Resource   |
| destroy | 204 No Content | null       |

```php
// store returns 201 automatically via Resource
public function store(UserStoreRequest $request): UserResource
{
    $user = User::create($request->validated());
    
    return (new UserResource($user))
        ->response()
        ->setStatusCode(201);  // Explicit 201
}

// Or simpler (Laravel auto-returns 201 for new resources)
public function store(UserStoreRequest $request): UserResource
{
    return new UserResource(User::create($request->validated()));
}

// destroy returns 204
public function destroy(User $user): JsonResponse
{
    $user->delete();
    return response()->json(null, 204);
}
```

---

## When to Add Logic to Controller

### ✅ OK in Controller

```php
// Simple query building
$query = User::query();
if ($request->input('search')) {
    $query->where('name', 'like', '%'.$request->input('search').'%');
}

// Dispatching events/jobs (one-liners)
event(new UserRegistered($user));
SendWelcomeEmail::dispatch($user);

// Simple eager loading
$user->load('orders', 'profile');
```

### ❌ Move to Service

```php
// Multi-step business logic
// - Calculate pricing
// - Process payment
// - Create order
// - Update inventory
// - Send notifications
// → Create OrderService

// Complex validation beyond FormRequest
// - Check external API
// - Validate business rules
// → Create Service or Action

// Reusable across multiple controllers
// → Create Action class
```

---

## Anti-Patterns

```php
// ❌ DON'T: Business logic in controller
public function store(OrderRequest $request)
{
    $cart = Cart::find($request->cart_id);
    
    // 50 lines of pricing calculation
    // 30 lines of payment processing
    // 20 lines of inventory update
    
    return new OrderResource($order);
}

// ❌ DON'T: Validation in controller
public function store(Request $request)
{
    $request->validate([...]);  // Use FormRequest instead
}

// ❌ DON'T: Manual JSON response
public function show(User $user)
{
    return response()->json([
        'id' => $user->id,
        'name' => $user->name,
    ]);  // Use Resource instead
}

// ❌ DON'T: Try-catch for expected exceptions
public function show(int $id)
{
    try {
        $user = User::findOrFail($id);
    } catch (ModelNotFoundException $e) {
        return response()->json(['error' => 'Not found'], 404);
    }
    // Laravel handles this automatically with route model binding
}
```
