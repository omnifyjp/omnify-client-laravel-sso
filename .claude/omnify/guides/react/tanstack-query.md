# TanStack Query Guide

> **Related:** [README](./README.md) | [Service Pattern](./service-pattern.md)

## Query Keys Pattern

### Structure

```typescript
// lib/queryKeys.ts

import type { UserListParams } from "@/services/users";  // Import from service
import type { PostListParams } from "@/services/posts";

export const queryKeys = {
  // Simple key
  user: ["user"] as const,

  // Resource with nested keys - USE TYPED PARAMS
  users: {
    all: ["users"] as const,
    lists: () => [...queryKeys.users.all, "list"] as const,
    list: (params?: UserListParams) => [...queryKeys.users.lists(), params] as const,
    details: () => [...queryKeys.users.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.users.details(), id] as const,
  },

  posts: {
    all: ["posts"] as const,
    lists: () => [...queryKeys.posts.all, "list"] as const,
    list: (params?: PostListParams) => [...queryKeys.posts.lists(), params] as const,
    details: () => [...queryKeys.posts.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.posts.details(), id] as const,
    byUser: (userId: number) => [...queryKeys.posts.all, "user", userId] as const,
  },
} as const;
```

### ⚠️ Type Rule

```typescript
// ✅ DO: Import and use specific types from service
import type { UserListParams } from "@/services/users";
list: (params?: UserListParams) => [...]

// ❌ DON'T: Use generic Record type
list: (params?: Record<string, unknown>) => [...]  // Hard to read, no autocomplete
```

### Rules

```typescript
// ✅ DO: Use query key factory
useQuery({
  queryKey: queryKeys.users.detail(id),
  queryFn: () => userService.get(id),
});

// ❌ DON'T: Hardcode query keys
useQuery({
  queryKey: ["users", "detail", id], // Hard to maintain
  queryFn: () => userService.get(id),
});

// ✅ DO: Include all dependencies in key
useQuery({
  queryKey: queryKeys.users.list({ page, search }), // Refetches when params change
  queryFn: () => userService.list({ page, search }),
});

// ❌ DON'T: Omit dependencies
useQuery({
  queryKey: queryKeys.users.list(), // Won't refetch when params change
  queryFn: () => userService.list({ page, search }),
});
```

---

## Mutation Pattern

### Standard CRUD Mutations

```typescript
"use client";

import { Form, Button } from "antd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { queryKeys } from "@/lib/queryKeys";
import { getFormErrors } from "@/lib/api";
import { userService, UserUpdateInput } from "@/services/users";

export default function CreateUserPage() {
  const t = useTranslations();  // No namespace = access all
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  // CREATE mutation
  const createMutation = useMutation({
    mutationFn: userService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      message.success(t("messages.created"));
      router.push("/users");
    },
    onError: (error) => {
      form.setFields(getFormErrors(error));
    },
  });

  // UPDATE mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UserUpdateInput }) =>
      userService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(id) });
      message.success(t("messages.updated"));
      router.push(`/users/${id}`);
    },
    onError: (error) => {
      form.setFields(getFormErrors(error));
    },
  });

  // DELETE mutation
  const deleteMutation = useMutation({
    mutationFn: userService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      message.success(t("messages.deleted"));
      router.push("/users");
    },
  });

  return (
    <Form form={form} onFinish={(values) => createMutation.mutate(values)}>
      {/* ... form fields ... */}
      <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
        {t("common.save")}
      </Button>
    </Form>
  );
}
```

### Mutation Rules

```typescript
// ✅ DO: Always invalidate related queries after mutation
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
}

// ❌ DON'T: Forget to invalidate
onSuccess: () => {
  message.success("Saved!"); // Data won't refresh!
}

// ✅ DO: Handle form errors from Laravel
onError: (error) => {
  form.setFields(getFormErrors(error));
}

// ❌ DON'T: Ignore errors
onError: (error) => {
  console.log(error); // User sees nothing
}

// ✅ DO: Show loading state
<Button loading={mutation.isPending}>Submit</Button>

// ❌ DON'T: No loading feedback
<Button>Submit</Button> // User can double-click
```

