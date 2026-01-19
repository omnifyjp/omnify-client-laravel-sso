---
id: validation-rules
description: "Omnify validation rules - Type-specific rules for Zod/Laravel validation"
priority: medium
globs:
  - "schemas/**/*.yaml"
  - "schemas/**/*.yml"
tags:
  - laravel
  - validation
---

# Omnify Validation Rules

Validation rules in Omnify schema generate Zod schemas (TypeScript) and Laravel validation rules.

## ⚠️ Important: Type Compatibility

**Each rule is ONLY valid for specific property types!**
Using a rule on wrong type will cause **schema validation error**.

## Quick Reference

| Rule | Valid Types | Zod Output | Laravel Output |
|------|-------------|------------|----------------|
| `required` | **All** | (no `.optional()`) | `required` |
| `minLength` | String types | `.min(n)` | `min:n` |
| `maxLength` | String types | `.max(n)` | `max:n` |
| `url` | String types | `z.url()` | `url` |
| `uuid` | String types | `z.uuid()` | `uuid` |
| `ip` | String types | `z.ip()` | `ip` |
| `ipv4` | String types | `z.ipv4()` | `ipv4` |
| `ipv6` | String types | `z.ipv6()` | `ipv6` |
| `alpha` | String types | `.regex()` | `alpha` |
| `alphaNum` | String types | `.regex()` | `alpha_num` |
| `alphaDash` | String types | `.regex()` | `alpha_dash` |
| `numeric` | String types | `.regex()` | `numeric` |
| `digits` | String types | `.length().regex()` | `digits:n` |
| `digitsBetween` | String types | `.min().max().regex()` | `digits_between:min,max` |
| `startsWith` | String types | `.startsWith()` | `starts_with:x` |
| `endsWith` | String types | `.endsWith()` | `ends_with:x` |
| `lowercase` | String types | `.refine()` | `lowercase` |
| `uppercase` | String types | `.refine()` | `uppercase` |
| `min` | Numeric types | `.gte(n)` | `min:n` |
| `max` | Numeric types | `.lte(n)` | `max:n` |
| `between` | Numeric types | `.gte().lte()` | `between:min,max` |
| `gt` | Numeric types | `.gt(n)` | `gt:n` |
| `lt` | Numeric types | `.lt(n)` | `lt:n` |
| `multipleOf` | Numeric types | `.multipleOf(n)` | `multiple_of:n` |

## Type Groups

### String Types
`String`, `Text`, `MediumText`, `LongText`, `Password`, `Email`

### Numeric Types
`TinyInt`, `Int`, `BigInt`, `Float`, `Decimal`

## Examples

### ✅ Correct Usage

```yaml
properties:
  # String with URL validation
  website:
    type: String
    nullable: true
    rules:
      url: true       # ✅ String type → url works

  # String with pattern validation
  username:
    type: String
    rules:
      minLength: 3
      maxLength: 20
      alphaDash: true # ✅ Only letters, numbers, dash, underscore
      lowercase: true # ✅ Must be lowercase

  # Numeric with range validation
  quantity:
    type: Int
    rules:
      min: 0          # ✅ Int type → min works
      max: 1000
      multipleOf: 5   # ✅ Must be multiple of 5

  # Decimal with precision
  price:
    type: Decimal
    precision: 10
    scale: 2
    rules:
      min: 0.01       # ✅ Decimal is numeric
      max: 999999.99
```

### ❌ Wrong Usage (Causes Validation Error)

```yaml
properties:
  # WRONG: url on Int
  port:
    type: Int
    rules:
      url: true       # ❌ ERROR: Int cannot use url rule

  # WRONG: min on String
  name:
    type: String
    rules:
      min: 5          # ❌ ERROR: String cannot use min rule (use minLength)

  # WRONG: startsWith on Float
  rate:
    type: Float
    rules:
      startsWith: "0." # ❌ ERROR: Float cannot use startsWith
```

## Common Patterns

### Password Field
```yaml
password:
  type: Password
  rules:
    required: true
    minLength: 8
    maxLength: 255
```

### Slug Field
```yaml
slug:
  type: String
  length: 100
  unique: true
  rules:
    alphaDash: true
    lowercase: true
    minLength: 3
    maxLength: 100
```

### Phone Number (String of digits)
```yaml
phone:
  type: String
  length: 15
  rules:
    numeric: true     # Only digits
    digitsBetween: [10, 15]
```

### Positive Integer
```yaml
quantity:
  type: Int
  rules:
    min: 0
```

### Percentage (0-100)
```yaml
discount:
  type: Int
  rules:
    between: [0, 100]
```

### Price with Step
```yaml
price:
  type: Decimal
  precision: 10
  scale: 2
  rules:
    min: 0
    multipleOf: 0.01
```

## See Also

- `omnify-schema.mdc` - Full schema reference
- `schema-create.mdc` - Creating new schemas