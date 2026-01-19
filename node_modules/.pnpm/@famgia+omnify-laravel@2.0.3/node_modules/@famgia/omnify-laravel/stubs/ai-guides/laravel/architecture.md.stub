# Design Philosophy

> This document explains the architectural decisions and design principles for this Laravel backend.

## Architecture: Thin Controller + Service (When Needed)

```mermaid
flowchart TD
    subgraph HTTP["HTTP Layer"]
        Route[Route] --> Middleware --> FormRequest
    end

    FormRequest --> Controller

    subgraph Controller["Controller Layer (Thin)"]
        C[Orchestrate request → response]
    end

    Controller --> Model
    Controller --> Service

    subgraph Data["Data Layer"]
        Model["Model (Simple CRUD)"]
        Service["Service (Complex ops)"]
    end

    Model --> Resource
    Service --> Resource

    subgraph Output["Response Layer"]
        Resource[Resource - JSON format]
    end
```

| Layer      | Responsibility                 | Rules                               |
| ---------- | ------------------------------ | ----------------------------------- |
| HTTP       | Routing, auth, validation      | No business logic                   |
| Controller | Orchestrate request → response | Delegate to Model or Service        |
| Model      | Simple CRUD                    | `User::create()`, `$user->update()` |
| Service    | Complex operations             | `OrderService`, `PaymentService`    |
| Resource   | Format JSON response           | Dates to ISO 8601                   |

---

## Core Principle: Don't Over-Engineer

### ❌ BAD: Over-Engineering Simple CRUD

```php
// DON'T create all these for simple CRUD:
app/
├── Repositories/
│   ├── UserRepositoryInterface.php
│   └── UserRepository.php
├── Services/
│   └── UserService.php
├── DTOs/
│   └── UserDTO.php
└── Contracts/
    └── UserServiceInterface.php

// Controller calls Service calls Repository calls Model
// 4 layers for a simple User::create()!
```

### ✅ GOOD: Simple CRUD = Controller + Model

```php
// Simple CRUD - Controller is enough
class UserController extends Controller
{
    public function store(UserStoreRequest $request): UserResource
    {
        $user = User::create($request->validated());
        return new UserResource($user);
    }
}

// That's it! No extra layers needed.
```

---

## When to Add Each Layer

### Layer Decision Matrix

| Scenario                  | Controller | Service | Action | Job |
| ------------------------- | ---------- | ------- | ------ | --- |
| Simple CRUD               | ✅          | ❌       | ❌      | ❌   |
| CRUD + send email         | ✅          | ❌       | ❌      | ✅   |
| Multi-step business logic | ✅          | ✅       | ❌      | ❌   |
| Reusable single operation | ✅          | ❌       | ✅      | ❌   |
| Long-running task         | ✅          | ❌       | ❌      | ✅   |

### Detailed Examples

#### 1. Simple CRUD → Controller Only

```php
// ✅ Direct model operations
public function store(UserStoreRequest $request): UserResource
{
    $user = User::create($request->validated());
    return new UserResource($user);
}

public function update(UserUpdateRequest $request, User $user): UserResource
{
    $user->update($request->validated());
    return new UserResource($user);
}
```

#### 2. CRUD + Side Effects → Controller + Job/Event

```php
// ✅ Use Job for async operations
public function store(UserStoreRequest $request): UserResource
{
    $user = User::create($request->validated());
    
    SendWelcomeEmail::dispatch($user);  // Async job
    event(new UserRegistered($user));   // Or event
    
    return new UserResource($user);
}
```

#### 3. Complex Business Logic → Service

```php
// ✅ Use Service for multi-step operations
class OrderController extends Controller
{
    public function __construct(
        private OrderService $orderService
    ) {}

    public function store(OrderRequest $request): OrderResource
    {
        $order = $this->orderService->checkout(
            cart: Cart::find($request->cart_id),
            user: $request->user(),
            paymentMethod: $request->payment_method
        );

        return new OrderResource($order);
    }
}

// Service handles complex logic
class OrderService
{
    public function checkout(Cart $cart, User $user, string $paymentMethod): Order
    {
        // 1. Validate cart items in stock
        $this->validateInventory($cart);
        
        // 2. Calculate totals
        $totals = $this->calculateTotals($cart);
        
        // 3. Process payment
        $payment = $this->paymentService->charge($user, $totals, $paymentMethod);
        
        // 4. Create order
        $order = Order::create([...]);
        
        // 5. Update inventory
        $this->updateInventory($cart);
        
        // 6. Send notifications
        event(new OrderPlaced($order));
        
        return $order;
    }
}
```

#### 4. Single Reusable Operation → Action

