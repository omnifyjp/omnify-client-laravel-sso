# Form Request Guide

> **Related:** [README](./README.md) | [Controller Guide](./controller-guide.md)

## Why FormRequest?

| Without FormRequest      | With FormRequest     |
| ------------------------ | -------------------- |
| Validation in controller | Separated validation |
| Fat controllers          | Thin controllers     |
| Duplicate validation     | Reusable rules       |
| Hard to test             | Easy to test         |

---

## Request Templates

### Store Request

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UserStoreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;  // Or: return $this->user()->can('create', User::class);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'min:8'],
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'name' => '名前',
            'email' => 'メールアドレス',
            'password' => 'パスワード',
        ];
    }

    /**
     * Get the error messages for the defined validation rules.
     */
    public function messages(): array
    {
        return [
            'email.unique' => 'このメールアドレスは既に使用されています。',
        ];
    }
}
```

### Update Request

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UserUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => [
                'sometimes',
                'string',
                'email',
                'max:255',
                Rule::unique('users')->ignore($this->user),  // Ignore current user
            ],
            'password' => ['sometimes', 'string', 'min:8'],
        ];
    }
}
```

---

## Common Validation Rules

### String Fields

```php
'name' => ['required', 'string', 'max:255'],
'title' => ['required', 'string', 'min:3', 'max:100'],
'slug' => ['required', 'string', 'alpha_dash', 'max:100'],
'description' => ['nullable', 'string', 'max:1000'],
```

### Email

```php
'email' => ['required', 'email', 'max:255', 'unique:users'],
'email' => ['required', 'email', Rule::unique('users')->ignore($this->user)],
```

### Password

```php
use Illuminate\Validation\Rules\Password;

'password' => ['required', 'confirmed', Password::defaults()],
'password' => ['required', Password::min(8)->mixedCase()->numbers()->symbols()],
```

### Numbers

```php
'age' => ['required', 'integer', 'min:0', 'max:150'],
'price' => ['required', 'numeric', 'min:0', 'max:999999.99'],
'quantity' => ['required', 'integer', 'min:1'],
```

### Dates

```php
'birth_date' => ['required', 'date', 'before:today'],
'scheduled_at' => ['required', 'date', 'after:now'],
'start_date' => ['required', 'date'],
'end_date' => ['required', 'date', 'after:start_date'],
```

### Enums

```php
'status' => ['required', 'in:draft,published,archived'],
'status' => ['required', Rule::enum(PostStatus::class)],
'role' => ['required', Rule::in(['admin', 'user', 'guest'])],
```

### Files

```php
'avatar' => ['nullable', 'image', 'max:2048'],  // 2MB max
'document' => ['required', 'file', 'mimes:pdf,doc,docx', 'max:10240'],
'images' => ['nullable', 'array', 'max:5'],
'images.*' => ['image', 'max:2048'],
```

### Arrays

```php
'tags' => ['nullable', 'array', 'max:10'],
'tags.*' => ['string', 'max:50'],
'items' => ['required', 'array', 'min:1'],
'items.*.product_id' => ['required', 'exists:products,id'],
'items.*.quantity' => ['required', 'integer', 'min:1'],
```

### Relationships

```php
'user_id' => ['required', 'exists:users,id'],
'category_id' => ['required', 'exists:categories,id'],
'tag_ids' => ['nullable', 'array'],
'tag_ids.*' => ['exists:tags,id'],
```

### Conditional Rules

```php
public function rules(): array
{
    return [
        'type' => ['required', 'in:individual,company'],
        'company_name' => ['required_if:type,company', 'string', 'max:255'],
        'tax_id' => ['required_if:type,company', 'string', 'max:20'],
    ];
}

// Or using Rule::when()
'company_name' => [
    Rule::when($this->type === 'company', ['required', 'string', 'max:255']),
],
```

---

## Authorization

### Simple Authorization

```php
public function authorize(): bool
{
    return $this->user() !== null;  // Must be logged in
}
```

### Policy-Based Authorization

```php
public function authorize(): bool
{
    $post = $this->route('post');  // Get route parameter
    return $this->user()->can('update', $post);
}
```

