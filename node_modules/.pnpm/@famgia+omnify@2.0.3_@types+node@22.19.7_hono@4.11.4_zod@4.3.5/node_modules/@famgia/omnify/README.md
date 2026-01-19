# @famgia/omnify

Schema-driven database migration system with TypeScript types and Laravel migrations.

Define your database schema in YAML, generate Laravel migrations and TypeScript types automatically.

## Installation

```bash
# Main package (for programmatic usage)
npm install @famgia/omnify

# CLI tool (for command line usage)
npm install -g @famgia/omnify-cli
```

## Quick Start

### 1. Initialize project

```bash
omnify init
```

This creates:
- `omnify.config.ts` - Configuration file
- `schemas/` - Directory for schema files
- `schemas/user.yaml` - Example schema

### 2. Configure

Edit `omnify.config.ts`:

```typescript
import { defineConfig } from '@famgia/omnify-cli';

export default defineConfig({
  // Schema files location
  schemaDir: './schemas',

  // Laravel migrations output
  migrations: {
    outputDir: './database/migrations',
    connection: 'mysql', // mysql | pgsql | sqlite
  },

  // TypeScript types output
  typescript: {
    outputDir: './resources/js/types',
    // Or for React/Vue frontend:
    // outputDir: './frontend/src/types',
  },

  // Atlas HCL output (optional)
  atlas: {
    outputDir: './atlas',
    lockFile: './atlas/omnify.lock',
  },

  // Plugins (optional)
  plugins: [
    // '@famgia/omnify-japan', // Japan-specific types
  ],
});
```

### 3. Create schemas

```yaml
# schemas/user.yaml
name: User
displayName: User Account
group: auth

properties:
  email:
    type: String
    unique: true
  name:
    type: String
  password:
    type: String
  role:
    type: Enum
    values: [admin, user, guest]
    default: user
  avatar:
    type: String
    nullable: true
  email_verified_at:
    type: DateTime
    nullable: true

options:
  timestamps: true      # adds created_at, updated_at
  softDelete: true      # adds deleted_at
  idType: Int           # Int | BigInt | Uuid | String
```

### 4. Generate code

```bash
# Validate schemas
omnify validate

# Preview changes (dry run)
omnify diff

# Generate migrations and types
omnify generate
```

## Configuration Reference

### Full Config Options

```typescript
import { defineConfig } from '@famgia/omnify-cli';
import { japanPlugin } from '@famgia/omnify-japan';

export default defineConfig({
  // Required: Schema files directory
  schemaDir: './schemas',

  // Laravel migration settings
  migrations: {
    outputDir: './database/migrations',
    connection: 'mysql',        // Database driver
    tablePrefix: '',            // Prefix for table names
    generateDropMigrations: false,
  },

  // TypeScript generation settings
  typescript: {
    outputDir: './types',
    generateEnums: true,        // Generate enum types
    generateInterfaces: true,   // Generate model interfaces
    exportStyle: 'named',       // 'named' | 'default'
  },

  // Atlas integration settings
  atlas: {
    outputDir: './atlas',
    lockFile: './atlas/omnify.lock',
    dialect: 'mysql',           // mysql | postgres | sqlite
  },

  // Plugins for custom types
  plugins: [
    japanPlugin,
  ],
});
```

## Schema Format

### Basic Schema

```yaml
name: Post                    # Required: Schema name (PascalCase)
displayName: Blog Post        # Optional: Human-readable name
group: content                # Optional: Group for organization

properties:
  title:
    type: String
  content:
    type: Text
  published:
    type: Boolean
    default: false

options:
  timestamps: true
```

### Property Types

| Type | Laravel | TypeScript | Description |
|------|---------|------------|-------------|
| `String` | `string(255)` | `string` | Short text |
| `Text` | `text` | `string` | Long text |
| `Int` | `integer` | `number` | Integer |
| `BigInt` | `bigInteger` | `number` | Large integer |
| `Float` | `float` | `number` | Floating point |
| `Decimal` | `decimal(10,2)` | `number` | Precise decimal |
| `Boolean` | `boolean` | `boolean` | True/false |
| `Date` | `date` | `string` | Date only |
| `DateTime` | `dateTime` | `string` | Date and time |
| `Timestamp` | `timestamp` | `string` | Unix timestamp |
| `Time` | `time` | `string` | Time only |
| `Json` | `json` | `Record<string, unknown>` | JSON data |
| `Uuid` | `uuid` | `string` | UUID |
| `Enum` | `enum` | `union type` | Enumeration |

### Property Modifiers

```yaml
properties:
  email:
    type: String
    unique: true              # Unique constraint
    nullable: true            # Allow NULL
    default: 'default@example.com'  # Default value
    length: 100               # String length (default: 255)

  price:
    type: Decimal
    precision: 10             # Total digits
    scale: 2                  # Decimal places

  status:
    type: Enum
    values: [draft, published, archived]
    default: draft
```

### Associations (Relationships)

