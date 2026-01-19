# Design Philosophy

> This document explains the architectural decisions and design principles for this frontend project.

## Architecture: Clean Architecture + Service Layer

```mermaid
flowchart TD
    subgraph UI["UI Layer"]
        Page["Page (Container)"]
        Component["Component (Presentational)"]
    end

    subgraph Hooks["Hooks Layer"]
        Query["TanStack Query"]
    end

    subgraph Services["Service Layer"]
        Service["userService, postService"]
    end

    subgraph Infra["Infrastructure Layer"]
        Axios["Axios (lib/api.ts)"]
    end

    Page --> Query
    Component --> Page
    Query --> Service
    Service --> Axios
    Axios -->|HTTP| API[Laravel API]
```

| Layer          | Responsibility                    | Rules                    |
| -------------- | --------------------------------- | ------------------------ |
| UI             | Display data, handle interactions | No direct API calls      |
| Hooks          | Server state, caching, sync       | Uses services            |
| Service        | API communication                 | No React, pure functions |
| Infrastructure | HTTP client, interceptors         | Framework-agnostic       |

---

## Why This Architecture?

### 1. Separation of Concerns

Each layer has a single responsibility:

| Layer          | Knows About             | Doesn't Know About     |
| -------------- | ----------------------- | ---------------------- |
| UI             | Components, hooks       | HTTP, API endpoints    |
| Hooks          | Services, query keys    | Axios, response format |
| Services       | API instance, endpoints | React, components      |
| Infrastructure | HTTP protocol           | Business logic         |

**Benefit**: Change one layer without affecting others.

### 2. Testability

```typescript
// Services are pure functions - easy to test
test("userService.get returns user", async () => {
  const user = await userService.get(1);
  expect(user.id).toBe(1);
});

// Components receive data via props - easy to mock
test("UserTable renders users", () => {
  render(<UserTable users={mockUsers} loading={false} />);
  expect(screen.getByText("John")).toBeInTheDocument();
});
```

### 3. Reusability

```typescript
// Services can be used anywhere
const user = await userService.get(1);  // In a script
const { data } = useQuery({ queryFn: () => userService.get(1) });  // In React
```

### 4. Type Safety

Types flow through layers:

```typescript
// Omnify generates Model types (synced with DB)
type User = { id: number; name: string; email: string; }

// Services use Model types + define Input types
const userService = {
  get: (id: number): Promise<User> => ...,
  create: (input: UserCreateInput): Promise<User> => ...,
}

// Hooks inherit types from services
const { data } = useQuery<User>({ ... });

// Components receive typed props
function UserCard({ user }: { user: User }) { ... }
```

---

## Why TanStack Query?

### Problem: Server State is Different

```typescript
// ❌ Client state (useState) - you control it
const [count, setCount] = useState(0);
setCount(1);  // Immediately updates

// ❌ Server state - you DON'T control it
const [users, setUsers] = useState([]);
// What if another user adds a new user?
// What if the network fails?
// What if the data is stale?
```

### Solution: TanStack Query

| Feature            | Without TanStack     | With TanStack                    |
| ------------------ | -------------------- | -------------------------------- |
| Loading state      | Manual `useState`    | Automatic `isLoading`            |
| Error handling     | Try/catch everywhere | Automatic `error`                |
| Caching            | None or manual       | Automatic, configurable          |
| Refetching         | Manual               | Automatic on focus/reconnect     |
| Deduplication      | None                 | Automatic (same key = 1 request) |
| Optimistic updates | Complex              | Built-in                         |

### TanStack Query vs SWR

| Feature            | TanStack Query              | SWR             |
| ------------------ | --------------------------- | --------------- |
| Mutations          | ✅ First-class `useMutation` | ⚠️ Manual        |
| Devtools           | ✅ Excellent                 | ⚠️ Basic         |
| Query invalidation | ✅ Granular control          | ⚠️ Limited       |
| Optimistic updates | ✅ Built-in rollback         | ⚠️ Manual        |
| Bundle size        | ~13KB                       | ~4KB            |
| Best for           | Complex apps                | Simple fetching |

**We chose TanStack Query** because:
- Better mutation support (CRUD apps need this)
- Granular cache invalidation (important for data consistency)
- Better devtools for debugging

---

## Why Service Layer?

### Problem: API Calls Scattered

```typescript
// ❌ API calls in components
function UserList() {
  const { data } = useQuery({
    queryFn: () => axios.get("/api/users").then(r => r.data),
  });
}

function UserDetail({ id }) {
  const { data } = useQuery({
    queryFn: () => axios.get(`/api/users/${id}`).then(r => r.data.data),
  });
}
// Problems:
// - Duplicated logic (response unwrapping)
// - Hard to change API (update every component)
// - Hard to test (need to mock axios in every test)
```

### Solution: Service Layer

