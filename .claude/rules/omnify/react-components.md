# React + Ant Design Rules

## Core Patterns

### Service Layer (API calls)

```typescript
// services/user.ts
export const userService = {
  list: (params?: UserListParams) => 
    api.get("/api/users", { params }).then(r => r.data),
  create: (input: UserCreate) => 
    api.post("/api/users", input).then(r => r.data.data),
};
```

### TanStack Query

```typescript
const { data, isLoading } = useQuery({
  queryKey: queryKeys.users.list(filters),
  queryFn: () => userService.list(filters),
});

const mutation = useMutation({
  mutationFn: userService.create,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    message.success(t("messages.created"));
  },
  onError: (error) => form.setFields(getFormErrors(error)),
});
```

## ⚠️ Enum Usage (CRITICAL)

```typescript
// ✅ CORRECT - Import generated Enum
import { PostStatus, PostStatusValues } from "@omnify/enum/PostStatus";

// ✅ Use Enum values
if (status === PostStatus.Pending) { ... }

// ❌ WRONG - Inline union types
newFilter.status = status as "pending" | "approved";
```

## Ant Design Static Method Warning

```typescript
// ❌ Wrong - No context
import { message } from "antd";
message.success("Done");

// ✅ Correct - Use App.useApp()
const { message } = App.useApp();
message.success("Done");
```

## Full Documentation

See @.claude/omnify/guides/react/ for complete patterns.