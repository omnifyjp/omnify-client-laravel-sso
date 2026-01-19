# Checklists

> **Related:** [README](./README.md)

## After Writing Code

> **IMPORTANT**: Always run these commands after writing/modifying code:

```bash
# 1. Type check
npm run typecheck

# 2. Lint check
npm run lint

# Or combined
npm run typecheck && npm run lint
```

---

## Adding New Resource

When adding a new resource (e.g., `posts`), follow these steps:

### 1. Service Layer (Always in `services/`)

```bash
# Create: services/posts.ts
```

- [ ] Import types: `import type { Post, PostCreate, PostUpdate } from "@omnify/schemas"`
- [ ] Define only `PostListParams` (Create/Update come from Omnify)
- [ ] Create `postService` object with CRUD methods
- [ ] Add JSDoc comments for each method

### 2. Query Keys

```bash
# Update: lib/queryKeys.ts
```

- [ ] Add `posts` object to `queryKeys`

```typescript
posts: {
  all: ["posts"] as const,
  lists: () => [...queryKeys.posts.all, "list"] as const,
  list: (params?: PostListParams) => [...queryKeys.posts.lists(), params] as const,
  details: () => [...queryKeys.posts.all, "detail"] as const,
  detail: (id: number) => [...queryKeys.posts.details(), id] as const,
},
```

### 3. Feature Components (in `features/posts/`)

```bash
# Create: features/posts/
```

- [ ] `PostTable.tsx` - Table component
- [ ] `PostForm.tsx` - Form component
- [ ] `usePostFilters.ts` - Feature-specific hooks (if needed)

### 4. Pages

```bash
# Create pages in app/(dashboard)/posts/
```

- [ ] `page.tsx` - List page (imports from `features/posts/`)
- [ ] `new/page.tsx` - Create form
- [ ] `[id]/page.tsx` - Detail view
- [ ] `[id]/edit/page.tsx` - Edit form

### 5. Shared Components (only if reused)

- [ ] If component used in 2+ features → move to `components/common/`

### 6. Translations

- [ ] Add labels to `src/i18n/messages/*.json` if needed

### 7. Final Check

- [ ] Run `npm run typecheck && npm run lint`
- [ ] Test create, read, update, delete operations

---

## Adding New Language

- [ ] Create message file: `src/i18n/messages/{locale}.json`
- [ ] Add locale to `src/i18n/config.ts`
- [ ] Import Ant Design locale in `src/components/AntdThemeProvider.tsx`
- [ ] Test with `LocaleSwitcher` component

---

## Before Commit

- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] No console warnings about deprecated props
- [ ] No hardcoded strings (use i18n)
- [ ] Forms handle loading state (`isPending`)
- [ ] Forms handle validation errors (`getFormErrors`)
- [ ] Mutations invalidate related queries