```typescript
// ✅ Centralized in service
const userService = {
  list: () => api.get("/api/users").then(r => r.data),
  get: (id) => api.get(`/api/users/${id}`).then(r => r.data.data ?? r.data),
};

// Components just use services
function UserList() {
  const { data } = useQuery({ queryFn: userService.list });
}

function UserDetail({ id }) {
  const { data } = useQuery({ queryFn: () => userService.get(id) });
}
// Benefits:
// - Single source of truth for API logic
// - Easy to change (update one file)
// - Easy to test (mock service, not axios)
```

---

## Design Principles

### 1. Single Source of Truth

| Data Type                  | Source                         |
| -------------------------- | ------------------------------ |
| Server data (users, posts) | TanStack Query                 |
| Model types                | Omnify (`@omnify/schemas`)       |
| Form state                 | Ant Design Form                |
| UI state (modal open)      | Local `useState`               |
| Global client state        | Context or Zustand (if needed) |

### 2. Colocation

Keep related code together:

```
// ✅ Good: Related files together
services/
  users.ts         # Service + Input types
  posts.ts

// ❌ Bad: Types scattered
types/
  UserCreateInput.ts
  UserUpdateInput.ts
  PostCreateInput.ts
services/
  users.ts
  posts.ts
```

### 3. Explicit Over Implicit

```typescript
// ✅ Explicit: Clear what this does
const { data: users, isLoading, error } = useQuery({
  queryKey: queryKeys.users.list(filters),
  queryFn: () => userService.list(filters),
});

// ❌ Implicit: Magic happening somewhere
const users = useUsers(filters);  // What's inside? Caching? Error handling?
```

### 4. Fail Fast

```typescript
// ✅ Types catch errors at compile time
const user: User = { id: "1" };  // Error: id should be number

// ✅ ESLint catches bad patterns
useEffect(() => { fetchData() }, []);  // Warning: use useQuery

// ✅ Runtime errors shown to user
onError: (error) => form.setFields(getFormErrors(error));
```

### 5. Composition Over Inheritance

```typescript
// ✅ Compose small pieces
function UserPage() {
  return (
    <PageLayout>
      <UserFilters />
      <UserTable />
      <UserPagination />
    </PageLayout>
  );
}

// ❌ Don't create giant "smart" components
function UserPage() {
  // 500 lines of mixed concerns
}
```

---

## Data Flow

```mermaid
sequenceDiagram
    participant User
    participant Component as Component (UI)
    participant Mutation as Mutation (TanStack)
    participant Service as Service
    participant Axios as Axios (Infra)
    participant API as Laravel API

    User->>Component: clicks "Save"
    Component->>Mutation: mutation.mutate(values)
    Mutation->>Service: userService.create(values)
    Service->>Axios: api.post("/api/users", values)
    Axios->>API: HTTP POST
    API-->>Axios: Response
    Axios-->>Service: data
    Service-->>Mutation: User
    Mutation->>Mutation: invalidateQueries
    Mutation-->>Component: onSuccess
    Component-->>User: UI updates
```

---

## Coding Style: Centralized Configuration

### Rule: One File Per Concern in `lib/`

```
lib/
├── api.ts          # Axios config + interceptors + error handling
├── query.tsx       # QueryClient config + provider
├── queryKeys.ts    # All query keys
└── dayjs.ts        # Day.js config + plugins + utilities
```

**Why single file?**
- **Consistency**: One place to find all related code
- **Maintainability**: Easy to update
- **Discoverability**: Clear what's available
- **No over-engineering**: Avoid splitting into multiple files unnecessarily

### Anti-Pattern ❌

```
// Don't split into multiple files unnecessarily
lib/
├── dayjs/
│   ├── config.ts
│   ├── plugins.ts
│   ├── locale.ts
│   └── utils.ts
```

### Correct Pattern ✅

```
// Keep related code in one file
lib/
└── dayjs.ts        # Config + plugins + locale + utils (all in one)
```

### When to Split Files

Only split when:
1. File exceeds ~300-400 lines
2. Clear separate concerns (e.g., `api.ts` vs `queryKeys.ts`)
3. Different import patterns needed

---

## Summary

| Aspect       | Choice              | Reason                              |
| ------------ | ------------------- | ----------------------------------- |
| Architecture | Clean Architecture  | Separation of concerns, testability |
| Server State | TanStack Query      | Caching, mutations, devtools        |
| HTTP Client  | Axios               | Interceptors, Laravel integration   |
| UI Library   | Ant Design          | Comprehensive, consistent           |
| Types        | TypeScript + Omnify | Type safety, DB sync                |
| Styling      | Tailwind CSS        | Utility-first, fast                 |
| i18n         | next-intl           | Server components support           |
| Date/Time    | Day.js              | Ant Design compatible, lightweight  |

**Philosophy**: Keep it simple, explicit, and type-safe. Each layer does one thing well.
