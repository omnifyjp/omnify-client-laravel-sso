# Omnify SSO Client

Laravel package for Single Sign-On (SSO) integration with Omnify Console, featuring Role-Based Access Control (RBAC), team permissions, and comprehensive security features.

## Features

- **SSO Authentication** - JWT-based authentication with Omnify Console
- **ServiceInstance Support** - Supports Console's multi-instance architecture
- **Role-Based Access Control (RBAC)** - Flexible role and permission management
- **Team Permissions** - Organization-level permission management
- **Security** - Open redirect protection, input validation, rate limiting ready
- **Logging** - Dedicated log channel for audit trails
- **Multi-language** - i18n support for all model labels
- **API Ready** - RESTful admin endpoints with OpenAPI documentation
- **Omnify Auto-Discovery** - Automatically discovers all Omnify packages for CLI

## Architecture

This package integrates with Omnify Console's **ServiceInstance** architecture:

```
Console (SSO Provider)                    Your Service (SSO Client)
┌─────────────────────────────┐          ┌─────────────────────────┐
│ Service: "your-service"     │          │                         │
│                             │          │  Uses: service_slug     │
│ ServiceInstance (per-org):  │◀────────▶│  JWT verification       │
│   - client_id               │          │  Org-based access       │
│   - client_secret           │          │                         │
│   - environment             │          │                         │
│   - allowed_redirect_uris   │          │                         │
└─────────────────────────────┘          └─────────────────────────┘
```

> **Note:** Your service only needs the `service_slug`. Console manages `client_id`/`client_secret` per organization through ServiceInstance.

## Requirements

- PHP 8.2+
- Laravel 11.0+ or 12.0+
- MySQL 8.0+ / PostgreSQL 13+ / SQLite 3.35+

## Quick Start

### 1. Install

```bash
composer require famgia/omnify-sso-client
```

### 2. Configure Environment

```env
# Required
SSO_CONSOLE_URL=https://console.omnify.jp
SSO_SERVICE_SLUG=your-service-slug

# Optional
SSO_LOG_CHANNEL=sso
SSO_LOGGING_ENABLED=true
```

> **Note:** No `client_id`/`client_secret` required on service side. Console manages credentials per-organization via ServiceInstance.

### 3. Run Migrations

```bash
php artisan migrate
```

### 4. Install Command (Optional)

```bash
php artisan sso:install
```

This command will:
- Publish configuration files
- Create/update your User model to extend the package's User

## Documentation

| Document                                 | Description                   |
| ---------------------------------------- | ----------------------------- |
| [Installation](docs/installation.md)     | Detailed installation guide   |
| [Configuration](docs/configuration.md)   | All configuration options     |
| [Authentication](docs/authentication.md) | SSO flow and JWT verification |
| [Authorization](docs/authorization.md)   | RBAC, roles, and permissions  |
| [Middleware](docs/middleware.md)         | Available middleware          |
| [API Reference](docs/api.md)             | Admin API endpoints           |
| [Logging](docs/logging.md)               | SSO event logging             |
| [Security](docs/security.md)             | Security features             |
| [Testing](docs/testing.md)               | Testing guide                 |

## Quick Examples

### Authentication Flow

```php
// Frontend redirects to Console login
$loginUrl = "https://console.omnify.jp/sso/authorize?" . http_build_query([
    'service' => config('sso-client.service.slug'),
    'redirect_uri' => url('/sso/callback'),
]);

// After login, Console redirects back with code
// POST /api/sso/callback
{
    "code": "authorization_code_from_console"
}

// Response
{
    "user": { "id": 1, "email": "user@example.com", "name": "User" },
    "organizations": [...]
}
```

### Check Permissions

