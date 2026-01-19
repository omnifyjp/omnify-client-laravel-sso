# ⚠️ Deprecated

This folder is deprecated. AI guides are now generated from:

```
packages/core/src/ai-guides/
├── knowledge/       # Source content (single source of truth)
├── config/          # Metadata and rules
└── adapters/        # AI-specific transformers (Cursor, Claude, etc.)
```

## Migration

The new system provides:
- Single source of truth for all AI models
- Easy addition of new AI models (just add an adapter)
- Consistent content across Cursor, Claude, and future AI assistants

These stubs are kept for backward compatibility but are no longer used by the generator.
