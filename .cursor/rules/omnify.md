# Omnify Schema Rules

This project uses Omnify for schema-driven code generation.
Schemas are in `schemas/` directory with `.yaml` extension.

For detailed documentation, read these files:
- .claude/omnify/schema-guide.md - Base schema format
- .claude/omnify/config-guide.md - Configuration (omnify.config.ts)
- .claude/omnify/laravel-guide.md - Laravel generator (if exists)
- .claude/omnify/typescript-guide.md - TypeScript generator (if exists)

Commands:
- npx omnify generate - Generate code from schemas
- npx omnify validate - Validate all schemas