Define relationships between schemas. See [full documentation](https://cdn.jsdelivr.net/npm/@famgia/omnify/docs/associations.md) for details.

```yaml
# schemas/post.yaml
name: Post
properties:
  title:
    type: String

  # ManyToOne (BelongsTo) - creates author_id column
  author:
    type: Association
    relation: ManyToOne
    target: User
    onDelete: CASCADE

  # OneToMany (HasMany) - no column, inverse of ManyToOne
  comments:
    type: Association
    relation: OneToMany
    target: Comment
    inversedBy: post

  # ManyToMany - creates pivot table
  tags:
    type: Association
    relation: ManyToMany
    target: Tag
    inversedBy: posts
```

| Relation | Description | Creates Column |
|----------|-------------|----------------|
| `ManyToOne` | BelongsTo, has FK | Yes (`{name}_id`) |
| `OneToMany` | HasMany, inverse side | No |
| `OneToOne` | One-to-one, use `owningSide` | Owner side only |
| `ManyToMany` | Many-to-many | Pivot table |

**Options:** `onDelete`, `onUpdate` (`CASCADE`, `SET NULL`, `RESTRICT`), `nullable`, `inversedBy`, `mappedBy`

### Enum Schema

```yaml
# schemas/status.yaml
name: OrderStatus
kind: enum
values:
  - pending
  - processing
  - shipped
  - delivered
  - cancelled
```

### Schema Options

```yaml
options:
  timestamps: true        # Add created_at, updated_at
  softDelete: true        # Add deleted_at for soft deletes
  idType: Int             # Int | BigInt | Uuid | String
  table: custom_table     # Custom table name (default: snake_case of name)
```

## CLI Commands

### `omnify init`

Initialize a new project with config and example schemas.

```bash
omnify init
omnify init --force  # Overwrite existing files
```

### `omnify validate`

Validate all schema files for errors.

```bash
omnify validate
omnify validate --schema user  # Validate specific schema
```

### `omnify diff`

Preview pending changes without generating files.

```bash
omnify diff
omnify diff --verbose  # Show detailed changes
```

### `omnify generate`

Generate Laravel migrations and TypeScript types.

```bash
omnify generate
omnify generate --migrations-only  # Only migrations
omnify generate --types-only       # Only TypeScript
omnify generate --dry-run          # Preview without writing
```

## Programmatic API

```typescript
import {
  loadSchemas,
  validateSchemas,
  generateMigrations,
  generateTypeScript,
  createOmnify,
} from '@famgia/omnify';

// Simple usage
async function generate() {
  const schemas = await loadSchemas('./schemas');
  const validation = validateSchemas(schemas);

  if (!validation.valid) {
    console.error('Validation errors:', validation.errors);
    return;
  }

  // Generate Laravel migrations
  const migrations = generateMigrations(schemas);

  // Generate TypeScript types
  const types = generateTypeScript(schemas);
}

// Advanced usage with Omnify class
async function advancedGenerate() {
  const omnify = createOmnify({
    schemaDir: './schemas',
    plugins: [],
  });

  await omnify.initialize();

  const schemas = omnify.getSchemas();
  const metadata = omnify.introspectSchemas();

  // Access relationship graph
  const graph = omnify.getRelationshipGraph();
  const order = omnify.getTopologicalOrder();
}
```

## Generated Output Examples

### Laravel Migration

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique();
            $table->string('name');
            $table->string('password');
            $table->enum('role', ['admin', 'user', 'guest'])->default('user');
            $table->string('avatar')->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
```

### TypeScript Types

```typescript
// types/models.ts
export interface User {
  id: number;
  email: string;
  name: string;
  password: string;
  role: UserRole;
  avatar: string | null;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export type UserRole = 'admin' | 'user' | 'guest';

export interface Post {
  id: number;
  title: string;
  content: string;
  author_id: number;
  created_at: string;
  updated_at: string;
}
```

## Plugins

### Japan Types Plugin

```bash
npm install @famgia/omnify-japan
```

```typescript
// omnify.config.ts
import { defineConfig } from '@famgia/omnify-cli';
import { japanPlugin } from '@famgia/omnify-japan';

export default defineConfig({
  schemaDir: './schemas',
  plugins: [japanPlugin],
});
```

```yaml
# schemas/customer.yaml
name: Customer
properties:
  postal_code:
    type: JapanesePostalCode    # 〒123-4567
  phone:
    type: JapanesePhone         # 03-1234-5678
  prefecture:
    type: JapanPrefecture    # 東京都, 大阪府, etc.
```

## Packages

| Package | Description |
|---------|-------------|
| [@famgia/omnify](https://www.npmjs.com/package/@famgia/omnify) | Main entry point |
| [@famgia/omnify-cli](https://www.npmjs.com/package/@famgia/omnify-cli) | CLI tool |
| [@famgia/omnify-core](https://www.npmjs.com/package/@famgia/omnify-core) | Core engine |
| [@famgia/omnify-types](https://www.npmjs.com/package/@famgia/omnify-types) | Type definitions |
| [@famgia/omnify-laravel](https://www.npmjs.com/package/@famgia/omnify-laravel) | Laravel generator |
| [@famgia/omnify-atlas](https://www.npmjs.com/package/@famgia/omnify-atlas) | Atlas integration |
| [@famgia/omnify-japan](https://www.npmjs.com/package/@famgia/omnify-japan) | Japan types |

## Migration from @famgia/omnify (v0.12.x)

The old `@famgia/omnify` package has been renamed to `@famgia/omnify-old`:

```bash
npm uninstall @famgia/omnify
npm install @famgia/omnify-old
```

The old package provided React/Antd form helpers. The new `@famgia/omnify` is a complete rewrite focused on schema-driven code generation.

## License

MIT
