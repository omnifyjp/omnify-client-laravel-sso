# Service Guide

> **Related:** [README](./README.md) | [Controller Guide](./controller-guide.md) | [Design Philosophy](./design-philosophy.md)

## When to Use Service

| ✅ Use Service                        | ❌ Don't Use Service        |
| ------------------------------------ | -------------------------- |
| Multi-step business logic            | Simple CRUD                |
| External API calls                   | Single model operation     |
| Complex calculations                 | Basic queries              |
| Logic reused across controllers      | Controller-specific logic  |
| Transaction spanning multiple models | Single model create/update |

---

## Service vs Action

| Service                                       | Action                           |
| --------------------------------------------- | -------------------------------- |
| Multiple related operations                   | Single purpose                   |
| Stateful (can have dependencies)              | Usually stateless                |
| `OrderService::checkout()`, `processRefund()` | `CreateInvoiceAction::execute()` |
| Groups related methods                        | One class = one action           |

---

## Service Template

```php
<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\Order;
use App\Models\User;
use App\Events\OrderPlaced;
use App\Exceptions\InsufficientInventoryException;
use App\Exceptions\PaymentFailedException;
use Illuminate\Support\Facades\DB;

class OrderService
{
    public function __construct(
        private PaymentService $paymentService,
        private InventoryService $inventoryService
    ) {}

    /**
     * Process checkout: validate → pay → create order → update inventory
     *
     * @throws InsufficientInventoryException
     * @throws PaymentFailedException
     */
    public function checkout(Cart $cart, User $user, string $paymentMethod): Order
    {
        // 1. Validate business rules
        $this->validateCart($cart);
        $this->inventoryService->validateAvailability($cart->items);

        // 2. Calculate totals
        $totals = $this->calculateTotals($cart);

        // 3. Process payment
        $payment = $this->paymentService->charge(
            user: $user,
            amount: $totals['total'],
            method: $paymentMethod
        );

        // 4. Create order (in transaction)
        $order = DB::transaction(function () use ($cart, $user, $totals, $payment) {
            $order = Order::create([
                'user_id' => $user->id,
                'subtotal' => $totals['subtotal'],
                'tax' => $totals['tax'],
                'total' => $totals['total'],
                'payment_id' => $payment->id,
                'status' => 'paid',
            ]);

            // Create order items
            foreach ($cart->items as $item) {
                $order->items()->create([
                    'product_id' => $item->product_id,
                    'quantity' => $item->quantity,
                    'price' => $item->price,
                ]);
            }

            // Update inventory
            $this->inventoryService->decrementStock($cart->items);

            // Clear cart
            $cart->items()->delete();
            $cart->delete();

            return $order;
        });

        // 5. Dispatch events (outside transaction)
        event(new OrderPlaced($order));

        return $order;
    }

    /**
     * Process refund for an order
     */
    public function refund(Order $order, ?string $reason = null): Order
    {
        if (!$order->canBeRefunded()) {
            throw new \DomainException('Order cannot be refunded');
        }

        return DB::transaction(function () use ($order, $reason) {
            // Refund payment
            $this->paymentService->refund($order->payment_id);

            // Restore inventory
            $this->inventoryService->restoreStock($order->items);

            // Update order
            $order->update([
                'status' => 'refunded',
                'refund_reason' => $reason,
                'refunded_at' => now(),
            ]);

            return $order->fresh();
        });
    }

    private function validateCart(Cart $cart): void
    {
        if ($cart->items->isEmpty()) {
            throw new \DomainException('Cart is empty');
        }
    }

    private function calculateTotals(Cart $cart): array
    {
        $subtotal = $cart->items->sum(fn ($item) => $item->price * $item->quantity);
        $tax = $subtotal * 0.1;  // 10% tax

        return [
            'subtotal' => $subtotal,
            'tax' => $tax,
            'total' => $subtotal + $tax,
        ];
    }
}
```

---

## Using Service in Controller

```php
<?php

namespace App\Http\Controllers;

use App\Http\Requests\OrderStoreRequest;
use App\Http\Resources\OrderResource;
use App\Models\Cart;
use App\Services\OrderService;

class OrderController extends Controller
{
    public function __construct(
        private OrderService $orderService
    ) {}

    public function store(OrderStoreRequest $request): OrderResource
    {
        $order = $this->orderService->checkout(
            cart: Cart::findOrFail($request->cart_id),
            user: $request->user(),
            paymentMethod: $request->payment_method
        );

        return new OrderResource($order);
    }

    public function refund(Order $order, RefundRequest $request): OrderResource
    {
        $order = $this->orderService->refund(
            order: $order,
            reason: $request->reason
        );

        return new OrderResource($order);
    }
}
```

---

## Service Rules

### 1. Constructor Injection for Dependencies

```php
// ✅ DO: Inject dependencies
class OrderService
{
    public function __construct(
        private PaymentService $paymentService,
        private InventoryService $inventoryService
    ) {}
}

// ❌ DON'T: Create dependencies inside
class OrderService
{
    public function checkout()
    {
        $paymentService = new PaymentService();  // Hard to test
    }
}
```

### 2. Use Transactions for Multi-Model Operations

```php
// ✅ DO: Wrap in transaction
return DB::transaction(function () {
    $order = Order::create([...]);
    $order->items()->createMany([...]);
    $this->updateInventory();
    return $order;
});

// ❌ DON'T: Multiple saves without transaction
$order = Order::create([...]);
$order->items()->createMany([...]);  // If this fails, order exists without items
```

