# Installation Guide

## Requirements

- PHP 8.2 or higher
- Laravel 11.0+ or 12.0+
- MySQL 8.0+ / PostgreSQL 13+ / SQLite 3.35+
- Composer 2.0+

## Step 1: Install via Composer

```bash
composer require famgia/omnify-sso-client
```

Laravel will auto-discover the service provider. No manual registration needed.

## Step 2: Publish Configuration (Optional)

```bash
php artisan vendor:publish --tag=sso-client-config
```

This publishes `config/sso-client.php` to your application.

## Step 3: Configure Environment

Add the following to your `.env` file:

```env
# Required - Omnify Console URL
SSO_CONSOLE_URL=https://console.omnify.jp

# Required - Your service identifier registered in Console
SSO_SERVICE_SLUG=your-service-slug

# Optional - Logging
SSO_LOGGING_ENABLED=true
SSO_LOG_CHANNEL=sso
SSO_LOG_LEVEL=debug

# Optional - Cache TTLs (in seconds)
SSO_JWKS_CACHE_TTL=60
SSO_ORG_ACCESS_CACHE_TTL=300
SSO_USER_TEAMS_CACHE_TTL=300

# Optional - Security
SSO_ALLOWED_REDIRECT_HOSTS=example.com,*.example.com
SSO_REQUIRE_HTTPS_REDIRECTS=true
```

## Step 4: Run Migrations

```bash
php artisan migrate
```

This creates the following tables:
- `users` (extended with SSO fields)
- `roles`
- `permissions`
- `role_permissions`
- `teams`
- `team_permissions`

## Step 5: Configure User Model

### Option A: Use Install Command (Recommended)

```bash
php artisan sso:install
```

This automatically creates/updates your `app/Models/User.php`:

```php
<?php

namespace App\Models;

use Omnify\SsoClient\Models\User as SsoUser;

class User extends SsoUser
{
    // Your custom methods here
}
```

### Option B: Manual Setup

Edit your `app/Models/User.php`:

```php
<?php

namespace App\Models;

use Omnify\SsoClient\Models\User as SsoUser;

class User extends SsoUser
{
    // The package User already includes:
    // - Authenticatable
    // - Authorizable
    // - HasApiTokens (Sanctum)
    // - HasConsoleSso
    // - HasTeamPermissions
}
```

## Step 6: Configure Sanctum (For SPA)

If you're using Sanctum for SPA authentication:

```php
// config/sanctum.php
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', sprintf(
    '%s%s',
    'localhost,localhost:3000,127.0.0.1,127.0.0.1:8000,::1',
    env('APP_URL') ? ','.parse_url(env('APP_URL'), PHP_URL_HOST) : ''
))),
```

```env
# .env
SANCTUM_STATEFUL_DOMAINS=localhost:3000,your-frontend-domain.com
SESSION_DOMAIN=.your-domain.com
```

## Step 7: Sync Initial Permissions (Optional)

If you have a predefined list of permissions:

```bash
php artisan sso:sync-permissions
```

Configure permissions in `config/sso-client.php`:

```php
'permissions' => [
    ['name' => 'View Users', 'slug' => 'users.view', 'group' => 'users'],
    ['name' => 'Create Users', 'slug' => 'users.create', 'group' => 'users'],
    // ...
],
```

## Verification

Verify installation:

```bash
# Check routes are registered
php artisan route:list --path=sso

# Expected output:
# POST   api/sso/callback
# POST   api/sso/logout
# GET    api/sso/user
# ...
```

```bash
# Check migrations
php artisan migrate:status

# Expected: All migrations should be "Ran"
```

## Troubleshooting

### Routes not found

Ensure the service provider is registered:

```bash
php artisan package:discover
```

### Migration errors

Clear cache and re-run:

```bash
php artisan config:clear
php artisan cache:clear
php artisan migrate:fresh
```

### User model conflicts

If you have an existing User model with conflicting methods:

1. Backup your model
2. Run `php artisan sso:install`
3. Merge your custom code into the new User model

## Next Steps

- [Configuration](configuration.md) - Customize all options
- [Authentication](authentication.md) - Implement SSO login
- [Authorization](authorization.md) - Set up RBAC
