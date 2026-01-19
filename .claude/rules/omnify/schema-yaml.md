# Omnify Schema Rules

## Schema Workflow

1. Read @.claude/omnify/guides/omnify/schema-guide.md first
2. Create/edit YAML schema
3. Run `npx omnify generate`
4. Validate generated code
5. Run `php artisan migrate`

## Basic Template

```yaml
name: ModelName
kind: object

displayName:
  ja: モデル名
  en: Model Name

options:
  timestamps: true

properties:
  name:
    type: String
    length: 100
    displayName:
      ja: 名前
      en: Name
```

## ⚠️ CRITICAL: String Defaults

```yaml
# ❌ WRONG - produces curly quotes
default: "'cloud'"

# ✅ CORRECT - just the value
default: cloud
```

## ⚠️ CRITICAL: DB Functions NOT Allowed

```yaml
# ❌ WRONG - DB functions
failed_at:
  type: Timestamp
  default: CURRENT_TIMESTAMP  # ERROR!

# ✅ CORRECT - use useCurrent
failed_at:
  type: Timestamp
  useCurrent: true            # = CURRENT_TIMESTAMP
```

## Property Types

| Type | SQL | TypeScript |
|------|-----|------------|
| String | VARCHAR | string |
| Text | TEXT | string |
| Int | INT | number |
| Boolean | BOOLEAN | boolean |
| DateTime | DATETIME | string |

## Relationships

| Relation | Description |
|----------|-------------|
| belongsTo | Foreign key on THIS table |
| hasMany | Foreign key on OTHER table |
| belongsToMany | Pivot table |

## Full Documentation

See @.claude/omnify/guides/omnify/schema-guide.md for complete syntax.