### 3. Dispatch Events Outside Transaction

```php
// ✅ DO: Events after transaction commits
$order = DB::transaction(function () {
    return Order::create([...]);
});
event(new OrderPlaced($order));  // After transaction

// ❌ DON'T: Events inside transaction (might fire before commit)
DB::transaction(function () {
    $order = Order::create([...]);
    event(new OrderPlaced($order));  // Dangerous!
});
```

### 4. Throw Domain Exceptions

```php
// ✅ DO: Custom exceptions for business rules
if (!$order->canBeRefunded()) {
    throw new OrderCannotBeRefundedException($order);
}

if ($cart->items->isEmpty()) {
    throw new EmptyCartException();
}

// ❌ DON'T: Generic exceptions
throw new \Exception('Cart is empty');  // Not specific
```

### 5. Return Models, Not Arrays

```php
// ✅ DO: Return Eloquent models
public function checkout(...): Order
{
    // ...
    return $order;
}

// ❌ DON'T: Return arrays (loses type safety)
public function checkout(...): array
{
    return ['order' => $order, 'invoice' => $invoice];
}
```

---

## Action Pattern (Alternative)

For single-purpose operations that need to be reused:

```php
<?php

namespace App\Actions;

use App\Models\Order;
use App\Models\Invoice;
use App\Jobs\GenerateInvoicePdf;

class CreateInvoiceAction
{
    public function execute(Order $order): Invoice
    {
        $invoice = Invoice::create([
            'order_id' => $order->id,
            'number' => $this->generateNumber(),
            'subtotal' => $order->subtotal,
            'tax' => $order->tax,
            'total' => $order->total,
            'issued_at' => now(),
        ]);

        GenerateInvoicePdf::dispatch($invoice);

        return $invoice;
    }

    private function generateNumber(): string
    {
        $year = now()->format('Y');
        $sequence = Invoice::whereYear('created_at', $year)->count() + 1;
        
        return sprintf('INV-%s-%05d', $year, $sequence);
    }
}
```

### Using Action

```php
// In Controller
public function store(OrderRequest $request, CreateInvoiceAction $createInvoice)
{
    $order = Order::create($request->validated());
    $createInvoice->execute($order);
    
    return new OrderResource($order);
}

// In Job
class RecurringBillingJob
{
    public function handle(CreateInvoiceAction $createInvoice)
    {
        $subscriptions = Subscription::due()->get();
        
        foreach ($subscriptions as $subscription) {
            $order = $subscription->createRenewalOrder();
            $createInvoice->execute($order);
        }
    }
}

// In Console Command
class CreateMonthlyInvoicesCommand extends Command
{
    public function handle(CreateInvoiceAction $createInvoice)
    {
        Order::unpaid()->each(fn ($order) => $createInvoice->execute($order));
    }
}
```

---

## Service vs Controller Decision

```
┌─────────────────────────────────────────────┐
│              NEW FEATURE                     │
└─────────────────┬───────────────────────────┘
                  │
        Is it simple CRUD?
                  │
       ┌──────────┴──────────┐
       │                     │
      YES                   NO
       │                     │
       ▼                     ▼
   Controller          How many steps?
   handles it                │
                  ┌──────────┴──────────┐
                  │                     │
              1-2 steps            3+ steps
                  │                     │
                  ▼                     ▼
             Controller            Service
             + Job/Event
```

---

## Anti-Patterns

```php
// ❌ DON'T: Service for simple CRUD
class UserService
{
    public function create(array $data): User
    {
        return User::create($data);  // Pointless wrapper
    }
}

// ❌ DON'T: Service calling controller methods
class UserService
{
    public function __construct(private UserController $controller) {}
}

// ❌ DON'T: HTTP-specific logic in service
class UserService
{
    public function create(Request $request)  // Don't pass Request
    {
        return User::create($request->validated());
    }
}

// ✅ DO: Pass validated data
class UserService
{
    public function createWithTeam(array $userData, array $teamData): User
    {
        // Complex operation that involves multiple models
    }
}

// ❌ DON'T: Return response in service
class OrderService
{
    public function checkout(): JsonResponse  // Don't return HTTP response
    {
        return response()->json($order);
    }
}

// ✅ DO: Return model, let controller format response
class OrderService
{
    public function checkout(): Order
    {
        return $order;
    }
}
```

---

## Testing Services

```php
<?php

namespace Tests\Unit\Services;

use App\Services\OrderService;
use App\Models\Cart;
use App\Models\User;
use Tests\TestCase;

class OrderServiceTest extends TestCase
{
    private OrderService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(OrderService::class);
    }

    public function test_checkout_creates_order(): void
    {
        $user = User::factory()->create();
        $cart = Cart::factory()->hasItems(3)->create(['user_id' => $user->id]);

        $order = $this->service->checkout(
            cart: $cart,
            user: $user,
            paymentMethod: 'card'
        );

        $this->assertNotNull($order->id);
        $this->assertEquals('paid', $order->status);
        $this->assertCount(3, $order->items);
    }

    public function test_checkout_fails_with_empty_cart(): void
    {
        $this->expectException(\DomainException::class);

        $user = User::factory()->create();
        $cart = Cart::factory()->create(['user_id' => $user->id]);

        $this->service->checkout($cart, $user, 'card');
    }
}
```
