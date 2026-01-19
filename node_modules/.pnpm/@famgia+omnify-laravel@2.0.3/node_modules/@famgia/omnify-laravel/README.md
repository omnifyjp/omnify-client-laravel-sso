# @famgia/omnify-laravel

Laravel migration and TypeScript type generator for Omnify schemas.

## Installation

```bash
npm install @famgia/omnify-laravel
```

## Usage

### Plugin Mode (Recommended)

Use as a plugin in your `omnify.config.ts`:

```typescript
import { defineConfig } from '@famgia/omnify';
import laravel from '@famgia/omnify-laravel/plugin';

export default defineConfig({
  schemasDir: './schemas',
  database: {
    driver: 'mysql',
    devUrl: 'mysql://root@localhost:3306/dev',
  },

  plugins: [
    laravel({
      // Path for Laravel migration files (default: 'database/migrations')
      migrationsPath: 'database/migrations',

      // Path for TypeScript type files (default: 'types')
      typesPath: 'resources/js/types',

      // Generate all types in a single file (default: true)
      singleFile: true,

      // Database connection name for migrations (optional)
      connection: 'mysql',

      // Enable/disable generators (both default: true)
      generateMigrations: true,
      generateTypes: true,
    }),
  ],
});
```

Then run:

```bash
npx omnify generate
```

### Plugin Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `migrationsPath` | `string` | `'database/migrations'` | Output path for Laravel migrations |
| `typesPath` | `string` | `'types'` | Output path for TypeScript types |
| `singleFile` | `boolean` | `true` | Generate all types in one file |
| `connection` | `string` | `undefined` | Database connection name |
| `generateMigrations` | `boolean` | `true` | Generate Laravel migrations |
| `generateTypes` | `boolean` | `true` | Generate TypeScript types |

### Direct API Usage

For programmatic usage without the plugin system:

```typescript
import {
  generateMigrations,
  generateTypeScript,
} from '@famgia/omnify-laravel';

// Generate Laravel migrations
const migrations = generateMigrations(schemas, {
  timestamp: '2024_01_01_000000',
  connection: 'mysql',
});

// Generate TypeScript interfaces
const types = generateTypeScript(schemas, {
  singleFile: true,
});
```

## Features

- Laravel migration generation
- TypeScript interface generation
- Eloquent model generation with localization support
- Support for all Laravel column types
- Relationship handling (belongsTo, hasMany, etc.)
- Index and constraint generation
- Enum type support
- Plugin system with DAG-based generator ordering
- Multi-language displayName support (i18n)

## Generated Output

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
            $table->timestamps();
            $table->softDeletes();
        });
    }
};
```

### TypeScript Types

```typescript
export interface User {
  id: number;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
```

### Eloquent Models with Localized Display Names

The generator creates a clean model structure with separated locale data:

```
app/Models/OmnifyBase/
├── Traits/
│   └── HasLocalizedDisplayName.php  # Reusable trait
├── Locales/
│   ├── UserLocales.php              # User locale data
│   ├── PostLocales.php              # Post locale data
│   └── ...
├── UserBaseModel.php                # Clean base model
├── PostBaseModel.php
└── ...
```

#### Schema Definition with i18n

Define multi-language displayNames in your YAML schema:

```yaml
# schemas/auth/User.yaml
name: User
displayName:
  ja: ユーザー
  en: User
  vi: Người dùng

properties:
  name:
    type: String
    displayName:
      ja: 氏名
      en: Full Name
      vi: Họ tên

  email:
    type: String
    unique: true
    displayName:
      ja: メールアドレス
      en: Email Address
      vi: Địa chỉ email
```

#### Generated Locales Class

```php
// app/Models/OmnifyBase/Locales/UserLocales.php
class UserLocales
{
    public const DISPLAY_NAMES = [
        'ja' => 'ユーザー',
        'en' => 'User',
        'vi' => 'Người dùng',
    ];

    public const PROPERTY_DISPLAY_NAMES = [
        'name' => [
            'ja' => '氏名',
            'en' => 'Full Name',
            'vi' => 'Họ tên',
        ],
        // ...
    ];
}
```

#### Generated Base Model

```php
// app/Models/OmnifyBase/UserBaseModel.php
use App\Models\OmnifyBase\Traits\HasLocalizedDisplayName;
use App\Models\OmnifyBase\Locales\UserLocales;

class UserBaseModel extends Authenticatable
{
    use HasLocalizedDisplayName;

    protected static array $localizedDisplayNames = UserLocales::DISPLAY_NAMES;
    protected static array $localizedPropertyDisplayNames = UserLocales::PROPERTY_DISPLAY_NAMES;

    // ... rest of model
}
```

#### Using Localized Display Names in PHP

```php
// Get model display name (uses Laravel's app()->getLocale())
User::displayName();           // "ユーザー" (if locale is 'ja')
User::displayName('en');       // "User"
User::displayName('vi');       // "Người dùng"

// Get property display name
User::propertyDisplayName('name');        // "氏名" (if locale is 'ja')
User::propertyDisplayName('name', 'en');  // "Full Name"

// Get all display names
User::allDisplayNames();  // ['ja' => 'ユーザー', 'en' => 'User', 'vi' => 'Người dùng']

// Get all property names for current locale
User::allPropertyDisplayNamesForLocale();  // ['name' => '氏名', 'email' => 'メールアドレス', ...]
```

#### Locale Configuration

Configure locales in `omnify.config.ts`:

```typescript
import { defineConfig } from '@famgia/omnify';
import laravel from '@famgia/omnify-laravel/plugin';

export default defineConfig({
  schemasDir: './schemas',

  // Locale configuration
  locale: {
    locales: ['ja', 'en', 'vi'],
    defaultLocale: 'ja',
    fallbackLocale: 'en',
  },

  plugins: [laravel()],
});
```

## Creating Custom Plugins

You can create your own generator plugins following this pattern:

```typescript
import type { OmnifyPlugin, GeneratorContext, GeneratorOutput } from '@famgia/omnify-types';

export default function myPlugin(options?: MyOptions): OmnifyPlugin {
  return {
    name: 'my-plugin',
    version: '1.0.0',

    generators: [
      {
        name: 'my-generator',
        description: 'Generate custom files',

        // Optional: run after other generators
        dependsOn: ['laravel-migrations'],

        generate: async (ctx: GeneratorContext): Promise<GeneratorOutput[]> => {
          // Access schemas via ctx.schemas
          // Access previous generator outputs via ctx.previousOutputs

          return [
            {
              path: 'output/file.ts',
              content: '// Generated content',
              type: 'other',
            },
          ];
        },
      },
    ],
  };
}
```

## Related Packages

- [@famgia/omnify-core](https://www.npmjs.com/package/@famgia/omnify-core) - Core engine
- [@famgia/omnify-cli](https://www.npmjs.com/package/@famgia/omnify-cli) - CLI tool
- [@famgia/omnify-atlas](https://www.npmjs.com/package/@famgia/omnify-atlas) - Atlas adapter
- [@famgia/omnify-types](https://www.npmjs.com/package/@famgia/omnify-types) - Type definitions

## License

MIT
