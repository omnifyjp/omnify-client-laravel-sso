# Configuration Reference

All configuration options for the SSO Client package.

## Configuration File

Publish the config file:

```bash
php artisan vendor:publish --tag=sso-client-config
```

This creates `config/sso-client.php`.

## ServiceInstance Architecture Note

With Console's ServiceInstance architecture:
- **Service side only needs `service_slug`** - no `client_id`/`client_secret` required
- Console manages credentials per-organization through ServiceInstance
- Each organization can have multiple instances (production, staging, etc.)
- **Organization and Service IDs are UUIDs** - the package supports both UUID strings and legacy int IDs

## Environment Variables

### Required

| Variable           | Description                   | Default            |
| ------------------ | ----------------------------- | ------------------ |
| `SSO_CONSOLE_URL`  | Omnify Console URL            | `http://auth.test` |
| `SSO_SERVICE_SLUG` | Service identifier in Console | `boilerplate`      |

> **Note:** No `SSO_CLIENT_ID` or `SSO_CLIENT_SECRET` needed. Console manages these per-organization via ServiceInstance.

### Optional

| Variable              | Description           | Default           |
| --------------------- | --------------------- | ----------------- |
| `SSO_CONSOLE_TIMEOUT` | API timeout (seconds) | `10`              |
| `SSO_CONSOLE_RETRY`   | API retry attempts    | `2`               |
| `SSO_CALLBACK_URL`    | Callback path         | `/sso/callback`   |
| `SSO_USER_MODEL`      | User model class      | `App\Models\User` |

### Cache TTLs

| Variable                         | Description                | Default |
| -------------------------------- | -------------------------- | ------- |
| `SSO_JWKS_CACHE_TTL`             | JWKS cache (minutes)       | `60`    |
| `SSO_ORG_ACCESS_CACHE_TTL`       | Org access cache (seconds) | `300`   |
| `SSO_USER_TEAMS_CACHE_TTL`       | User teams cache (seconds) | `300`   |
| `SSO_ROLE_PERMISSIONS_CACHE_TTL` | Role permissions (seconds) | `3600`  |
| `SSO_TEAM_PERMISSIONS_CACHE_TTL` | Team permissions (seconds) | `3600`  |

### Security

| Variable                      | Description                              | Default |
| ----------------------------- | ---------------------------------------- | ------- |
| `SSO_ALLOWED_REDIRECT_HOSTS`  | Allowed redirect hosts (comma-separated) | `''`    |
| `SSO_REQUIRE_HTTPS_REDIRECTS` | Require HTTPS for redirects              | `true`  |

### Logging

| Variable              | Description        | Default |
| --------------------- | ------------------ | ------- |
| `SSO_LOGGING_ENABLED` | Enable SSO logging | `true`  |
| `SSO_LOG_CHANNEL`     | Log channel name   | `sso`   |
| `SSO_LOG_LEVEL`       | Log level          | `debug` |

### Localization

| Variable             | Description                 | Default |
| -------------------- | --------------------------- | ------- |
| `SSO_LOCALE_ENABLED` | Send Accept-Language header | `true`  |

## Full Configuration File

