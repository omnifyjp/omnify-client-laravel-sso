# Omnify SSO Client Laravel Package

## Overview

**Package Name:** `omnifyjp/omnify-client-laravel-sso`

**Purpose:** Laravel package cung cấp Single Sign-On (SSO) integration với Omnify Console, bao gồm Role-Based Access Control (RBAC), team permissions, và các tính năng bảo mật toàn diện.

**Requirements:**
- PHP 8.2+
- Laravel 11.0+ hoặc 12.0+

---

## Key Features

| Feature | Description |
|---------|-------------|
| JWT-Based SSO | Xác thực an toàn qua token exchange với Omnify Console |
| UUID Primary Keys | Tất cả models sử dụng UUID để tương thích với Console |
| Role-Based Access Control | Quản lý role và permission linh hoạt |
| Team Permissions | Quản lý permission cấp team qua Console API |
| Minimal Schema | Chỉ lưu Console references, fetch data từ Console API |
| Security Features | Open redirect protection, encrypted tokens, rate limiting |
| Audit Logging | SSO log channel riêng cho security events |
| Multi-language | Hỗ trợ i18n (ja, en, vi) |
| Omnify Schema-Driven | Auto-generated models qua Omnify |

---

## Architecture

### ServiceInstance Model

```
Console (SSO Provider)          Your Service (SSO Client)
├─ Users (UUID)                 └─ users
├─ Organizations (UUID)            ├─ console_user_id (UUID)
├─ Teams (UUID)                    ├─ console_access_token (encrypted)
├─ Branches (UUID)                 ├─ console_refresh_token (encrypted)
└─ Service: "your-service"         │
   └─ ServiceInstance (per-org)   └─ teams, branches, role_permissions
      ├─ client_id                  (references to Console data)
      └─ client_secret
```

**Design Philosophy:** Package chỉ lưu Console reference IDs. Full user/team/branch data được fetch từ Console API khi cần, đảm bảo data consistency.

---

## Directory Structure

```
omnify-client-laravel-sso/
├── config/
│   └── sso-client.php              # Package configuration
├── database/
│   ├── factories/                  # Model factories for testing
│   │   ├── UserFactory.php
│   │   ├── RoleFactory.php
│   │   ├── PermissionFactory.php
│   │   ├── TeamFactory.php
│   │   ├── BranchFactory.php
│   │   ├── RolePermissionFactory.php
│   │   └── TeamPermissionFactory.php
│   ├── migrations/
│   │   └── 0001_01_01_000001_create_sso_tables.php
│   └── schemas/Sso/                # Omnify YAML schemas
│       ├── User.yaml
│       ├── Role.yaml
│       ├── Permission.yaml
│       ├── RolePermission.yaml
│       ├── Team.yaml
│       ├── Branch.yaml
│       └── TeamPermission.yaml
├── src/
│   ├── Cache/                      # Caching layer
│   │   ├── RolePermissionCache.php
│   │   ├── TeamPermissionCache.php
│   │   └── ConsoleTeamsCache.php
│   ├── Composer/
│   │   └── OmnifyDiscoveryPlugin.php
│   ├── Console/Commands/
│   │   ├── SsoInstallCommand.php
│   │   ├── SsoSyncPermissionsCommand.php
│   │   └── SsoCleanupOrphanTeamsCommand.php
│   ├── Exceptions/
│   │   ├── ConsoleApiException.php
│   │   ├── ConsoleAuthException.php
│   │   ├── ConsoleAccessDeniedException.php
│   │   ├── ConsoleNotFoundException.php
│   │   └── ConsoleServerException.php
│   ├── Facades/
│   │   └── SsoClient.php
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── SsoCallbackController.php
│   │   │   ├── SsoReadOnlyController.php
│   │   │   ├── SsoTokenController.php
│   │   │   ├── SsoBranchController.php
│   │   │   └── Admin/
│   │   │       ├── RoleAdminController.php
│   │   │       ├── PermissionAdminController.php
│   │   │       └── TeamPermissionAdminController.php
│   │   └── Middleware/
│   │       ├── SsoAuthenticate.php
│   │       ├── SsoOrganizationAccess.php
│   │       ├── SsoPermissionCheck.php
│   │       └── SsoRoleCheck.php
│   ├── Models/
│   │   ├── User.php
│   │   ├── Role.php
│   │   ├── Permission.php
│   │   ├── RolePermission.php
│   │   ├── Team.php
│   │   ├── TeamPermission.php
│   │   ├── Branch.php
│   │   ├── Traits/
│   │   │   ├── HasConsoleSso.php
│   │   │   └── HasTeamPermissions.php
│   │   └── OmnifyBase/             # Auto-generated
│   ├── Services/
│   │   ├── ConsoleApiService.php
│   │   ├── ConsoleTokenService.php
│   │   ├── JwksService.php
│   │   ├── JwtVerifier.php
│   │   └── OrgAccessService.php
│   ├── Support/
│   │   ├── RedirectUrlValidator.php
│   │   └── SsoLogger.php
│   └── Providers/
│       └── SsoClientServiceProvider.php
├── routes/
│   └── sso.php
└── tests/
```

