---
id: migrations-workflow
description: "Schema-first workflow for database changes. NEVER use php artisan make:migration - always edit schemas/*.yaml and run npx omnify generate instead. This rule enforces the correct workflow when working with migrations."
priority: medium
globs:
  - "database/migrations/*.php"
tags:
  - migrations
  - workflow
---

# ⛔ STOP: DO NOT CREATE MIGRATIONS MANUALLY

## You MUST use Omnify Schema to create database changes

When you need to modify the database structure, **NEVER** run:

```bash
# ❌ FORBIDDEN
php artisan make:migration create_xxx_table
php artisan make:migration add_xxx_to_xxx_table
php artisan make:migration modify_xxx_column
```

---

## ✅ CORRECT WORKFLOW

### Step 1: Create or Edit Schema YAML

```yaml
# schemas/your-module/YourModel.yaml
displayName:
  ja: モデル名
  en: Model Name

properties:
  field_name:
    type: String
    length: 255
    displayName:
      ja: フィールド名
      en: Field Name
```

### Step 2: Generate Migrations

```bash
npx omnify generate
```

### Step 3: Run Migrations

```bash
php artisan migrate
```

---

## Why This Rule Exists

| Manual Migration | Omnify Schema |
|------------------|---------------|
| ❌ No TypeScript types | ✅ Auto-generated types |
| ❌ No i18n labels | ✅ Auto-generated i18n |
| ❌ No Zod validation | ✅ Auto-generated validation |
| ❌ No API resources | ✅ Auto-generated API |
| ❌ Inconsistent naming | ✅ Consistent naming |
| ❌ Manual model updates | ✅ Auto-updated models |

---

## Schema-First Development Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    SCHEMA YAML (Source of Truth)            │
│               schemas/module/ModelName.yaml                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼ npx omnify generate
         ┌────────────┴────────────┬─────────────────┐
         ▼                         ▼                 ▼
┌─────────────────┐    ┌─────────────────┐   ┌─────────────────┐
│   Migrations    │    │   Laravel       │   │   TypeScript    │
│   (PHP)         │    │   Models        │   │   Types/Zod     │
└─────────────────┘    └─────────────────┘   └─────────────────┘
         │                         │                 │
         ▼                         ▼                 ▼
    php artisan              Ready to use        Frontend ready
      migrate
```

---

## 🚨 BEFORE Creating Any Migration

### Ask yourself:

1. **Can this be done with Omnify Schema?**
   - New table? → Create new YAML schema
   - New column? → Add property to YAML
   - New index? → Add `index: true` to property
   - Foreign key? → Add association to YAML

2. **Is this schema-related?**
   - YES → Edit YAML, run `npx omnify generate`
   - NO → Only then consider manual migration

---

## When Manual Migrations ARE Allowed

Only for operations **NOT supported** by Omnify:

```bash
# ✅ ALLOWED: Data migrations (not schema changes)
php artisan make:migration migrate_old_data_to_new_format

# ✅ ALLOWED: Complex SQL operations
php artisan make:migration add_full_text_search_index

# ✅ ALLOWED: Third-party package migrations
php artisan vendor:publish --tag=package-migrations
```

**BUT NEVER for standard CRUD tables/columns!**

---

## Quick Reference: Schema vs Manual

| Change Type | Use Omnify Schema | Manual OK |
|-------------|:-----------------:|:---------:|
| Create table | ✅ | ❌ |
| Add column | ✅ | ❌ |
| Modify column | ✅ | ❌ |
| Add foreign key | ✅ | ❌ |
| Add simple index | ✅ | ❌ |
| Add pivot table | ✅ | ❌ |
| Add enum column | ✅ | ❌ |
| Data migration | ❌ | ✅ |
| Full-text index | ❌ | ✅ |
| Raw SQL changes | ❌ | ✅ |

---

## How to Add Common Schema Changes

### New Table

```yaml
# schemas/shop/Product.yaml
displayName:
  ja: 商品
  en: Product

properties:
  name:
    type: String
    length: 255
  price:
    type: Decimal
    precision: 10
    scale: 2
```

### New Column to Existing Table

```yaml
# Edit existing schemas/shop/Product.yaml
properties:
  # ... existing properties ...
  
  # Add new property
  sku:
    type: String
    length: 50
    unique: true
```

### Add Relationship

```yaml
# schemas/shop/Product.yaml
associations:
  category:
    type: ManyToOne
    target: Category
    foreignKey: category_id
```

### Add Index

```yaml
properties:
  email:
    type: String
    index: true  # Simple index
    
  # Or composite index
indexes:
  - columns: [first_name, last_name]
    unique: true
```

---

## Remember

> **Schema YAML = Single Source of Truth**
> 
> All database structure changes should originate from YAML schemas.
> The migration files are just **generated output**, not the source.

---

## If You're Unsure

Read the schema guide:

```bash
cat .cursor/rules/omnify/schema-create.mdc
# or
cat schemas/README.md
```

Or ask:
> "How do I add [field/table/relationship] using Omnify schema?"