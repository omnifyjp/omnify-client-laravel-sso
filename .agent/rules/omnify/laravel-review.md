---
id: laravel-review
description: "Code review checklist for Laravel: security ($request->validated, SQL injection), performance (eager loading, N+1), and quality standards. Mention @laravel-review in chat to invoke."
priority: low
tags:
  - laravel
  - review
---

# Code Review Rules

> Review process for Laravel code

## Review Process

1. Security Check → 2. Performance Check → 3. Quality Check → 4. Test Check

## Security Checklist

| Check           | Look For                     |
| --------------- | ---------------------------- |
| Mass Assignment | `$request->validated()`      |
| SQL Injection   | No raw SQL                   |
| `$fillable`     | Defined, no sensitive fields |
| `$hidden`       | Password hidden              |

## Performance Checklist

| Check      | Look For               |
| ---------- | ---------------------- |
| N+1        | `with()` for relations |
| Pagination | `paginate()` for lists |
| Resources  | `whenLoaded()`         |

## Quality Checklist

| Check      | Look For        |
| ---------- | --------------- |
| Validation | FormRequest     |
| Response   | Resource        |
| Dates      | `toISOString()` |

## Code Style Checklist

| Check       | Look For                               |
| ----------- | -------------------------------------- |
| **Imports** | No FQCN inline (`\Full\Path\Class`)    |
| Use         | All classes imported with `use` at top |
| Naming      | Follows conventions                    |

## Test Checklist

| Endpoint | 正常系 | 異常系   |
| -------- | ------ | -------- |
| store    | 201    | 422      |
| show     | 200    | 404      |
| update   | 200    | 404, 422 |
| destroy  | 204    | 404      |

## Output Format

```markdown
## Security
✅ Using `$request->validated()`
❌ Missing `$hidden` for password

## Performance
✅ Eager loading
❌ Missing pagination

## Recommendation: Request Changes
```