---

## Database Schema

Tất cả tables sử dụng UUID primary keys để tương thích với Console.

### Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | SSO users | id (UUID), console_user_id, console_access_token, console_refresh_token |
| `roles` | Local roles | id (UUID), name, slug, level, description |
| `permissions` | Local permissions | id (UUID), name, slug, group |
| `role_permissions` | Role-Permission pivot | role_id, permission_id (composite PK) |
| `role_user` | User-Role pivot | role_id, user_id (composite PK) |
| `teams` | Console team refs | id (UUID), console_team_id, console_org_id, name |
| `branches` | Console branch refs | id (UUID), console_branch_id, console_org_id, code, name |
| `team_permissions` | Team-level permissions | id (UUID), console_team_id, console_org_id, permission_id |

### Entity Relationship Diagram

```
┌─────────┐       ┌──────────────────┐       ┌─────────────┐
│  User   │───M:M─│    role_user     │───M:M─│    Role     │
│  (UUID) │       │ (composite PK)   │       │   (UUID)    │
└─────────┘       └──────────────────┘       └──────┬──────┘
     │                                              │
     │                                              │ M:M
     │                                              │
     │            ┌──────────────────┐       ┌──────┴──────┐
     │            │ role_permissions │───────│ Permission  │
     │            │ (composite PK)   │       │   (UUID)    │
     │            └──────────────────┘       └──────┬──────┘
     │                                              │
     │                                              │ 1:M
     │                                              │
┌────┴────┐       ┌──────────────────┐       ┌──────┴──────┐
│  Team   │───────│ team_permissions │───────│TeamPermission│
│  (UUID) │       │    (UUID)        │       │   (UUID)    │
└─────────┘       └──────────────────┘       └─────────────┘

┌─────────┐
│ Branch  │  (standalone reference)
│  (UUID) │
└─────────┘
```

---

## Models & Relationships

### User Model

```php
class User extends UserBaseModel implements AuthenticatableContract, AuthorizableContract
{
    use HasConsoleSso, HasTeamPermissions, HasApiTokens, HasFactory;

    protected $hidden = [
        'console_access_token',
        'console_refresh_token',
    ];

    // Relations
    public function roles(): BelongsToMany;

    // Methods
    public function hasPermission(string $permission): bool;
    public function hasAnyPermission(array $permissions): bool;
    public function hasAllPermissions(array $permissions): bool;
}
```

### Role Model

```php
class Role extends RoleBaseModel
{
    // Relations
    public function permissions(): BelongsToMany;
    public function users(): BelongsToMany;

    // Methods
    public function hasPermission(string $permission): bool;
}
```

**Role Hierarchy Levels:**

| Role | Level |
|------|-------|
| admin | 100 |
| manager | 50 |
| member | 10 |

