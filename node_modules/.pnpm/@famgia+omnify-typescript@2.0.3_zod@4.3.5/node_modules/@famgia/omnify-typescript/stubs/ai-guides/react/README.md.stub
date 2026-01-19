# Frontend Architecture Guide

> **Related docs:**
> - [Design Philosophy](./design-philosophy.md) ⭐ **Start here** - Architecture, principles
> - [Types Guide](./types-guide.md) - Where to define types
> - [Service Pattern](./service-pattern.md) - API services
> - [TanStack Query](./tanstack-query.md) - Data fetching
> - [Ant Design](./antd-guide.md) - UI components
> - [i18n](./i18n-guide.md) - Multi-language
> - [DateTime](./datetime-guide.md) - Day.js, UTC handling
> - [Laravel Integration](./laravel-integration.md) - Backend integration
> - [Checklists](./checklist.md) - Before commit, new resource

## Overview

See [Design Philosophy](./design-philosophy.md) for architecture diagram and principles.

**Stack**: Next.js 16 + TypeScript + Ant Design 6 + TanStack Query + Axios

---

## Directory Structure

```
frontend/src/
├── app/                        # Next.js App Router (Pages)
│   ├── layout.tsx              # Root: Providers wrapper
│   ├── page.tsx                # Public: Home page
│   │
│   ├── (auth)/                 # Group: Auth pages (no layout)
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   │
│   └── (dashboard)/            # Group: Protected pages
│       ├── layout.tsx          # Shared: Sidebar + Header
│       ├── page.tsx            # /dashboard
│       └── users/              # Resource: Users
│           ├── page.tsx        # GET    /users      (List)
│           ├── new/page.tsx    # POST   /users      (Create)
│           └── [id]/
│               ├── page.tsx    # GET    /users/:id  (Show)
│               └── edit/page.tsx # PUT  /users/:id  (Edit)
│
├── features/                   # Feature-specific components & hooks
│   ├── users/                  # User feature
│   │   ├── UserTable.tsx       # Only used in users feature
│   │   ├── UserForm.tsx
│   │   └── useUserFilters.ts   # Feature-specific hook
│   └── posts/
│       ├── PostCard.tsx
│       └── PostEditor.tsx
│
├── components/                 # SHARED components (2+ features)
│   ├── layouts/                # Layout wrappers
│   │   ├── DashboardLayout.tsx
│   │   └── AuthLayout.tsx
│   └── common/                 # Reusable UI
│       ├── DataTable.tsx       # Generic table
│       └── PageHeader.tsx
│
├── services/                   # API Service Layer (ALWAYS here)
│   ├── auth.ts                 # POST /login, /logout, /register
│   └── users.ts                # CRUD /api/users
│
├── hooks/                      # SHARED hooks (2+ features)
│   ├── useAuth.ts              # App-wide auth
│   └── useDebounce.ts          # Utility hook
│
├── lib/                        # Core Infrastructure
│   ├── api.ts                  # Axios instance + interceptors
│   ├── query.tsx               # QueryClient provider
│   ├── queryKeys.ts            # Query key factory
│   └── dayjs.ts                # Day.js config + utilities
│
├── i18n/                       # Internationalization
│   ├── config.ts               # Locales config
│   ├── request.ts              # Server-side locale detection
│   └── messages/               # Translation files
│       ├── ja.json
│       ├── en.json
│       └── vi.json
│
└── types/                      # TypeScript Types
    └── model/                  # Omnify auto-generated types
```

---

## When to Use Which Folder

### Decision Rules

| Question                             | Answer      | Location              |
| ------------------------------------ | ----------- | --------------------- |
| Component used in how many features? | 1 feature   | `features/{feature}/` |
| Component used in how many features? | 2+ features | `components/common/`  |
| Is it a layout wrapper?              | Yes         | `components/layouts/` |
| Is it a service (API calls)?         | Yes         | `services/` (ALWAYS)  |
| Hook used in how many features?      | 1 feature   | `features/{feature}/` |
| Hook used in how many features?      | 2+ features | `hooks/`              |

### Flowchart

```
┌─────────────────────────────────────────────────────────┐
│                   NEW COMPONENT                         │
└─────────────────────┬───────────────────────────────────┘
                      │
          Used in how many features?
                      │
        ┌─────────────┴─────────────┐
        │                           │
    1 feature                   2+ features
        │                           │
        ▼                           ▼
features/{feature}/         components/common/
   UserTable.tsx               DataTable.tsx
```

```
┌─────────────────────────────────────────────────────────┐
│                     NEW HOOK                            │
└─────────────────────┬───────────────────────────────────┘
                      │
          Used in how many features?
                      │
        ┌─────────────┴─────────────┐
        │                           │
    1 feature                   2+ features
        │                           │
        ▼                           ▼
features/{feature}/              hooks/
  useUserFilters.ts           useDebounce.ts
```

```
┌─────────────────────────────────────────────────────────┐
│                    NEW SERVICE                          │
└─────────────────────┬───────────────────────────────────┘
                      │
                  ALWAYS
                      │
                      ▼
                 services/
                 users.ts
```

### Examples

```typescript
// ❌ WRONG: Service in features folder
features/users/services/users.ts

// ✅ CORRECT: Service always centralized
services/users.ts
```

```typescript
// ❌ WRONG: Feature-specific component in components/
components/users/UserTable.tsx  // Only used in users feature

// ✅ CORRECT: Feature-specific in features/
features/users/UserTable.tsx
```

```typescript
// ❌ WRONG: Shared component in features/
features/users/DataTable.tsx  // Used in users AND posts

// ✅ CORRECT: Shared in components/
components/common/DataTable.tsx
```

---

## Naming Conventions

### Files

| Type      | Pattern                  | Example                         |
| --------- | ------------------------ | ------------------------------- |
| Component | PascalCase               | `UserForm.tsx`, `DataTable.tsx` |
| Hook      | camelCase + `use` prefix | `useAuth.ts`, `useUsers.ts`     |
| Service   | camelCase                | `users.ts`, `auth.ts`           |
| Utility   | camelCase                | `utils.ts`, `formatters.ts`     |
| Type      | camelCase or PascalCase  | `types.ts`, `User.ts`           |
| Page      | lowercase                | `page.tsx`, `layout.tsx`        |

### Code

| Type           | Pattern               | Example                     |
| -------------- | --------------------- | --------------------------- |
| Component      | PascalCase            | `function UserForm()`       |
| Hook           | camelCase + `use`     | `function useAuth()`        |
| Service object | camelCase + `Service` | `const userService = {}`    |
| Interface      | PascalCase            | `interface User`            |
| Type           | PascalCase            | `type UserFormData`         |
| Constant       | UPPER_SNAKE_CASE      | `const API_TIMEOUT = 30000` |
| Function       | camelCase             | `function formatDate()`     |
| Variable       | camelCase             | `const userData = ...`      |

---

## Types

See [Types Guide](./types-guide.md) for complete type definition rules.

**Quick reference:**

| Type               | Location                                |
| ------------------ | --------------------------------------- |
| Model (User, Post) | `@/types/model` (Omnify auto-generated) |
| Input types        | Service file (colocated)                |
| Props              | Component file                          |
| API Response       | `lib/api.ts`                            |

**Omnify files:**
- `base/`, `rules/`, `enum/` → ❌ DO NOT EDIT
- `User.ts` (root level) → ✅ CAN EDIT (extension)

See also: [Omnify TypeScript Guide](../omnify/typescript-guide.md)
