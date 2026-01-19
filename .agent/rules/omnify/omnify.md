---
id: omnify
description: "Omnify schema-driven code generation: YAML schema syntax, configuration (omnify.config.ts), and generation workflow. Apply when editing schema files or config."
priority: high
globs:
  - "schemas/**/*.yaml"
  - "schemas/**/*.yml"
  - "omnify.config.ts"
tags:
  - omnify
---

# Omnify Schema Rules

This project uses Omnify for schema-driven code generation.

## Documentation

Read these files in `.claude/omnify/guides/omnify/`:

| File                  | Content                          |
| --------------------- | -------------------------------- |
| `schema-guide.md`     | Base schema format               |
| `config-guide.md`     | Configuration (omnify.config.ts) |
| `laravel-guide.md`    | Laravel generator                |
| `typescript-guide.md` | TypeScript generator             |
| `japan-guide.md`      | Japanese field types             |

## Commands

```bash
npx omnify generate  # Generate code from schemas
npx omnify validate  # Validate all schemas
```

## Important

- **DO NOT** manually edit files in `database/migrations/omnify/`
- **DO NOT** manually edit files in `resources/ts/omnify/schemas/base/`
- **DO NOT** manually edit files in `app/Models/OmnifyBase/`
- Schema changes → Run `npx omnify generate`

## Schema Quick Reference

```yaml
name: User
displayName:
  ja: ユーザー
  en: User

properties:
  email:
    type: Email
    unique: true
  name:
    type: String
  role:
    type: EnumRef
    target: UserRole

options:
  timestamps: true
  softDelete: true
```