```php
<?php
// config/sso-client.php

return [
    /*
    |--------------------------------------------------------------------------
    | Console Configuration
    |--------------------------------------------------------------------------
    */
    'console' => [
        'url' => env('SSO_CONSOLE_URL', 'http://auth.test'),
        'timeout' => env('SSO_CONSOLE_TIMEOUT', 10),
        'retry' => env('SSO_CONSOLE_RETRY', 2),
    ],

    /*
    |--------------------------------------------------------------------------
    | Service Configuration
    |--------------------------------------------------------------------------
    */
    'service' => [
        'slug' => env('SSO_SERVICE_SLUG', 'boilerplate'),
        'callback_url' => env('SSO_CALLBACK_URL', '/sso/callback'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Cache Configuration
    |--------------------------------------------------------------------------
    */
    'cache' => [
        'jwks_ttl' => env('SSO_JWKS_CACHE_TTL', 60),
        'org_access_ttl' => env('SSO_ORG_ACCESS_CACHE_TTL', 300),
        'user_teams_ttl' => env('SSO_USER_TEAMS_CACHE_TTL', 300),
        'role_permissions_ttl' => env('SSO_ROLE_PERMISSIONS_CACHE_TTL', 3600),
        'team_permissions_ttl' => env('SSO_TEAM_PERMISSIONS_CACHE_TTL', 3600),
    ],

    /*
    |--------------------------------------------------------------------------
    | Role Levels
    |--------------------------------------------------------------------------
    |
    | Higher level = more permissions in hierarchy.
    */
    'role_levels' => [
        'admin' => 100,
        'manager' => 50,
        'member' => 10,
    ],

    /*
    |--------------------------------------------------------------------------
    | Routes Configuration
    |--------------------------------------------------------------------------
    */
    'routes' => [
        'prefix' => 'api/sso',
        'admin_prefix' => 'api/admin/sso',
        'middleware' => [
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
            'api',
        ],
        'admin_middleware' => ['api', 'sso.auth', 'sso.org', 'sso.role:admin'],
    ],

    /*
    |--------------------------------------------------------------------------
    | User Model
    |--------------------------------------------------------------------------
    */
    'user_model' => env('SSO_USER_MODEL', \App\Models\User::class),

    /*
    |--------------------------------------------------------------------------
    | Locale
    |--------------------------------------------------------------------------
    */
    'locale' => [
        'enabled' => env('SSO_LOCALE_ENABLED', true),
        'header' => 'Accept-Language',
    ],

    /*
    |--------------------------------------------------------------------------
    | Security Configuration
    |--------------------------------------------------------------------------
    */
    'security' => [
        'allowed_redirect_hosts' => array_filter(
            explode(',', env('SSO_ALLOWED_REDIRECT_HOSTS', ''))
        ),
        'require_https_redirects' => env('SSO_REQUIRE_HTTPS_REDIRECTS', true),
        'max_redirect_url_length' => 2048,
    ],

    /*
    |--------------------------------------------------------------------------
    | Logging Configuration
    |--------------------------------------------------------------------------
    */
    'logging' => [
        'enabled' => env('SSO_LOGGING_ENABLED', true),
        'channel' => env('SSO_LOG_CHANNEL', 'sso'),
        'level' => env('SSO_LOG_LEVEL', 'debug'),
    ],
];
```

## Custom Route Configuration

### Change Route Prefix

```php
// config/sso-client.php
'routes' => [
    'prefix' => 'api/v1/auth',           // /api/v1/auth/callback, etc.
    'admin_prefix' => 'api/v1/admin',    // /api/v1/admin/roles, etc.
],
```

### Custom Middleware

```php
'routes' => [
    'middleware' => [
        \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
        'api',
        'throttle:60,1', // Add rate limiting
    ],
    'admin_middleware' => [
        'api',
        'sso.auth',
        'sso.org',
        'sso.role:admin',
        'log.admin.actions', // Custom logging
    ],
],
```

## Role Hierarchy

Configure role levels for hierarchical access:

```php
'role_levels' => [
    'super_admin' => 1000,  // Can do everything
    'admin' => 100,         // Administrative access
    'manager' => 50,        // Management access
    'editor' => 30,         // Content editing
    'viewer' => 10,         // Read-only access
],
```

Usage:

```php
// User with 'admin' role (level 100) can access routes requiring 'manager' (level 50)
Route::middleware('sso.role:manager')->group(function () {
    // Accessible by manager, admin, super_admin
});
```

## Security Configuration

### Allowed Redirect Hosts

Prevent open redirect attacks:

```env
# Allow specific domains
SSO_ALLOWED_REDIRECT_HOSTS=myapp.com,api.myapp.com

# Allow wildcards (subdomains)
SSO_ALLOWED_REDIRECT_HOSTS=*.myapp.com,myapp.com
```

### HTTPS Requirements

```env
# Production - require HTTPS
SSO_REQUIRE_HTTPS_REDIRECTS=true

# Development - allow HTTP
SSO_REQUIRE_HTTPS_REDIRECTS=false
```