### Role-Based Authorization

```php
public function authorize(): bool
{
    return $this->user()->hasRole('admin');
}
```

---

## Data Preparation

### Modify Input Before Validation

```php
protected function prepareForValidation(): void
{
    $this->merge([
        'slug' => Str::slug($this->title),
        'email' => Str::lower($this->email),
    ]);
}
```

### Modify Validated Data

```php
public function validated($key = null, $default = null): array
{
    $validated = parent::validated($key, $default);
    
    // Hash password if present
    if (isset($validated['password'])) {
        $validated['password'] = bcrypt($validated['password']);
    }
    
    return $validated;
}
```

### Add Data After Validation

```php
// In controller
public function store(PostStoreRequest $request): PostResource
{
    $data = array_merge($request->validated(), [
        'user_id' => $request->user()->id,
        'published_at' => now(),
    ]);
    
    $post = Post::create($data);
    return new PostResource($post);
}
```

---

## Custom Validation Rules

### Inline Rule

```php
use Illuminate\Validation\Validator;

public function withValidator(Validator $validator): void
{
    $validator->after(function (Validator $validator) {
        if ($this->hasInvalidCoupon()) {
            $validator->errors()->add('coupon', 'Invalid or expired coupon.');
        }
    });
}

private function hasInvalidCoupon(): bool
{
    if (!$this->coupon_code) return false;
    
    return !Coupon::where('code', $this->coupon_code)
        ->where('expires_at', '>', now())
        ->exists();
}
```

### Custom Rule Class

```php
// app/Rules/ValidCoupon.php
<?php

namespace App\Rules;

use App\Models\Coupon;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class ValidCoupon implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $coupon = Coupon::where('code', $value)
            ->where('expires_at', '>', now())
            ->first();

        if (!$coupon) {
            $fail('The coupon is invalid or expired.');
        }
    }
}

// Usage in FormRequest
'coupon_code' => ['nullable', 'string', new ValidCoupon],
```

---

## Error Response Format

Laravel automatically returns validation errors in this format:

```json
{
    "message": "The email field must be a valid email address.",
    "errors": {
        "email": [
            "The email field must be a valid email address."
        ],
        "password": [
            "The password field must be at least 8 characters."
        ]
    }
}
```

HTTP Status: `422 Unprocessable Entity`

---

## Testing Requests

### Test Validation Rules

```php
public function test_name_is_required(): void
{
    $response = $this->postJson('/api/users', [
        'email' => 'test@example.com',
        'password' => 'password123',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['name']);
}

public function test_email_must_be_unique(): void
{
    User::factory()->create(['email' => 'existing@example.com']);

    $response = $this->postJson('/api/users', [
        'name' => 'John',
        'email' => 'existing@example.com',
        'password' => 'password123',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['email']);
}

public function test_valid_data_creates_user(): void
{
    $response = $this->postJson('/api/users', [
        'name' => 'John Doe',
        'email' => 'john@example.com',
        'password' => 'password123',
    ]);

    $response->assertStatus(201)
        ->assertJsonStructure(['data' => ['id', 'name', 'email']]);
}
```

---

## Best Practices

### ✅ DO

```php
// Separate Store and Update requests
class UserStoreRequest extends FormRequest { ... }
class UserUpdateRequest extends FormRequest { ... }

// Use 'sometimes' for optional updates
'name' => ['sometimes', 'string', 'max:255'],

// Use Rule class for complex rules
Rule::unique('users')->ignore($this->user)
Rule::enum(PostStatus::class)

// Prepare data before validation
protected function prepareForValidation(): void { ... }
```

### ❌ DON'T

```php
// Don't validate in controller
public function store(Request $request) {
    $request->validate([...]);  // Use FormRequest instead
}

// Don't use same request for store and update
class UserRequest extends FormRequest { ... }  // Split into Store/Update

// Don't hardcode messages (use lang files for i18n)
'name.required' => 'Name is required',  // OK for simple apps
// Use resources/lang/{locale}/validation.php for i18n
```