```php
// ✅ Use Action for reusable single-purpose operations
class CreateInvoiceAction
{
    public function execute(Order $order): Invoice
    {
        $invoice = Invoice::create([
            'order_id' => $order->id,
            'number' => $this->generateNumber(),
            'total' => $order->total,
        ]);
        
        GenerateInvoicePdf::dispatch($invoice);
        
        return $invoice;
    }
}

// Used in multiple places
class OrderController
{
    public function store(OrderRequest $request, CreateInvoiceAction $createInvoice)
    {
        $order = Order::create($request->validated());
        $createInvoice->execute($order);
        return new OrderResource($order);
    }
}

class RecurringBillingJob
{
    public function handle(CreateInvoiceAction $createInvoice)
    {
        foreach ($this->getSubscriptions() as $subscription) {
            $order = $subscription->createRenewalOrder();
            $createInvoice->execute($order);
        }
    }
}
```

---

## Why NOT Repository Pattern?

### Problem: Eloquent IS Already a Repository

```php
// Eloquent provides repository-like methods
User::find($id);
User::where('email', $email)->first();
User::create($data);
$user->update($data);
$user->delete();

// Adding Repository layer = duplicate abstraction
interface UserRepositoryInterface {
    public function find(int $id): ?User;
    public function findByEmail(string $email): ?User;
    public function create(array $data): User;
    // ... same methods as Eloquent!
}
```

### When Repository MIGHT Make Sense

```php
// Only if you genuinely need to swap data sources
// (rare in real projects)

interface ProductCatalogInterface {
    public function search(string $query): Collection;
}

class EloquentProductCatalog implements ProductCatalogInterface { ... }
class ElasticsearchProductCatalog implements ProductCatalogInterface { ... }
```

**Reality**: 99% of Laravel projects never swap databases. Don't add abstraction for hypothetical future needs.

---

## Design Principles

### 1. YAGNI (You Aren't Gonna Need It)

```php
// ❌ DON'T: Create interfaces "just in case"
interface UserServiceInterface { ... }
class UserService implements UserServiceInterface { ... }

// ✅ DO: Add abstraction only when needed
class UserService { ... }  // Concrete class is fine
```

### 2. Single Responsibility

```php
// ❌ DON'T: Fat controller
class UserController
{
    public function store(Request $request)
    {
        $validated = $request->validate([...]);  // Validation in controller
        $user = User::create($validated);
        Mail::send(...);                          // Email logic in controller
        $this->calculatePoints($user);           // Business logic in controller
        return response()->json($user);          // Manual JSON formatting
    }
}

// ✅ DO: Each layer has one job
class UserController
{
    public function store(UserStoreRequest $request): UserResource  // Type-hinted
    {
        $user = User::create($request->validated());  // FormRequest validates
        event(new UserRegistered($user));             // Event handles side effects
        return new UserResource($user);               // Resource formats output
    }
}
```

### 3. Explicit Over Implicit

```php
// ❌ DON'T: Magic methods, hidden behavior
class User extends Model
{
    public function __call($method, $args) { ... }  // Magic
}

// ✅ DO: Clear, readable code
class User extends Model
{
    public function orders(): HasMany { ... }       // Explicit relationship
    public function scopeActive($query) { ... }    // Clear scope
}
```

### 4. Fail Fast

```php
// ✅ Validate early with FormRequest
class OrderStoreRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'cart_id' => ['required', 'exists:carts,id'],
            'payment_method' => ['required', 'in:card,bank'],
        ];
    }
}

// ✅ Throw exceptions for invalid states
class OrderService
{
    public function checkout(Cart $cart): Order
    {
        if ($cart->items->isEmpty()) {
            throw new EmptyCartException();
        }
        
        if (!$this->hasInventory($cart)) {
            throw new InsufficientInventoryException();
        }
        
        // ... proceed with valid cart
    }
}
```

---

## Anti-Patterns to Avoid

### 1. ❌ Repository for Everything

```php
// DON'T
class UserRepository {
    public function all() { return User::all(); }
    public function find($id) { return User::find($id); }
    // Pointless wrapper around Eloquent
}
```

### 2. ❌ Service for Simple CRUD

```php
// DON'T
class UserService {
    public function create(array $data) {
        return User::create($data);  // Just wrapping model method
    }
}
```

### 3. ❌ DTOs for Request Data

```php
// DON'T
class UserDTO {
    public function __construct(
        public string $name,
        public string $email,
    ) {}
}

// FormRequest already does this!
$request->validated();  // Returns validated array
```

### 4. ❌ Interfaces Without Implementations

```php
// DON'T create interface for single implementation
interface UserServiceInterface { ... }
class UserService implements UserServiceInterface { ... }

// DO use interface only when you have multiple implementations
interface PaymentGatewayInterface { ... }
class StripePaymentGateway implements PaymentGatewayInterface { ... }
class PayPalPaymentGateway implements PaymentGatewayInterface { ... }
```

---

## Summary

| Principle           | Guideline                         |
| ------------------- | --------------------------------- |
| **Simple CRUD**     | Controller + Model + Resource     |
| **Side effects**    | Events, Jobs, Observers           |
| **Complex logic**   | Service (only when truly complex) |
| **Reusable action** | Action class                      |
| **Validation**      | FormRequest (always)              |
| **Response format** | Resource (always)                 |
| **Repository**      | ❌ Don't use (Eloquent is enough)  |
| **Interfaces**      | Only for multiple implementations |

**Golden Rule**: Start simple. Add layers only when complexity demands it.
