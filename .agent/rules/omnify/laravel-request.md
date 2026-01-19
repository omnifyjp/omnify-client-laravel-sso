---
id: laravel-request
description: "Laravel FormRequest rules: OpenAPI schema MUST match schemaRules(), extend OmnifyBase for auto-generated validation, never use $request->all(). Apply when editing Request classes."
priority: medium
globs:
  - "app/Http/Requests/**/*.php"
tags:
  - laravel
  - request
---

# Request Rules

## Golden Rule: Schema MUST Match Validation Rules

OpenAPI Schema properties MUST match the actual `schemaRules()` fields.

## Before Editing Request

1. **Read `OmnifyBase/*RequestBase.php`** to see actual validation rules
2. **Compare with `#[OA\Schema]`** properties
3. **Ensure `required` array matches** required validation rules
4. **Match constraints** (maxLength, minLength, format)

## Checklist

```php
// Check OmnifyBase/*StoreRequestBase.php → schemaRules()
return [
    'name_lastname' => ['required', 'string', 'max:50'],
    'name_firstname' => ['required', 'string', 'max:50'],
    'email' => ['required', 'string', 'max:255', 'unique:users'],
    'password' => ['required', 'string', 'max:255'],
];

// #[OA\Schema] MUST match
#[OA\Schema(
    schema: 'UserStoreRequest',
    required: ['name_lastname', 'name_firstname', 'email', 'password'],  // ← Match 'required' rules
    properties: [
        new OA\Property(property: 'name_lastname', type: 'string', maxLength: 50),  // ← max:50
        new OA\Property(property: 'name_firstname', type: 'string', maxLength: 50),
        new OA\Property(property: 'email', type: 'string', format: 'email', maxLength: 255),
        new OA\Property(property: 'password', type: 'string', format: 'password', maxLength: 255),
    ]
)]
```

## Mapping Validation Rules to OpenAPI

| Laravel Rule | OpenAPI Property            |
| ------------ | --------------------------- |
| `required`   | Add to `required: []` array |
| `max:50`     | `maxLength: 50`             |
| `min:8`      | `minLength: 8`              |
| `email`      | `format: 'email'`           |
| `string`     | `type: 'string'`            |
| `integer`    | `type: 'integer'`           |
| `boolean`    | `type: 'boolean'`           |
| `nullable`   | `nullable: true`            |

## StoreRequest vs UpdateRequest

| Type             | `required`          | Notes                  |
| ---------------- | ------------------- | ---------------------- |
| `*StoreRequest`  | All required fields | Creating new resource  |
| `*UpdateRequest` | Empty or partial    | Partial update allowed |

```php
// StoreRequest - all fields required
#[OA\Schema(
    schema: 'UserStoreRequest',
    required: ['name_lastname', 'name_firstname', 'email', 'password'],
    ...
)]

// UpdateRequest - no required (partial update)
#[OA\Schema(
    schema: 'UserUpdateRequest',
    // No 'required' array - all fields optional
    properties: [...]
)]
```

## Common Mistakes

| Mistake                 | Fix                                  |
| ----------------------- | ------------------------------------ |
| Missing field in schema | Check *RequestBase.php schemaRules() |
| Wrong maxLength         | Match `max:X` rule                   |
| Missing required        | Check if rule has `required`         |
| Extra field in schema   | Remove if not in rules               |

## Custom Rules in Child Class

If you override rules in the child Request class, update schema accordingly:

```php
// UserStoreRequest.php
public function rules(): array
{
    return array_merge($this->schemaRules(), [
        'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],  // Added 'email' format
        'password' => ['required', 'string', 'min:8', 'max:255'],  // Added min:8
    ]);
}

// Update schema to match
new OA\Property(property: 'email', type: 'string', format: 'email'),  // ← Added format
new OA\Property(property: 'password', type: 'string', minLength: 8),  // ← Added minLength
```

## After Editing

```bash
./artisan l5-swagger:generate
```