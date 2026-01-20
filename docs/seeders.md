# Database Seeders

This package provides reusable seeders and traits for managing roles, permissions, and user assignments in your Laravel application.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [SsoRolesSeeder](#ssorolesseeder)
- [Traits](#traits)
  - [FetchesConsoleData](#fetchesconsoledata)
  - [AssignsRoles](#assignsroles)
- [Customization](#customization)
- [Examples](#examples)

---

## Overview

The seeder system consists of:

| Component                  | Purpose                                             |
| -------------------------- | --------------------------------------------------- |
| `SsoRolesSeeder`           | Creates default roles and service-admin permissions |
| `FetchesConsoleData` trait | Fetches organization/branch data from SSO Console   |
| `AssignsRoles` trait       | Assigns roles to users with scope support           |

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Your App's Seeder                         │
│              (e.g., PermissionSeeder.php)                    │
├─────────────────────────────────────────────────────────────┤
│  - App-specific permissions (app.reports.*, app.orders.*)   │
│  - Test user role assignments                                │
│  - Uses traits from package                                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ calls
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                Package: SsoRolesSeeder                       │
├─────────────────────────────────────────────────────────────┤
│  - Default roles (admin, manager, supervisor, member, viewer)│
│  - Service-admin permissions (service-admin.role.*, etc.)   │
│  - Dashboard permissions                                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ uses
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Traits                                  │
├─────────────────────────────────────────────────────────────┤
│  FetchesConsoleData  │  AssignsRoles                        │
│  - fetchOrgData...   │  - assignRoleToUser                  │
│  - getBranchId       │  - assignRoleToUserByEmail           │
│  - logInfo/logWarning│  - removeUserRolesInScope            │
└─────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### 1. Call the package seeder in your DatabaseSeeder

```php
// database/seeders/DatabaseSeeder.php

use Omnify\SsoClient\Database\Seeders\SsoRolesSeeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Creates default roles and service-admin permissions
        $this->call(SsoRolesSeeder::class);
        
        // Your app-specific seeders
        $this->call(PermissionSeeder::class);
    }
}
```

### 2. Create app-specific seeder using traits

```php
// database/seeders/PermissionSeeder.php

use Illuminate\Database\Seeder;
use Omnify\SsoClient\Database\Seeders\Concerns\AssignsRoles;
use Omnify\SsoClient\Database\Seeders\Concerns\FetchesConsoleData;
use Omnify\SsoClient\Models\Permission;
use Omnify\SsoClient\Models\Role;

class PermissionSeeder extends Seeder
{
    use FetchesConsoleData, AssignsRoles;

    public function run(): void
    {
        $this->createAppPermissions();
        $this->assignRolesToTestUsers();
    }

    protected function createAppPermissions(): void
    {
        // Your app-specific permissions
        Permission::updateOrCreate(
            ['slug' => 'app.orders.view'],
            ['name' => 'View Orders', 'group' => 'app.orders']
        );
    }

    protected function assignRolesToTestUsers(): void
    {
        $orgData = $this->fetchOrgDataFromConsole('your-org-slug');
        
        if ($orgData) {
            $this->assignRoleToUserByEmail(
                'admin@example.com',
                'admin',
                $orgData['org_id']
            );
        }
    }
}
```

### 3. Run the seeder

```bash
php artisan db:seed
# or
php artisan db:seed --class=PermissionSeeder
```

---

## SsoRolesSeeder

The `SsoRolesSeeder` creates a standard set of roles and permissions for service administration.

### Default Roles

| Role          | Slug         | Level | Description                              |
| ------------- | ------------ | ----- | ---------------------------------------- |
| Administrator | `admin`      | 100   | Full access to all features              |
| Manager       | `manager`    | 50    | Can manage users, teams and view reports |
| Supervisor    | `supervisor` | 30    | Can view and approve team activities     |
| Member        | `member`     | 10    | Basic access for regular users           |
| Viewer        | `viewer`     | 5     | Read-only access to dashboards           |

### Default Permissions

```
service-admin.role.*        # Role management (view, create, edit, delete, sync-permissions)
service-admin.permission.*  # Permission management
service-admin.user.*        # User management (view, create, edit, delete, assign-roles)
service-admin.team.*        # Team management
dashboard.*                 # Dashboard access (view, analytics)
```

### Permission Assignment Matrix

| Permission             | Admin | Manager | Supervisor | Member | Viewer |
| ---------------------- | :---: | :-----: | :--------: | :----: | :----: |
| All permissions        |   ✅   |         |            |        |        |
| service-admin.*.view   |   ✅   |    ✅    |     ✅      |   ✅    |        |
| service-admin.*.create |   ✅   |    ✅    |            |        |        |
| service-admin.*.edit   |   ✅   |    ✅    |     ✅      |        |        |
| service-admin.*.delete |   ✅   |         |            |        |        |
| dashboard.view         |   ✅   |    ✅    |     ✅      |   ✅    |   ✅    |
| dashboard.analytics    |   ✅   |    ✅    |     ✅      |        |        |

### Usage

```php
use Omnify\SsoClient\Database\Seeders\SsoRolesSeeder;

// In your DatabaseSeeder
$this->call(SsoRolesSeeder::class);
```

### Extending SsoRolesSeeder

You can extend the seeder to customize roles or permissions:

```php
use Omnify\SsoClient\Database\Seeders\SsoRolesSeeder;

class CustomRolesSeeder extends SsoRolesSeeder
{
    protected function getDefaultRoles(): array
    {
        $roles = parent::getDefaultRoles();
        
        // Add custom role
        $roles[] = [
            'slug' => 'auditor',
            'name' => 'Auditor',
            'description' => 'Can view audit logs',
            'level' => 20,
        ];
        
        return $roles;
    }

    protected function getDefaultPermissions(): array
    {
        $permissions = parent::getDefaultPermissions();
        
        // Add custom permissions
        $permissions[] = ['slug' => 'audit.view', 'group' => 'audit'];
        $permissions[] = ['slug' => 'audit.export', 'group' => 'audit'];
        
        return $permissions;
    }
}
```

---

## Traits

### FetchesConsoleData

This trait provides methods to fetch organization and branch data from the SSO Console. Useful when you need to create scoped role assignments.

#### Methods

##### `fetchOrgDataFromConsole(string $orgSlug): ?array`

Fetches organization data from SSO Console. Tries API first, falls back to direct database query.

**Parameters:**
- `$orgSlug` - Organization slug (e.g., 'company-abc')

**Returns:**
```php
[
    'org_id' => 'uuid-string',
    'org_name' => 'Company ABC',
    'branches' => [
        'HQ' => 'branch-uuid-1',
        'TOKYO' => 'branch-uuid-2',
        'OSAKA' => 'branch-uuid-3',
    ],
]
// or null if not found
```

**Example:**
```php
use Omnify\SsoClient\Database\Seeders\Concerns\FetchesConsoleData;

class MySeeder extends Seeder
{
    use FetchesConsoleData;

    public function run(): void
    {
        $orgData = $this->fetchOrgDataFromConsole('company-abc');
        
        if ($orgData) {
            $this->command->info("Found org: {$orgData['org_name']}");
            $this->command->info("Branches: " . count($orgData['branches']));
        }
    }
}
```

##### `fetchOrgDataFromConsoleDb(string $orgSlug): ?array`

Direct database query fallback. Automatically tries common database names:
- `auth_omnify`
- `auth_omnify_db`
- `omnify_console`
- `console`

You can also set `SSO_CONSOLE_DATABASE` environment variable.

##### `getBranchId(array $orgData, string $branchCode): ?string`

Get a specific branch ID by its code.

```php
$orgData = $this->fetchOrgDataFromConsole('company-abc');
$tokyoBranchId = $this->getBranchId($orgData, 'TOKYO');
```

##### `logInfo(string $message): void`

Log info message (works in seeder context).

##### `logWarning(string $message): void`

Log warning message (works in seeder context).

---

### AssignsRoles

This trait provides methods to assign roles to users with optional scope (organization/branch).

#### Understanding Scopes

Role assignments can have different scopes:

| Scope           | org_id | branch_id | Description                          |
| --------------- | ------ | --------- | ------------------------------------ |
| Global          | `null` | `null`    | Role applies everywhere              |
| Org-wide        | `uuid` | `null`    | Role applies to all branches in org  |
| Branch-specific | `uuid` | `uuid`    | Role applies only to specific branch |

#### Methods

##### `assignRoleToUser(User $user, Role $role, ?string $orgId = null, ?string $branchId = null): void`

Assign a role to a user with optional scope.

**Parameters:**
- `$user` - User model instance
- `$role` - Role model instance
- `$orgId` - Console organization ID (null for global)
- `$branchId` - Console branch ID (null for org-wide)

**Example:**
```php
use Omnify\SsoClient\Database\Seeders\Concerns\AssignsRoles;
use Omnify\SsoClient\Models\Role;
use Omnify\SsoClient\Models\User;

class MySeeder extends Seeder
{
    use AssignsRoles;

    public function run(): void
    {
        $user = User::where('email', 'admin@example.com')->first();
        $adminRole = Role::where('slug', 'admin')->first();

        // Global assignment
        $this->assignRoleToUser($user, $adminRole);

        // Org-wide assignment
        $this->assignRoleToUser($user, $adminRole, $orgId);

        // Branch-specific assignment
        $this->assignRoleToUser($user, $adminRole, $orgId, $branchId);
    }
}
```

##### `assignRoleToUserByEmail(string $email, string $roleSlug, ?string $orgId = null, ?string $branchId = null): bool`

Convenience method to assign role by email and role slug.

**Returns:** `true` if successful, `false` if user or role not found.

```php
// Assign admin role to user globally
$this->assignRoleToUserByEmail('admin@example.com', 'admin');

// Assign manager role org-wide
$this->assignRoleToUserByEmail('manager@example.com', 'manager', $orgId);

// Assign member role to specific branch
$this->assignRoleToUserByEmail('staff@example.com', 'member', $orgId, $branchId);
```

##### `removeUserRolesInScope(User $user, ?string $orgId = null, ?string $branchId = null): int`

Remove all role assignments for a user in a specific scope.

**Returns:** Number of removed assignments.

```php
// Remove all global roles
$removed = $this->removeUserRolesInScope($user);

// Remove all org-wide roles
$removed = $this->removeUserRolesInScope($user, $orgId);

// Remove branch-specific roles
$removed = $this->removeUserRolesInScope($user, $orgId, $branchId);
```

---

## Customization

### Adding App-Specific Permissions

Create your own seeder that uses the package seeder as a base:

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Omnify\SsoClient\Database\Seeders\Concerns\AssignsRoles;
use Omnify\SsoClient\Database\Seeders\Concerns\FetchesConsoleData;
use Omnify\SsoClient\Database\Seeders\SsoRolesSeeder;
use Omnify\SsoClient\Models\Permission;
use Omnify\SsoClient\Models\Role;

class PermissionSeeder extends Seeder
{
    use FetchesConsoleData, AssignsRoles;

    public function run(): void
    {
        // 1. Run base seeder
        $this->call(SsoRolesSeeder::class);

        // 2. Create app-specific permissions
        $this->createAppPermissions();

        // 3. Assign to roles
        $this->assignAppPermissionsToRoles();
    }

    protected function createAppPermissions(): void
    {
        $permissions = [
            // Orders module
            ['slug' => 'app.orders.view', 'group' => 'app.orders'],
            ['slug' => 'app.orders.create', 'group' => 'app.orders'],
            ['slug' => 'app.orders.update', 'group' => 'app.orders'],
            ['slug' => 'app.orders.delete', 'group' => 'app.orders'],
            ['slug' => 'app.orders.export', 'group' => 'app.orders'],

            // Products module
            ['slug' => 'app.products.view', 'group' => 'app.products'],
            ['slug' => 'app.products.manage', 'group' => 'app.products'],

            // Reports module
            ['slug' => 'app.reports.view', 'group' => 'app.reports'],
            ['slug' => 'app.reports.export', 'group' => 'app.reports'],
        ];

        foreach ($permissions as $perm) {
            $name = ucwords(str_replace(['.', '_'], ' ', $perm['slug']));
            Permission::updateOrCreate(
                ['slug' => $perm['slug']],
                ['name' => $name, 'group' => $perm['group']]
            );
        }

        $this->logInfo('Created ' . count($permissions) . ' app permissions');
    }

    protected function assignAppPermissionsToRoles(): void
    {
        $admin = Role::where('slug', 'admin')->first();
        $manager = Role::where('slug', 'manager')->first();
        $member = Role::where('slug', 'member')->first();

        // Admin: all permissions
        if ($admin) {
            $admin->permissions()->sync(Permission::pluck('id'));
        }

        // Manager: all except delete
        if ($manager) {
            $managerPerms = Permission::where('slug', 'not like', '%.delete')->pluck('id');
            $manager->permissions()->sync($managerPerms);
        }

        // Member: view only
        if ($member) {
            $memberPerms = Permission::where('slug', 'like', '%.view')->pluck('id');
            $member->permissions()->sync($memberPerms);
        }
    }
}
```

### Environment Configuration

```env
# Optional: Specify Console database name
SSO_CONSOLE_DATABASE=auth_omnify

# Required: Console URL for API fallback
SSO_CONSOLE_URL=https://console.example.com
```

---

## Examples

### Example 1: Basic Setup

```php
// database/seeders/DatabaseSeeder.php
public function run(): void
{
    $this->call(\Omnify\SsoClient\Database\Seeders\SsoRolesSeeder::class);
}
```

### Example 2: With Test Users

```php
use Omnify\SsoClient\Database\Seeders\Concerns\AssignsRoles;
use Omnify\SsoClient\Database\Seeders\Concerns\FetchesConsoleData;

class TestUserSeeder extends Seeder
{
    use FetchesConsoleData, AssignsRoles;

    public function run(): void
    {
        $orgData = $this->fetchOrgDataFromConsole('test-company');

        // Create test users with different roles
        $this->assignRoleToUserByEmail('admin@test.com', 'admin', $orgData['org_id']);
        $this->assignRoleToUserByEmail('manager@test.com', 'manager', $orgData['org_id']);
        $this->assignRoleToUserByEmail('staff@test.com', 'member', $orgData['org_id']);

        // Branch-specific assignment
        $tokyoBranch = $this->getBranchId($orgData, 'TOKYO');
        $this->assignRoleToUserByEmail('tokyo-staff@test.com', 'member', $orgData['org_id'], $tokyoBranch);
    }
}
```

### Example 3: Multi-Branch Assignments

```php
public function run(): void
{
    $orgData = $this->fetchOrgDataFromConsole('multi-branch-corp');
    $user = User::where('email', 'regional-manager@test.com')->first();

    // Same user, different roles in different branches
    $adminRole = Role::where('slug', 'admin')->first();
    $managerRole = Role::where('slug', 'manager')->first();
    $memberRole = Role::where('slug', 'member')->first();

    // Admin at HQ
    $this->assignRoleToUser($user, $adminRole, $orgData['org_id'], $this->getBranchId($orgData, 'HQ'));

    // Manager at Tokyo
    $this->assignRoleToUser($user, $managerRole, $orgData['org_id'], $this->getBranchId($orgData, 'TOKYO'));

    // Member at Osaka
    $this->assignRoleToUser($user, $memberRole, $orgData['org_id'], $this->getBranchId($orgData, 'OSAKA'));
}
```

---

## Troubleshooting

### "Target class does not exist" error

Make sure you're importing from the correct namespace:

```php
// ✅ Correct
use Omnify\SsoClient\Database\Seeders\SsoRolesSeeder;

// ❌ Wrong (old location)
use Omnify\SsoClient\Database\Seeders\SsoRolesSeeder; // from database/seeders/
```

### "Could not fetch org data" warning

1. Check if SSO Console is running
2. Verify `SSO_CONSOLE_URL` in `.env`
3. Set `SSO_CONSOLE_DATABASE` if database name differs

### Permissions not appearing

Run the seeder with fresh migration:

```bash
php artisan migrate:fresh --seed
```

Or re-run specific seeder:

```bash
php artisan db:seed --class=PermissionSeeder
```
