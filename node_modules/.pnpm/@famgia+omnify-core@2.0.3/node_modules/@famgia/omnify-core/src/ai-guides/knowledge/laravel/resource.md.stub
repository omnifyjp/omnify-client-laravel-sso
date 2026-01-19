# API Resource Guide

> **Related:** [README](./README.md) | [Controller Guide](./controller-guide.md) | [DateTime Guide](../laravel/datetime-guide.md)

## Why Resources?

| Without Resources       | With Resources           |
| ----------------------- | ------------------------ |
| Expose all model fields | Control exposed fields   |
| Inconsistent formats    | Consistent API format    |
| Manual JSON building    | Automatic transformation |
| Date format varies      | ISO 8601 everywhere      |

---

## Resource Template

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'email_verified_at' => $this->email_verified_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
```

---

## Response Formats

### Single Resource

```php
// Controller
return new UserResource($user);

// Response
{
    "data": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "created_at": "2024-01-15T10:30:00.000000Z"
    }
}
```

### Collection (Paginated)

```php
// Controller
return UserResource::collection($users->paginate(15));

// Response
{
    "data": [
        { "id": 1, "name": "John", ... },
        { "id": 2, "name": "Jane", ... }
    ],
    "links": {
        "first": "http://api.example.com/users?page=1",
        "last": "http://api.example.com/users?page=10",
        "prev": null,
        "next": "http://api.example.com/users?page=2"
    },
    "meta": {
        "current_page": 1,
        "from": 1,
        "last_page": 10,
        "per_page": 15,
        "to": 15,
        "total": 150
    }
}
```

---

## Date Formatting Rules

### Always Use ISO 8601 UTC

```php
// ✅ CORRECT: toISOString() returns UTC with Z suffix
'created_at' => $this->created_at?->toISOString(),
// Output: "2024-01-15T10:30:00.000000Z"

// ❌ WRONG: Local format
'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
// Output: "2024-01-15 10:30:00" (ambiguous timezone)

// ❌ WRONG: Local timezone
'created_at' => $this->created_at?->setTimezone('Asia/Tokyo')->format('Y-m-d H:i:s'),
// Output: "2024-01-15 19:30:00" (local time, confusing)
```

### Nullable Dates

```php
// ✅ Use null-safe operator
'email_verified_at' => $this->email_verified_at?->toISOString(),
// Returns null if not set

// ❌ Don't return empty string
'email_verified_at' => $this->email_verified_at ? $this->email_verified_at->toISOString() : '',
```

---

## Relationships

### Eager Loading Required

```php
// Controller - always eager load
public function show(User $user): UserResource
{
    $user->load('posts', 'profile');
    return new UserResource($user);
}

// Resource
public function toArray(Request $request): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'profile' => new ProfileResource($this->whenLoaded('profile')),
        'posts' => PostResource::collection($this->whenLoaded('posts')),
    ];
}
```

### Conditional Relationships

```php
public function toArray(Request $request): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        
        // Only include if loaded (prevents N+1)
        'profile' => new ProfileResource($this->whenLoaded('profile')),
        
        // Only include if loaded
        'posts' => PostResource::collection($this->whenLoaded('posts')),
        
        // Only include count if loaded
        'posts_count' => $this->whenCounted('posts'),
    ];
}
```

### Nested Resources

```php
// PostResource
public function toArray(Request $request): array
{
    return [
        'id' => $this->id,
        'title' => $this->title,
        'author' => new UserResource($this->whenLoaded('author')),
        'comments' => CommentResource::collection($this->whenLoaded('comments')),
    ];
}