### Permission Model

```php
class Permission extends PermissionBaseModel
{
    // Fields: name, slug, group

    // Relations
    public function roles(): BelongsToMany;
    public function team_permissions(): HasMany;
}
```

### Team Model (Console Reference)

```php
class Team extends TeamBaseModel
{
    // Console Fields: console_team_id, console_org_id

    // Relations
    public function permissions(): BelongsToMany;

    // Methods
    public function hasPermission(string $permission): bool;
}
```

### Branch Model (Console Reference)

```php
class Branch extends BranchBaseModel
{
    // Console Fields: console_branch_id, console_org_id, code
    // No direct Laravel relations (reference only)
}
```

---

## Services

### ConsoleApiService

HTTP client cho Omnify Console API.

```php
class ConsoleApiService
{
    // Token Operations
    public function exchangeCode(string $code): array;
    public function refreshToken(string $refreshToken): array;
    public function revokeToken(string $refreshToken): void;

    // Access Operations
    public function getAccess(string $token, string $orgSlug): array;
    public function getOrganizations(string $token): array;
    public function getUserTeams(string $token, string $orgSlug): array;
    public function getUserBranches(string $token, string $orgSlug): array;

    // JWKS
    public function getJwks(): array;
}
```

### ConsoleTokenService

Token lifecycle management.

```php
class ConsoleTokenService
{
    public function getAccessToken(User $user): string;     // Auto-refresh if needed
    public function refreshIfNeeded(User $user): void;      // Refresh 5min before expiry
    public function refresh(User $user): void;              // Force refresh
    public function revokeTokens(User $user): void;         // Clear tokens on logout
    public function storeTokens(User $user, array $tokens): void;  // Store encrypted
}
```

### JwtVerifier

JWT signature verification.

```php
class JwtVerifier
{
    public function verify(string $token): array;  // Returns claims
    public function getClaims(string $token): array;  // Extract without verify
}
```

### JwksService

Fetch và cache JWKS.

```php
class JwksService
{
    public function getJwks(): array;            // 60-min cache
    public function getPublicKey(string $kid): string;  // Get by key ID
    public function clearCache(): void;
}
```

### OrgAccessService

Organization access checking.

```php
class OrgAccessService
{
    public function checkAccess(User $user, string $orgSlug): bool;  // Cached 300s
    public function getOrganizations(User $user): array;
    public function getUserTeams(User $user, string $orgSlug): array;  // Cached 300s
}
```

---

## Middleware

### SsoAuthenticate

```php
// Usage
Route::middleware('sso.auth')->group(function () {
    // Protected routes
});
// Returns 401 if not authenticated
```

### SsoOrganizationAccess

```php
// Usage - Requires X-Org-Id header
Route::middleware('sso.org')->group(function () {
    // Requires organization context
});
// Returns 400 if missing header, 403 if no access
```

### SsoPermissionCheck

```php
// Usage - OR logic (user needs ANY permission)
Route::middleware('sso.permission:users.create|users.update')->group(function () {
    // Protected routes
});
// Returns 403 if no permission
```

### SsoRoleCheck

```php
// Usage - Hierarchy-based check
Route::middleware('sso.role:admin')->group(function () {
    // Admin only routes
});
// Returns 403 if insufficient level
```

---

## Controllers

### SsoCallbackController

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sso/callback` | POST | Handle SSO callback, exchange code |
| `/api/sso/logout` | POST | Logout user, revoke tokens |
| `/api/sso/user` | GET | Get authenticated user & organizations |
| `/api/sso/global-logout-url` | GET | Get Console logout URL |

### SsoReadOnlyController

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sso/roles` | GET | List all roles |
| `/api/sso/roles/{id}` | GET | Get role with permissions |
| `/api/sso/permissions` | GET | List permissions (with filtering) |
| `/api/sso/permission-matrix` | GET | Role-permission matrix |

