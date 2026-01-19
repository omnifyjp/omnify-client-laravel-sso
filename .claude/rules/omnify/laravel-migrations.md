# ⛔ STOP: Migration Rules

## Auto-Generated Migrations (DO NOT EDIT)

Files in `database/migrations/omnify/` are **AUTO-GENERATED** by Omnify.

**ANY MANUAL CHANGES WILL BE OVERWRITTEN** on next `npx omnify generate`.

## ✅ Correct Workflow

### To add/modify columns:

1. Edit schema YAML in `schemas/`
2. Run `npx omnify generate`
3. Run `php artisan migrate`

### For custom migrations (outside Omnify):

```bash
php artisan make:migration add_custom_field_to_users_table
# Creates: database/migrations/2026_xx_xx_xxxxxx_add_custom_field_to_users_table.php
# This is SAFE - Omnify won't touch it
```

## File Structure

```
database/migrations/
├── omnify/                    ← ⛔ AUTO-GENERATED - DO NOT EDIT
│   ├── 2026_01_01_000000_create_users_table.php
│   └── ...
├── 2026_01_12_120000_add_custom_field.php  ← ✅ Safe to edit
└── 2026_01_12_130000_custom_migration.php  ← ✅ Safe to edit
```

## Quick Reference

| Want to... | Do this |
|------------|---------|
| Add column | Edit schema YAML → `npx omnify generate` |
| Modify column | Edit schema YAML → `npx omnify generate` |
| Custom migration | `php artisan make:migration` (outside omnify/) |