---

## Advanced Tips

### Keep Queries Simple

```typescript
// ✅ SIMPLE: queryFn just calls service
useQuery({
  queryKey: queryKeys.users.list(filters),
  queryFn: () => userService.list(filters),
});

// ❌ OVER-ENGINEERED: Logic in queryFn
useQuery({
  queryKey: queryKeys.users.list(filters),
  queryFn: async () => {
    const data = await userService.list(filters);
    return data.map(transform).filter(validate); // Move this to service!
  },
});
```

### Query Key = All Dependencies

```typescript
// ✅ CORRECT: Key includes all params → auto refetch when changed
useQuery({
  queryKey: queryKeys.users.list({ page, search, status }),
  queryFn: () => userService.list({ page, search, status }),
});

// ❌ WRONG: Missing deps in key → stale data
useQuery({
  queryKey: queryKeys.users.list(),
  queryFn: () => userService.list({ page, search }),  // Params not in key!
});
```

### Conditional Queries with `enabled`

```typescript
// Fetch user first, then fetch user's posts
const { data: user } = useQuery({
  queryKey: queryKeys.user,
  queryFn: authService.me,
});

const { data: posts } = useQuery({
  queryKey: queryKeys.posts.byUser(user?.id!),
  queryFn: () => postService.listByUser(user!.id),
  enabled: !!user,  // ← Only runs when user exists
});
```

### Invalidate Correctly

```typescript
// ✅ Invalidate by prefix (all user queries)
queryClient.invalidateQueries({ queryKey: queryKeys.users.all });

// ✅ Invalidate specific query
queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(id) });

// ❌ DON'T invalidate everything
queryClient.invalidateQueries();  // Too broad!

// ❌ DON'T refetch manually
await userService.create(data);
refetch();  // Wrong! Use invalidateQueries
```

### Optimistic Updates (Use Sparingly)

Only for instant feedback UX (like/unlike, toggle, drag-drop):

```typescript
const likeMutation = useMutation({
  mutationFn: postService.like,
  onMutate: async (postId) => {
    await queryClient.cancelQueries({ queryKey: queryKeys.posts.detail(postId) });
    const previous = queryClient.getQueryData(queryKeys.posts.detail(postId));
    queryClient.setQueryData(queryKeys.posts.detail(postId), (old: Post) => ({
      ...old,
      liked: true,
      likesCount: old.likesCount + 1,
    }));
    return { previous };
  },
  onError: (err, postId, context) => {
    queryClient.setQueryData(queryKeys.posts.detail(postId), context?.previous);
  },
  onSettled: (data, error, postId) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(postId) });
  },
});
```

### Prefetching (For Better UX)

```typescript
<Link 
  href={`/users/${user.id}`}
  onMouseEnter={() => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.users.detail(user.id),
      queryFn: () => userService.get(user.id),
    });
  }}
>
  {user.name}
</Link>
```

---

## Common Mistakes

```typescript
// ❌ Mixing server state with local state
const [users, setUsers] = useState([]);  // DELETE THIS
const { data } = useQuery({...});        // USE THIS ONLY

// ❌ Fetching in useEffect
useEffect(() => {
  fetchUsers().then(setUsers);  // WRONG
}, []);
// ✅ Use useQuery instead

// ❌ Missing error handling in mutation
const mutation = useMutation({
  mutationFn: userService.create,
  onSuccess: () => message.success("Created"),
  // MISSING: onError for form validation!
});

// ✅ Always handle errors
const mutation = useMutation({
  mutationFn: userService.create,
  onSuccess: () => message.success(t("created")),
  onError: (error) => form.setFields(getFormErrors(error)),
});
```

---

## When NOT to Use TanStack Query

```typescript
// ❌ For client-only state (use useState or Zustand)
const [isModalOpen, setIsModalOpen] = useState(false);
const [selectedItems, setSelectedItems] = useState<number[]>([]);

// ❌ For derived/computed values (use useMemo)
const filteredUsers = useMemo(
  () => users.filter(u => u.active),
  [users]
);
```