// Controller with nested eager loading
public function show(Post $post): PostResource
{
    $post->load(['author', 'comments.user']);
    return new PostResource($post);
}
```

---

## Conditional Fields

### Based on Auth

```php
public function toArray(Request $request): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'email' => $this->email,
        
        // Only for admin
        'admin_notes' => $this->when(
            $request->user()?->isAdmin(),
            $this->admin_notes
        ),
        
        // Only for owner
        'api_token' => $this->when(
            $request->user()?->id === $this->id,
            $this->api_token
        ),
    ];
}
```

### Based on Model State

```php
public function toArray(Request $request): array
{
    return [
        'id' => $this->id,
        'title' => $this->title,
        'status' => $this->status,
        
        // Only if published
        'published_at' => $this->when(
            $this->status === 'published',
            $this->published_at?->toISOString()
        ),
        
        // Only if has discount
        'discount' => $this->when($this->discount > 0, [
            'amount' => $this->discount,
            'percentage' => $this->discount_percentage,
        ]),
    ];
}
```

---

## Computed Fields

```php
public function toArray(Request $request): array
{
    return [
        'id' => $this->id,
        'first_name' => $this->first_name,
        'last_name' => $this->last_name,
        
        // Computed
        'full_name' => $this->first_name . ' ' . $this->last_name,
        
        // From accessor
        'avatar_url' => $this->avatar_url,  // Model accessor
        
        // Boolean flags
        'is_verified' => $this->email_verified_at !== null,
        'is_active' => $this->status === 'active',
        
        // Formatted values
        'price_formatted' => '$' . number_format($this->price, 2),
    ];
}
```

---

## Hiding Fields

### Using Resource

```php
public function toArray(Request $request): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'email' => $this->email,
        // Don't include: password, remember_token
    ];
}
```

### Using Model $hidden

```php
// Model
class User extends Model
{
    protected $hidden = [
        'password',
        'remember_token',
    ];
}
```

---

## Additional Meta

### For Single Resource

```php
class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'total' => $this->total,
        ];
    }

    public function with(Request $request): array
    {
        return [
            'meta' => [
                'currency' => 'USD',
                'tax_rate' => 0.1,
            ],
        ];
    }
}

// Response
{
    "data": { "id": 1, "total": 100 },
    "meta": { "currency": "USD", "tax_rate": 0.1 }
}
```

### Custom Wrapper

```php
// Disable "data" wrapper
class PlainResource extends JsonResource
{
    public static $wrap = null;
}

// Response (no "data" key)
{ "id": 1, "name": "John" }
```

---

## Resource Collection

### Custom Collection Class

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\ResourceCollection;

class UserCollection extends ResourceCollection
{
    public $collects = UserResource::class;

    public function toArray(Request $request): array
    {
        return [
            'data' => $this->collection,
            'meta' => [
                'total_active' => $this->collection->where('status', 'active')->count(),
            ],
        ];
    }
}

// Usage
return new UserCollection($users->paginate(15));
```

---

## Common Patterns

### User Resource

```php
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'avatar_url' => $this->avatar_url,
            'email_verified_at' => $this->email_verified_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            
            // Relations
            'profile' => new ProfileResource($this->whenLoaded('profile')),
            'roles' => RoleResource::collection($this->whenLoaded('roles')),
        ];
    }
}
```

### Post Resource (with Author)

```php
class PostResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'content' => $this->content,
            'excerpt' => Str::limit($this->content, 150),
            'status' => $this->status,
            'published_at' => $this->published_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            
            // Author (always loaded)
            'author' => new UserResource($this->whenLoaded('author')),
            
            // Comments (conditional)
            'comments' => CommentResource::collection($this->whenLoaded('comments')),
            'comments_count' => $this->whenCounted('comments'),
            
            // Computed
            'is_published' => $this->status === 'published',
            'reading_time' => ceil(str_word_count($this->content) / 200) . ' min',
        ];
    }
}
```

### Order Resource (with Items)

```php
class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'status' => $this->status,
            'subtotal' => $this->subtotal,
            'tax' => $this->tax,
            'total' => $this->total,
            'currency' => 'JPY',
            'paid_at' => $this->paid_at?->toISOString(),
            'shipped_at' => $this->shipped_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            
            // Relations
            'customer' => new UserResource($this->whenLoaded('customer')),
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            
            // Computed
            'items_count' => $this->whenCounted('items'),
            'can_cancel' => $this->status === 'pending',
            'can_refund' => in_array($this->status, ['paid', 'shipped']),
        ];
    }
}
```

---

## Best Practices

### ✅ DO

```php
// Always use toISOString() for dates
'created_at' => $this->created_at?->toISOString(),

// Use whenLoaded() for relationships
'posts' => PostResource::collection($this->whenLoaded('posts')),

// Use when() for conditional fields
'admin_notes' => $this->when($request->user()?->isAdmin(), $this->admin_notes),

// Use null-safe operator
'profile' => new ProfileResource($this->whenLoaded('profile')),
```

### ❌ DON'T

```php
// Don't expose sensitive fields
'password' => $this->password,
'remember_token' => $this->remember_token,

// Don't use model directly (causes N+1)
'posts' => PostResource::collection($this->posts),  // Load in controller!

// Don't format dates inconsistently
'created_at' => $this->created_at->format('Y-m-d'),
'updated_at' => $this->updated_at->toDateTimeString(),
```