```php
use Omnify\SsoClient\Models\User;

$user = auth()->user();

// Check single permission
if ($user->hasPermission('users.create')) {
    // ...
}

// Check any permission
if ($user->hasAnyPermission(['users.create', 'users.update'])) {
    // ...
}

// Check all permissions
if ($user->hasAllPermissions(['users.create', 'users.update'])) {
    // ...
}

// Via Gate
if (Gate::allows('users.create')) {
    // ...
}

// Via Blade
@can('users.create')
    <button>Create User</button>
@endcan
```

### Protect Routes

```php
// In routes/api.php
Route::middleware(['sso.auth', 'sso.permission:users.create'])->group(function () {
    Route::post('/users', [UserController::class, 'store']);
});

// Role-based protection
Route::middleware(['sso.auth', 'sso.role:admin'])->group(function () {
    Route::resource('/admin/settings', SettingsController::class);
});
```

### Logging

```php
use function sso_log;

// Log custom events
sso_log()->info('Custom event', ['user_id' => $user->id]);

// Built-in logging (automatic)
// - Authentication attempts
// - JWT verification
// - Security events
// - API errors
```

## Omnify Auto-Discovery

This package includes a Composer plugin that automatically discovers all Omnify-enabled packages in your project.

### How It Works

After `composer install` or `composer update`, the plugin scans all installed packages for `extra.omnify` configuration and generates `.omnify-packages.json`:

```json
{
    "version": 1,
    "packages": {
        "omnifyjp/omnify-client-laravel-sso": {
            "schemas": "/path/to/vendor/omnifyjp/omnify-client-laravel-sso/database/schemas",
            "namespace": "Sso",
            "priority": 50
        }
    }
}
```

### Usage with Omnify CLI

The Omnify CLI automatically reads this manifest:

```bash
npx omnify generate
# Output: Auto-discovered 1 package(s) from .omnify-packages.json
```

### Creating Omnify-Enabled Packages

To make your package discoverable, add `extra.omnify` to your `composer.json`:

```json
{
    "extra": {
        "omnify": {
            "schemas": "database/schemas",
            "namespace": "YourPackage",
            "priority": 100,
            "options": {
                "modelNamespace": "Vendor\\YourPackage\\Models",
                "generateMigrations": false
            }
        }
    }
}
```

## Package Structure

```
omnify-sso-client/
├── config/
│   └── sso-client.php          # Configuration
├── database/
│   ├── factories/              # Model factories
│   ├── migrations/             # Database migrations
│   └── schemas/                # Omnify schema definitions
├── docs/                       # Documentation
├── routes/
│   └── sso.php                 # Package routes
├── src/
│   ├── Cache/                  # Cache services
│   ├── Console/Commands/       # Artisan commands
│   ├── Exceptions/             # Custom exceptions
│   ├── Http/
│   │   ├── Controllers/        # API controllers
│   │   └── Middleware/         # Route middleware
│   ├── Models/                 # Eloquent models
│   ├── Services/               # Business logic
│   └── Support/                # Helper classes
└── tests/                      # Test suite
```

## Models

| Model            | Description                                  |
| ---------------- | -------------------------------------------- |
| `User`           | Laravel-compatible user with SSO integration |
| `Role`           | Role with level hierarchy                    |
| `Permission`     | Individual permission                        |
| `RolePermission` | Role-Permission pivot                        |
| `Team`           | Console team/organization                    |
| `TeamPermission` | Team-level permissions                       |

## Available Commands

```bash
# Install package
php artisan sso:install

# Sync permissions from config
php artisan sso:sync-permissions

# Cleanup orphaned teams
php artisan sso:cleanup-orphan-teams
```

## Testing

```bash
# Run all tests
./vendor/bin/pest

# Run specific test file
./vendor/bin/pest tests/Feature/Security/SsoSecurityTest.php

# Run with coverage
./vendor/bin/pest --coverage
```

Current test coverage: **490 tests, 947 assertions**

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for your changes
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## License

MIT License. See [LICENSE](LICENSE) for more information.

## Credits

- [Omnify Team](https://omnify.jp)
- Generated with [Omnify](https://github.com/ecsol/omnify-ts)
