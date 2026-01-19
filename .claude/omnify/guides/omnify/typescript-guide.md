# Omnify TypeScript Generator Guide

This guide covers TypeScript-specific features and generated code patterns for Omnify.

## Setup

Install the runtime package for React components, hooks, and utilities:

```bash
npm install @famgia/omnify-react
```

```typescript
// omnify.config.ts
import typescriptPlugin from '@famgia/omnify-typescript/plugin';

export default defineConfig({
  plugins: [
    typescriptPlugin({
      modelsPath: 'node_modules/.omnify/schemas',
    }),
  ],
});
```

**Benefits:**
- Clean project structure (generated code in node_modules)
- Runtime code versioned separately (update via npm)
- No accidental edits to runtime utilities
- Prisma-like developer experience

## Quick Start

```bash
# Create new project (recommended)
npx @famgia/omnify create-laravel-project my-app
cd my-app

# Or initialize in existing project
npx @famgia/omnify init

# Generate TypeScript types
npx @famgia/omnify generate
```

## Generated Files

When you run `npx @famgia/omnify generate`, the following TypeScript files are generated:

- `base/*.ts` - Base model interfaces
- `enum/*.ts` - Enum types with multi-locale labels
- `rules/*.ts` - Ant Design compatible validation rules

## Type Generation

### Object Schema → Interface

```yaml
# yaml-language-server: $schema=./node_modules/.omnify/combined-schema.json
name: User
properties:
  id:
    type: BigInt
    required: true
  name:
    type: String
    required: true
    maxLength: 255
  email:
    type: String
    required: true
    unique: true
  profile:
    type: Json
  createdAt:
    type: DateTime
```

Generated:
```typescript
export interface User {
  id: number;
  name: string;
  email: string;
  profile: Record<string, unknown> | null;
  createdAt: Date | null;
}
```

## Type Mapping

| Schema Type   | TypeScript Type            |
| ------------- | -------------------------- |
| `String`      | `string`                   |
| `Text`        | `string`                   |
| `MediumText`  | `string`                   |
| `LongText`    | `string`                   |
| `TinyInt`     | `number`                   |
| `Int`         | `number`                   |
| `BigInt`      | `number`                   |
| `Float`       | `number`                   |
| `Decimal`     | `number`                   |
| `Boolean`     | `boolean`                  |
| `Date`        | `Date`                     |
| `DateTime`    | `Date`                     |
| `Timestamp`   | `Date`                     |
| `Json`        | `Record<string, unknown>`  |
| `EnumRef`     | Generated enum type        |
| `Association` | Related model type / array |

## Hidden Schemas

Schemas with `options.hidden: true` are skipped for TypeScript generation:

```yaml
name: AppCache
options:
  hidden: true    # No TypeScript interface generated
```

Use cases:
- System tables (cache, sessions, jobs)
- Tables that don't need frontend types

## Enum Generation (Multi-locale)

```yaml
# schemas/PostStatus.yaml
name: PostStatus
kind: enum
displayName:
  ja: 投稿ステータス
  en: Post Status
values:
  draft:
    ja: 下書き
    en: Draft
  published:
    ja: 公開済み
    en: Published
  archived:
    ja: アーカイブ
    en: Archived
```

Generated:
```typescript
export const PostStatus = {
  draft: 'draft',
  published: 'published',
  archived: 'archived',
} as const;

export type PostStatus = typeof PostStatus[keyof typeof PostStatus];

// Multi-locale labels
export const PostStatusLabels: Record<PostStatus, Record<string, string>> = {
  draft: { ja: '下書き', en: 'Draft' },
  published: { ja: '公開済み', en: 'Published' },
  archived: { ja: 'アーカイブ', en: 'Archived' },
};

// Get label for specific locale
export function getPostStatusLabel(value: PostStatus, locale: string = 'en'): string {
  return PostStatusLabels[value]?.[locale] ?? PostStatusLabels[value]?.['en'] ?? value;
}

// Helper functions
export const PostStatusValues = Object.values(PostStatus);
export function isPostStatus(value: unknown): value is PostStatus {
  return PostStatusValues.includes(value as PostStatus);
}
```

## Validation Rules (Ant Design)

Omnify generates Ant Design compatible validation rules in `rules/` directory.

**See detailed guide:** `.claude/omnify/antdesign-guide.md`

Quick example:
```tsx
import { Form, Input } from 'antd';
import { getUserRules, getUserPropertyDisplayName } from './types/model/rules/User.rules';

function UserForm({ locale = 'ja' }) {
  const rules = getUserRules(locale);
  return (
    <Form>
      <Form.Item name="name" label={getUserPropertyDisplayName('name', locale)} rules={rules.name}>
        <Input />
      </Form.Item>
    </Form>
  );
}
```

## Association Types

### ManyToOne
```yaml
author:
  type: Association
  relation: ManyToOne
  target: User
```

Generated:
```typescript
export interface Post {
  authorId: number;
  author?: User;  // Optional: loaded relation
}
```

### OneToMany
```yaml
posts:
  type: Association
  relation: OneToMany
  target: Post
```

Generated:
```typescript
export interface User {
  posts?: Post[];  // Optional: loaded relation array
}
```

### ManyToMany
```yaml
tags:
  type: Association
  relation: ManyToMany
  target: Tag
```

Generated:
```typescript
export interface Post {
  tags?: Tag[];  // Optional: loaded relation array
}
```

## Nullable Fields

Fields without `required: true` are nullable:

```yaml
description:
  type: LongText  # No required: true
```

Generated:
```typescript
description: string | null;
```

## Using Generated Types

```typescript
import { User, Post, PostStatus, isPostStatus } from './types/omnify-types';

// Type-safe object creation
const user: User = {
  id: 1,
  name: 'John',
  email: 'john@example.com',
  profile: null,
  createdAt: new Date(),
};

// Enum usage
const status: PostStatus = PostStatus.draft;

// Type guard
function handleStatus(value: unknown) {
  if (isPostStatus(value)) {
    console.log('Valid status:', value);
  }
}
```

## Commands

```bash
# Create new project
npx @famgia/omnify create-laravel-project my-app

# Generate TypeScript types
npx @famgia/omnify generate

# Force regenerate all files
npx @famgia/omnify generate --force

# Only generate TypeScript types
npx @famgia/omnify generate --types-only

# Validate schemas
npx @famgia/omnify validate
```

## Configuration

```typescript
// omnify.config.ts
import { defineConfig } from '@famgia/omnify';
import typescript from '@famgia/omnify-typescript/plugin';

export default defineConfig({
  schemasDir: './schemas',
  lockFilePath: './.omnify.lock',

  plugins: [
    typescript({
      // Output path for TypeScript files
      path: './resources/ts/types/models',

      // Generate Ant Design validation rules
      generateRules: true,
    }),
  ],

  locale: {
    locales: ['ja', 'en'],
    defaultLocale: 'ja',
  },
});
```

### Configuration Options

| Option          | Type      | Default             | Description                          |
| --------------- | --------- | ------------------- | ------------------------------------ |
| `path`          | `string`  | `./src/types/model` | TypeScript output directory          |
| `generateRules` | `boolean` | `true`              | Generate Ant Design validation rules |
