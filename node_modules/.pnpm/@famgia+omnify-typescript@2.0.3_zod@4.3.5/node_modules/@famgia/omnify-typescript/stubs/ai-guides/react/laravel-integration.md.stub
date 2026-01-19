# Laravel Integration

> **Related:** [README](./README.md) | [Service Pattern](./service-pattern.md)

## Sanctum Authentication Flow

```typescript
// Step 1: Get CSRF cookie (required before POST requests)
await api.get("/sanctum/csrf-cookie");

// Step 2: Login
await api.post("/login", { email, password });
// Cookie is now set automatically

// Step 3: Access protected routes
await api.get("/api/user"); // Works! Cookie sent automatically
```

---

## Error Handling Map

| HTTP Status | Laravel Meaning     | Frontend Action           |
| ----------- | ------------------- | ------------------------- |
| 200         | Success             | Process response          |
| 201         | Created             | Process response          |
| 204         | No Content          | Success (no body)         |
| 401         | Unauthenticated     | Redirect to `/login`      |
| 403         | Forbidden           | Show error message        |
| 404         | Not Found           | Show error message        |
| 419         | CSRF Token Mismatch | Refresh page              |
| 422         | Validation Error    | Display in form fields    |
| 429         | Too Many Requests   | Show rate limit message   |
| 500+        | Server Error        | Show server error message |

---

## API Response Types

### Laravel Pagination Response

```typescript
interface PaginatedResponse<T> {
  data: T[];
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number | null;
    last_page: number;
    per_page: number;
    to: number | null;
    total: number;
  };
}
```

### Laravel API Resource Response (single item)

```typescript
interface ResourceResponse<T> {
  data: T;
}
```

### Laravel Validation Error Response (422)

```typescript
interface ValidationErrorResponse {
  message: string;
  errors: Record<string, string[]>;
}
```

---

## Handling Laravel Responses

### In Service Layer

```typescript
const userService = {
  // Paginated list
  list: async (params?: UserListParams): Promise<PaginatedResponse<User>> => {
    const { data } = await api.get("/api/users", { params });
    return data;  // Already typed as PaginatedResponse
  },

  // Single resource (handle { data: ... } wrapper)
  get: async (id: number): Promise<User> => {
    const { data } = await api.get(`/api/users/${id}`);
    return data.data ?? data;  // Handle both wrapped and unwrapped
  },
};
```

### In Components (Form Validation)

```typescript
import { getFormErrors } from "@/lib/api";

const mutation = useMutation({
  mutationFn: userService.create,
  onError: (error) => {
    // Transform Laravel 422 errors to Ant Design format
    form.setFields(getFormErrors(error));
  },
});
```

---

## Axios Instance Configuration

The `lib/api.ts` is pre-configured for Laravel Sanctum:

```typescript
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,      // Required for Sanctum cookies
  withXSRFToken: true,        // Auto send XSRF-TOKEN cookie as header
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
});
```

---

## Common Patterns

### Login Flow

```typescript
import { csrf } from "@/lib/api";

const login = async (email: string, password: string) => {
  // 1. Get CSRF cookie first
  await csrf();
  
  // 2. Login
  await api.post("/login", { email, password });
  
  // 3. Get user data
  const { data } = await api.get("/api/user");
  return data;
};
```

### Protected API Call

```typescript
// No special handling needed - cookies are sent automatically
const users = await userService.list();
```

### Handling 401 (Unauthenticated)

The interceptor in `lib/api.ts` automatically redirects to `/login` on 401:

```typescript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
```