### SsoTokenController

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sso/tokens` | GET | List user's API tokens |
| `/api/sso/tokens/{tokenId}` | DELETE | Revoke specific token |
| `/api/sso/tokens/revoke-others` | POST | Revoke all other tokens |

### SsoBranchController

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sso/branches` | GET | Get user's branches in organization |

### Admin Controllers

Require middleware: `sso.auth`, `sso.org`, `sso.role:admin`

**RoleAdminController:** CRUD for roles, sync role permissions

**PermissionAdminController:** CRUD for permissions

**TeamPermissionAdminController:** Manage team-level permissions

---

## API Routes

### Public Routes

```
POST   /api/sso/callback     # SSO callback
```

### Authenticated Routes (sso.auth)

```
POST   /api/sso/logout
GET    /api/sso/user
GET    /api/sso/global-logout-url
GET    /api/sso/tokens
DELETE /api/sso/tokens/{tokenId}
POST   /api/sso/tokens/revoke-others
GET    /api/sso/roles
GET    /api/sso/roles/{id}
GET    /api/sso/permissions
GET    /api/sso/permission-matrix
GET    /api/sso/branches
```

### Admin Routes (sso.auth + sso.org + sso.role:admin)

```
GET    /api/admin/sso/roles
POST   /api/admin/sso/roles
GET    /api/admin/sso/roles/{id}
PUT    /api/admin/sso/roles/{id}
DELETE /api/admin/sso/roles/{id}
GET    /api/admin/sso/roles/{role}/permissions
PUT    /api/admin/sso/roles/{role}/permissions
GET    /api/admin/sso/permissions
POST   /api/admin/sso/permissions
GET    /api/admin/sso/permissions/{id}
PUT    /api/admin/sso/permissions/{id}
DELETE /api/admin/sso/permissions/{id}
GET    /api/admin/sso/permission-matrix
GET    /api/admin/sso/team-permissions
POST   /api/admin/sso/team-permissions
DELETE /api/admin/sso/team-permissions/{id}
```

---

## SSO Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SSO AUTHENTICATION FLOW                       │
└─────────────────────────────────────────────────────────────────────┘

1. Frontend: Redirect to Console login
   → https://console.omnify.jp/sso/authorize?
     service={service_slug}&redirect_uri={callback_url}

2. Console: User authenticates

3. Console: Redirect back with code
   → https://your-app.com/sso/callback?code={authorization_code}

4. Frontend: Send code to API
   POST /api/sso/callback
   { "code": "authorization_code", "device_name": "optional" }

5. Backend: Exchange code for tokens
   → ConsoleApiService.exchangeCode(code)

6. Backend: Verify JWT signature
   → JwtVerifier.verify(access_token)

7. Backend: Extract user claims
   → { sub: user_id, email, name }

8. Backend: Create/update user
   → User.find_or_create(console_user_id)

9. Backend: Store Console tokens (encrypted)
   → ConsoleTokenService.storeTokens()

10. Backend: Return auth response
    {
      user: { id, console_user_id, email, name },
      organizations: [...],
      token: "api_token_for_mobile"  // optional
    }

11. Frontend: Store session (web) or API token (mobile)

12. Subsequent requests: Include auth header or session cookie
```

---

## Caching Strategy

| Cache | Key Pattern | TTL | Description |
|-------|-------------|-----|-------------|
| Role Permissions | `sso:role_permissions:{roleSlug}` | 3600s | Permission slugs per role |
| Team Permissions | `sso:team_permissions:{orgId}` | 3600s | Permission slugs per team |
| User Teams | `sso:user_teams:{userId}:{orgId}` | 300s | User's teams in org |
| Organization Access | `sso:org_access:{userId}:{orgSlug}` | 300s | Org access validation |
| JWKS | `sso:jwks` | 3600s | JSON Web Key Set |

---

## Security Features

### 1. Token Encryption

```php
// HasConsoleSso trait - Tokens encrypted at rest
protected function getConsoleAccessTokenAttribute($value): ?string
{
    return $value ? Crypt::decryptString($value) : null;
}
```

### 2. Open Redirect Protection

```php
// RedirectUrlValidator validates against allowed_redirect_hosts config
// Enforces HTTPS if configured
```

### 3. JWT Verification

- RSA SHA-256 signature verification
- 5-minute clock skew tolerance
- Key ID (kid) header validation
- Automatic JWKS refresh on key rotation

### 4. Audit Logging

```php
sso_log('info', 'User authenticated', ['user_id' => $user->id]);
// Configurable channel and level
```

---

## Configuration

### Environment Variables

```env
# Required
SSO_CONSOLE_URL=https://console.omnify.jp
SSO_SERVICE_SLUG=your-service-slug

