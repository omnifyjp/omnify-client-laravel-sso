# Omnify Configuration Guide

## Quick Start

```bash
# Create new Laravel project (recommended)
npx @famgia/omnify create-laravel-project my-app
cd my-app

# Or initialize in existing project
npx @famgia/omnify init
```

## Required Laravel Packages

After setting up Omnify, install these required Laravel packages:

### L5-Swagger (API Documentation)

Omnify generates OpenAPI/Swagger annotations for all models and controllers. You **must** install L5-Swagger:

```bash
composer require darkaonline/l5-swagger
php artisan vendor:publish --provider "L5Swagger\L5SwaggerServiceProvider"
```

Then configure in `config/l5-swagger.php`:

```php
'generate_always' => env('L5_SWAGGER_GENERATE_ALWAYS', true),
'generate_yaml_copy' => env('L5_SWAGGER_GENERATE_YAML_COPY', true),
```

Access API docs at: `http://your-app/api/documentation`

### Other Recommended Packages

```bash
# Sanctum for API authentication (if using API)
composer require laravel/sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"

# Spatie Laravel Permission (if using roles/permissions)
composer require spatie/laravel-permission
```

## Configuration File

Create `omnify.config.ts` in project root:

```typescript
import { defineConfig } from '@famgia/omnify';
import laravel from '@famgia/omnify-laravel/plugin';
import typescript from '@famgia/omnify-typescript/plugin';
import japan from '@famgia/omnify-japan/plugin';

export default defineConfig({
  schemasDir: './schemas',
  lockFilePath: './.omnify.lock',

  database: {
    driver: 'mysql',
    devUrl: 'docker://mysql/8/omnify_dev',
  },

  plugins: [
    japan(),   // Japan-specific types
    laravel(), // All generators enabled by default
    typescript({
      path: './resources/ts/omnify',
      generateRules: true,
    }),
  ],

  locale: {
    locales: ['ja', 'en', 'vi'],
    defaultLocale: 'ja',
  },
});
```

## Configuration Options

### Root Options

| Option         | Type       | Required | Description                           |
| -------------- | ---------- | -------- | ------------------------------------- |
| `schemasDir`   | `string`   | Yes      | Directory containing schema files     |
| `lockFilePath` | `string`   | Yes      | Path to lock file for change tracking |
| `database`     | `object`   | Yes      | Database configuration                |
| `plugins`      | `Plugin[]` | No       | Array of generator plugins            |
| `locale`       | `object`   | No       | Multi-language support configuration  |

### database (required)

| Option                | Type      | Description                                                       |
| --------------------- | --------- | ----------------------------------------------------------------- |
| `driver`              | `string`  | Database driver: `mysql`, `pgsql`, `sqlite`, `sqlsrv`, `mariadb`  |
| `devUrl`              | `string`  | Development database URL for Atlas diff (required for `generate`) |
| `enableFieldComments` | `boolean` | Enable field comments in migrations (MySQL)                       |

### Database URL Format

```
mysql://user:password@host:port/database
postgres://user:password@host:port/database
sqlite://path/to/file.db
```

## Plugin Configuration

### Laravel Plugin

```typescript
import laravel from '@famgia/omnify-laravel/plugin';

laravel({
  // Base directory (for monorepo: './backend/')
  base: '',
  
  // Path options
  migrationsPath: 'database/migrations/omnify',
  modelsPath: 'app/Models',
  baseModelsPath: 'app/Models/OmnifyBase',
  providersPath: 'app/Providers',
  factoriesPath: 'database/factories',
  requestsPath: 'app/Http/Requests',
  baseRequestsPath: 'app/Http/Requests/OmnifyBase',
  resourcesPath: 'app/Http/Resources',
  baseResourcesPath: 'app/Http/Resources/OmnifyBase',
  
  // Generation flags
  generateModels: true,      // Generate Eloquent models
  generateFactories: true,   // Generate Laravel factories
  generateRequests: true,    // Generate FormRequest classes
  generateResources: true,   // Generate API Resource classes
  
  // Other options
  fakerLocale: 'ja_JP',      // Faker locale for factories
})
```

#### Path Options

| Option              | Type     | Default                         | Description                   |
| ------------------- | -------- | ------------------------------- | ----------------------------- |
| `base`              | `string` | `''`                            | Base dir (monorepo support)   |
| `migrationsPath`    | `string` | `database/migrations/omnify`    | Migration files               |
| `modelsPath`        | `string` | `app/Models`                    | User-editable models          |
| `baseModelsPath`    | `string` | `app/Models/OmnifyBase`         | Auto-generated base models    |
| `providersPath`     | `string` | `app/Providers`                 | Service provider              |
| `factoriesPath`     | `string` | `database/factories`            | Factory files                 |
| `requestsPath`      | `string` | `app/Http/Requests`             | User-editable FormRequests    |
| `baseRequestsPath`  | `string` | `app/Http/Requests/OmnifyBase`  | Auto-generated base requests  |
| `resourcesPath`     | `string` | `app/Http/Resources`            | User-editable API Resources   |
| `baseResourcesPath` | `string` | `app/Http/Resources/OmnifyBase` | Auto-generated base resources |

