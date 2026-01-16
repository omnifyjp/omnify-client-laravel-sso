<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Console Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for connecting to the Omnify Console SSO Provider.
    |
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
    |
    | The service slug registered in Console for this application.
    |
    */
    'service' => [
        'slug' => env('SSO_SERVICE_SLUG', 'boilerplate'),
        'callback_url' => env('SSO_CALLBACK_URL', '/sso/callback'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Cache Configuration
    |--------------------------------------------------------------------------
    |
    | Cache TTL settings for various SSO data.
    |
    */
    'cache' => [
        // JWKS cache TTL in minutes
        'jwks_ttl' => env('SSO_JWKS_CACHE_TTL', 60),

        // Organization access cache TTL in seconds
        'org_access_ttl' => env('SSO_ORG_ACCESS_CACHE_TTL', 300),

        // User teams cache TTL in seconds
        'user_teams_ttl' => env('SSO_USER_TEAMS_CACHE_TTL', 300),

        // Role permissions cache TTL in seconds
        'role_permissions_ttl' => env('SSO_ROLE_PERMISSIONS_CACHE_TTL', 3600),

        // Team permissions cache TTL in seconds
        'team_permissions_ttl' => env('SSO_TEAM_PERMISSIONS_CACHE_TTL', 3600),
    ],

    /*
    |--------------------------------------------------------------------------
    | Role Levels
    |--------------------------------------------------------------------------
    |
    | Role level hierarchy for role-based access control.
    | Higher level = more permissions.
    |
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
    |
    | Configuration for package routes.
    |
    */
    'routes' => [
        // Route prefix for SSO routes
        'prefix' => 'api/sso',

        // Route prefix for admin routes
        'admin_prefix' => 'api/admin/sso',

        // Middleware for SSO routes (Sanctum SPA認証用)
        'middleware' => [
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
            'api',
        ],

        // Middleware for admin routes (Sanctum SPA認証用)
        'admin_middleware' => [
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
            'api',
            'sso.auth',
            'sso.org',
            'sso.role:admin',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | User Model
    |--------------------------------------------------------------------------
    |
    | The user model class that implements HasConsoleSso trait.
    |
    */
    'user_model' => env('SSO_USER_MODEL', \App\Models\User::class),

    /*
    |--------------------------------------------------------------------------
    | Locale
    |--------------------------------------------------------------------------
    |
    | Send Accept-Language header to Console for localized responses.
    |
    */
    'locale' => [
        'enabled' => env('SSO_LOCALE_ENABLED', true),
        'header' => 'Accept-Language',
    ],

    /*
    |--------------------------------------------------------------------------
    | Security Configuration
    |--------------------------------------------------------------------------
    |
    | Security settings to prevent common vulnerabilities.
    |
    */
    'security' => [
        // Allowed hosts for redirect URLs (prevents Open Redirect attacks)
        // Supports wildcards like *.example.com
        'allowed_redirect_hosts' => array_filter(explode(',', env('SSO_ALLOWED_REDIRECT_HOSTS', ''))),

        // Whether to enforce HTTPS for redirect URLs
        'require_https_redirects' => env('SSO_REQUIRE_HTTPS_REDIRECTS', true),

        // Maximum length for redirect URLs
        'max_redirect_url_length' => 2048,
    ],

    /*
    |--------------------------------------------------------------------------
    | Logging Configuration
    |--------------------------------------------------------------------------
    |
    | Configure logging for SSO events. Useful for debugging and auditing.
    |
    */
    'logging' => [
        // Enable/disable SSO logging
        'enabled' => env('SSO_LOGGING_ENABLED', true),

        // Log channel to use (creates 'sso' channel if configured)
        // Falls back to default channel if 'sso' channel doesn't exist
        'channel' => env('SSO_LOG_CHANNEL', 'sso'),

        // Log level for SSO events
        'level' => env('SSO_LOG_LEVEL', 'debug'),
    ],
];
