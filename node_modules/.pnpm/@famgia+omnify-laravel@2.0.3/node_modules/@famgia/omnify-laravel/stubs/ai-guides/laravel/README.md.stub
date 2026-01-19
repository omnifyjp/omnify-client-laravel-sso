# Backend Guides

> Laravel 12, PHP 8.4, MySQL 8

## Quick Navigation

| Guide                                | Description                                   |
| ------------------------------------ | --------------------------------------------- |
| [architecture.md](./architecture.md) | Design philosophy, when to use Service/Action |
| [controller.md](./controller.md)     | Thin controller pattern, CRUD template        |
| [request.md](./request.md)           | Form validation, FormRequest                  |
| [resource.md](./resource.md)         | API response format, dates                    |
| [service.md](./service.md)           | When & how to use services                    |
| [testing.md](./testing.md)           | PEST, 正常系/異常系                           |
| [openapi.md](./openapi.md)           | Swagger documentation                         |
| [datetime.md](./datetime.md)         | Carbon, UTC handling                          |

## Related

| Topic                    | Location                                                    |
| ------------------------ | ----------------------------------------------------------- |
| **Security rules**       | [/rules/security.md](../../rules/security.md)               |
| **Performance rules**    | [/rules/performance.md](../../rules/performance.md)         |
| **Naming conventions**   | [/rules/naming.md](../../rules/naming.md)                   |
| **Checklist**            | [/checklists/backend.md](../../checklists/backend.md)       |
| **New feature workflow** | [/workflows/new-feature.md](../../workflows/new-feature.md) |

## Quick Patterns

### Thin Controller

```php
public function store(UserStoreRequest $request): UserResource
{
    return new UserResource(User::create($request->validated()));
}
```

### Resource with Dates

```php
public function toArray($request): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'created_at' => $this->created_at?->toISOString(),
    ];
}
```

### When to Use What

| Question                   | Answer          |
| -------------------------- | --------------- |
| Simple CRUD?               | Controller only |
| Multi-step business logic? | Service         |
| Single reusable action?    | Action class    |
| Async task?                | Job             |