#### Generation Flags

| Option              | Type      | Default | Description                     |
| ------------------- | --------- | ------- | ------------------------------- |
| `generateModels`    | `boolean` | `true`  | Generate Eloquent model classes |
| `generateFactories` | `boolean` | `true`  | Generate Laravel factory files  |
| `generateRequests`  | `boolean` | `true`  | Generate FormRequest classes    |
| `generateResources` | `boolean` | `true`  | Generate API Resource classes   |

#### Other Options

| Option        | Type     | Default | Description                   |
| ------------- | -------- | ------- | ----------------------------- |
| `fakerLocale` | `string` | `en_US` | Faker locale for factory data |
| `connection`  | `string` | -       | Database connection name      |

### TypeScript Plugin

```typescript
import typescript from '@famgia/omnify-typescript/plugin';

typescript({
  path: './resources/ts/types/models',  // Output directory
  generateRules: true,                   // Generate Ant Design validation rules
})
```

| Option          | Type      | Default             | Description                           |
| --------------- | --------- | ------------------- | ------------------------------------- |
| `path`          | `string`  | `./src/types/model` | Output directory for TypeScript types |
| `generateRules` | `boolean` | `true`              | Generate Ant Design validation rules  |

### Japan Plugin (Optional)

```typescript
import japan from '@famgia/omnify-japan/plugin';

japan({
  // Japan-specific types: JapaneseName, JapaneseAddress, etc.
})
```

## Locale Configuration

```typescript
locale: {
  locales: ['ja', 'en', 'vi'],    // Supported locale codes
  defaultLocale: 'ja',            // Default locale for simple strings
  fallbackLocale: 'en',           // Fallback when requested locale not found
}
```

## Commands

```bash
# Create new Laravel project
npx @famgia/omnify create-laravel-project my-app

# Initialize in existing project
npx @famgia/omnify init

# Validate all schemas
npx @famgia/omnify validate

# Show pending changes
npx @famgia/omnify diff

# Generate code
npx @famgia/omnify generate

# Generate with options
npx @famgia/omnify generate --force           # Force regenerate
npx @famgia/omnify generate --migrations-only  # Only migrations
npx @famgia/omnify generate --types-only       # Only TypeScript

# Reset all generated files
npx @famgia/omnify reset
```

## Environment Variables

| Variable         | Description                          |
| ---------------- | ------------------------------------ |
| `OMNIFY_DEV_URL` | Override database.devUrl from config |
| `DEBUG`          | Set to `omnify:*` for debug output   |

## Common Mistakes

**Wrong** - `locales` at root level:
```typescript
{
  locales: ['en', 'ja'],  // ERROR: locales not in OmnifyConfig
}
```

**Correct** - `locales` inside `locale` object:
```typescript
{
  locale: {
    locales: ['en', 'ja'],
    defaultLocale: 'en',
  },
}
```

**Wrong** - Using old `output` format:
```typescript
{
  output: {
    laravel: { ... },      // ERROR: Use plugins instead
    typescript: { ... },
  },
}
```

**Correct** - Using plugins:
```typescript
{
  plugins: [
    laravel({ ... }),
    typescript({ ... }),
  ],
}
```

## Full Example

```typescript
import { defineConfig } from '@famgia/omnify';
import laravel from '@famgia/omnify-laravel/plugin';
import typescript from '@famgia/omnify-typescript/plugin';
import japan from '@famgia/omnify-japan/plugin';

export default defineConfig({
  schemasDir: './schemas',
  lockFilePath: './.omnify.lock',

  database: {
    driver: 'mysql',
    devUrl: process.env.OMNIFY_DEV_URL || 'docker://mysql/8/omnify_dev',
    enableFieldComments: true,
  },

  plugins: [
    japan(),  // Japan-specific types (load before laravel)
    laravel({
      // All generation flags are true by default:
      // generateModels, generateFactories, generateRequests, generateResources
      
      // Optional: customize paths (all use defaults, shown for reference)
      // migrationsPath: 'database/migrations/omnify',
      // modelsPath: 'app/Models',
      // baseModelsPath: 'app/Models/OmnifyBase',
      // requestsPath: 'app/Http/Requests',
      // baseRequestsPath: 'app/Http/Requests/OmnifyBase',
      // resourcesPath: 'app/Http/Resources',
      // baseResourcesPath: 'app/Http/Resources/OmnifyBase',
      
      fakerLocale: 'ja_JP',  // Optional: customize Faker locale
    }),
    typescript({
      path: './resources/ts/omnify',
      generateRules: true,
    }),
  ],

  locale: {
    locales: ['ja', 'en', 'vi'],
    defaultLocale: 'ja',
    fallbackLocale: 'en',
  },
});
```