# Optional
SSO_CONSOLE_TIMEOUT=10
SSO_CONSOLE_RETRY=2
SSO_CALLBACK_URL=/sso/callback

# Cache TTLs (seconds)
SSO_JWKS_CACHE_TTL=3600
SSO_ORG_ACCESS_CACHE_TTL=300
SSO_USER_TEAMS_CACHE_TTL=300
SSO_ROLE_PERMISSIONS_CACHE_TTL=3600
SSO_TEAM_PERMISSIONS_CACHE_TTL=3600

# Security
SSO_ALLOWED_REDIRECT_HOSTS=your-app.com,*.your-domain.com
SSO_REQUIRE_HTTPS_REDIRECTS=true

# Logging
SSO_LOGGING_ENABLED=true
SSO_LOG_CHANNEL=sso
SSO_LOG_LEVEL=debug
```

---

## Artisan Commands

| Command | Description |
|---------|-------------|
| `php artisan sso:install` | Setup wizard for initial installation |
| `php artisan sso:sync-permissions` | Sync permissions from config into database |
| `php artisan sso:cleanup-orphan-teams` | Remove team permissions for deleted Console teams |

---

## Testing

### Available Factories

```php
User::factory()->create(['console_user_id' => Str::uuid()]);
Role::factory()->admin()->create();
Role::factory()->manager()->create();
Permission::factory()->create(['slug' => 'users.create', 'group' => 'users']);
Team::factory()->create(['console_team_id' => Str::uuid()]);
```

---

## Integration Example

### Frontend (SPA)

```typescript
// 1. Redirect to Console login
const loginUrl = `${CONSOLE_URL}/sso/authorize?` +
  `service=${SERVICE_SLUG}&` +
  `redirect_uri=${encodeURIComponent(window.location.origin + '/sso/callback')}`;
window.location.href = loginUrl;

// 2. Handle callback
const response = await fetch('/api/sso/callback', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code }),
});
const { user, organizations } = await response.json();
```

### Backend (Laravel Routes)

```php
Route::middleware(['sso.auth', 'sso.org'])->group(function () {
    Route::get('/users', [UserController::class, 'index']);

    Route::middleware('sso.permission:users.create')->group(function () {
        Route::post('/users', [UserController::class, 'store']);
    });

    Route::middleware('sso.role:admin')->group(function () {
        Route::delete('/users/{user}', [UserController::class, 'destroy']);
    });
});
```

---

## Exceptions

| Exception | HTTP Status | Description |
|-----------|-------------|-------------|
| `ConsoleApiException` | 500 | Generic API error |
| `ConsoleAuthException` | 401 | Authentication failure |
| `ConsoleAccessDeniedException` | 403 | Authorization failure |
| `ConsoleNotFoundException` | 404 | Resource not found |
| `ConsoleServerException` | 500+ | Server error |

---

## Summary

Package này là giải pháp SSO client production-ready cho Laravel, tích hợp với Omnify Console:

- **Secure authentication** qua JWT tokens với JWKS verification
- **Flexible authorization** qua local RBAC và Console team permissions
- **Minimal data duplication** (chỉ lưu Console references)
- **Comprehensive caching** cho performance
- **Full audit logging** cho compliance
- **Multi-language support** cho global applications
- **Security hardened** với open redirect protection, encrypted tokens
