# Partial Schema Guide

## Overview

Partial schemas (`kind: partial`) allow packages to extend or provide default schemas without modifying main application files.

```yaml
# packages/sso-client/schemas/User.yaml
kind: partial
priority: 10

properties:
  sso_token:
    type: String
    nullable: true
```

## Key Concepts

### Target is Inferred from Filename

**No `target` field needed.** The target schema is determined by the filename:

```
User.yaml → targets User schema
Permission.yaml → targets Permission schema
Team.yaml → targets Team schema
```

### Merge Behavior

| Scenario                                                        | Result                      |
| --------------------------------------------------------------- | --------------------------- |
| Main app has `User.yaml` + Package has `User.yaml` (partial)    | Merge into main User        |
| Main app has NO `User.yaml` + Package has `User.yaml` (partial) | Partial becomes User schema |
| Multiple packages have `User.yaml` (partial)                    | Merge via priority          |

## Priority System

Lower number = Higher priority = Merged first = Wins conflicts

```yaml
kind: partial
priority: 10  # High priority (1-49)
priority: 50  # Default priority
priority: 90  # Low priority (51-100)
```

### Priority Ranges

| Range  | Use For                   |
| ------ | ------------------------- |
| 1-20   | Core system packages      |
| 21-40  | Feature modules           |
| 41-60  | Business logic extensions |
| 61-80  | Tenant customizations     |
| 81-100 | Development/testing       |

## Use Cases

### 1. Package Provides Default Schema

SSO package provides default User schema if main app has none:

```yaml
# packages/sso-client/schemas/User.yaml
kind: partial
priority: 10

displayName:
  ja: ユーザー
  en: User

options:
  timestamps: true
  authenticatable: true

properties:
  email:
    type: Email
    unique: true
  name:
    type: String
  console_user_id:
    type: BigInt
    nullable: true
```

**Result:**
- Apps WITH existing User.yaml → SSO fields merge into their User
- Apps WITHOUT User.yaml → Package's User becomes the User schema

### 2. Package Extends Existing Schema

Add fields to main app's User:

```yaml
# packages/billing/schemas/User.yaml
kind: partial
priority: 50

properties:
  stripe_customer_id:
    type: String
    nullable: true
  subscription_status:
    type: String
    nullable: true
```

**Result:** User schema has all original properties + billing properties

### 3. Multiple Packages Extend Same Schema

```
Main App: schemas/auth/User.yaml (regular schema)
├─ SSO Package: User.yaml (partial, priority: 10)
└─ Billing Package: User.yaml (partial, priority: 50)
```

**Merge Order:**
1. SSO Package (priority 10) merges first
2. Billing Package (priority 50) merges second
3. Main app properties always win over partials

## Configuration

### omnify.config.ts

```typescript
const config: OmnifyConfig = {
  schemasDir: './schemas',

  additionalSchemaPaths: [
    {
      path: './packages/sso-client/database/schemas',
      namespace: 'Sso',
      // Optional: Package-specific output
      output: {
        laravel: {
          base: './packages/sso-client',
          modelsNamespace: 'Vendor\\SsoClient\\Models',
          modelsPath: 'src/Models',
        },
      },
    },
  ],
};
```

## File Structure Examples

### Package with Partial Schemas

```
packages/sso-client/
├── database/
│   └── schemas/
│       ├── User.yaml          # kind: partial (extends/provides User)
│       ├── Permission.yaml    # kind: partial (provides Permission)
│       ├── Role.yaml          # regular schema (package-only)
│       └── RolePermission.yaml
├── src/
│   └── Models/
└── composer.json
```

### Main App Schemas

```
schemas/
├── auth/
│   └── User.yaml              # Main User schema (takes priority)
├── blog/
│   ├── Post.yaml
│   └── Comment.yaml
└── shop/
    └── Product.yaml
```

## Property Merge Rules

| Scenario                      | Result                       |
| ----------------------------- | ---------------------------- |
| Property only in main         | Main property used           |
| Property only in partial      | Partial property added       |
| Property in both              | **Main wins**                |
| Property in multiple partials | Higher priority partial wins |

### Example: Property Conflict

```yaml
# Main app User.yaml
properties:
  name:
    type: String
    length: 100

# Package User.yaml (partial)
properties:
  name:              # Same property!
    type: Text       # Different type
    nullable: true
```

**Result:** `name` remains `String(100)` from main app

## What Partials Can Define

| ✅ Allowed   | ❌ Not Allowed      |
| ----------- | ------------------ |
| properties  | options.id         |
| displayName | options.timestamps |
| priority    | options.softDelete |
| -           | options.tableName  |

## Best Practices

### 1. Use Descriptive Filenames

```
✅ User.yaml         # Clear: extends/provides User
✅ Permission.yaml   # Clear: extends/provides Permission
❌ UserExtension.yaml  # Confusing (targets UserExtension, not User)
```

### 2. Prefix Package-Specific Fields

```yaml
# ✅ Good: Unique, prefixed names
sso_token:
billing_status:
console_user_id:

# ❌ Bad: Generic names that might conflict
token:
status:
user_id:
```

### 3. Document Dependencies

```yaml
# User.yaml
# Package: @famgia/sso-client
# Requires: Role schema from same package
# Priority: 10 (core system)

kind: partial
priority: 10

properties:
  role:
    type: Association
    relation: ManyToOne
    target: Role
```

### 4. Keep Partials Focused

```yaml
# ✅ Good: Single responsibility
# sso-client/User.yaml - Only SSO fields
kind: partial
properties:
  sso_token:
    type: String
  console_user_id:
    type: BigInt

# ❌ Bad: Mixed responsibilities
# Don't put billing + SSO + notifications in one partial
```

## Troubleshooting

### Partial Not Merging

**Problem:** Package partial not appearing in generated model

**Check:**
1. Package path in `additionalSchemaPaths`?
2. Filename matches target? (User.yaml → User)
3. `kind: partial` set correctly?

```bash
# Verify schemas loaded
npx omnify generate --verbose
```

### Property Conflict

**Problem:** Partial property being ignored

**Reason:** Main app has same property (main always wins)

**Solution:** 
- Use different property name in partial
- Or remove from main app if partial should own it

### Priority Not Working

**Problem:** Wrong partial winning in conflict

**Check:**
```yaml
# Lower number = higher priority
priority: 10  # Wins over
priority: 50  # This one
```

## Generate Output

```bash
npx omnify generate
```

**Console shows:**
```
→ Loading schemas from /app/schemas
→ Loading schemas from 1 additional path(s)
  • ./packages/sso-client/schemas [Sso]: 2 schema(s) + 2 partial(s)
→ Validating schemas...
✓ Generation complete!
```

## Quick Reference

```yaml
# Minimal partial schema
kind: partial
properties:
  new_field:
    type: String

# Full partial schema
kind: partial
priority: 10

displayName:
  ja: 拡張
  en: Extension

properties:
  field1:
    type: String
    displayName:
      ja: フィールド1
      en: Field 1
  field2:
    type: Int
    nullable: true
```
