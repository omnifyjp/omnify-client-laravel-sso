# Authorization Guide

## Overview

The SSO Client provides a flexible Role-Based Access Control (RBAC) system with:

- **Roles** - Named roles with hierarchical levels
- **Permissions** - Granular permissions assigned to roles
- **Team Permissions** - Organization-level permissions

## Models

### Role

```php
use Omnify\SsoClient\Models\Role;

// Create a role
$role = Role::create([
    'name' => 'Administrator',
    'slug' => 'admin',
    'description' => 'Full administrative access',
    'level' => 100,
]);

// Check permissions
$role->hasPermission('users.create');
$role->hasAnyPermission(['users.create', 'users.update']);
$role->hasAllPermissions(['users.create', 'users.update']);

// Get all permissions
$permissions = $role->permissions;
```

### Permission

```php
use Omnify\SsoClient\Models\Permission;

// Create a permission
$permission = Permission::create([
    'name' => 'Create Users',
    'slug' => 'users.create',
    'group' => 'users',
]);

// Get roles with this permission
$roles = $permission->roles;
```

### RolePermission (Pivot)

```php
use Omnify\SsoClient\Models\RolePermission;

// Assign permission to role
RolePermission::create([
    'role_id' => $role->id,
    'permission_id' => $permission->id,
]);

// Or use relationship
$role->permissions()->attach($permission->id);
$role->permissions()->sync([$perm1->id, $perm2->id, $perm3->id]);
```

## User Permissions

### Check User Permissions

```php
$user = auth()->user();

// Single permission
if ($user->hasPermission('users.create')) {
    // Can create users
}

// Any of the permissions
if ($user->hasAnyPermission(['users.create', 'users.update'])) {
    // Can create OR update
}

// All permissions required
if ($user->hasAllPermissions(['users.create', 'users.update', 'users.delete'])) {
    // Can do all three
}

// Check via role
if ($user->hasRole('admin')) {
    // User is an admin
}

// Check role level
if ($user->hasRoleLevel(50)) {
    // User's role level >= 50
}
```

### User Role Relationship

```php
// Get user's role
$role = $user->role;

// Get role name
$roleName = $user->role->name; // "Administrator"

// Get role level
$level = $user->role->level; // 100
```

## Laravel Gates Integration

The package automatically registers gates for all permissions:

```php
// In controllers
if (Gate::allows('users.create')) {
    // Authorized
}

if (Gate::denies('users.delete')) {
    abort(403);
}

// Using authorize helper
$this->authorize('users.update', $user);
```

### Blade Directives

```blade
@can('users.create')
    <button>Create User</button>
@endcan

@cannot('users.delete')
    <p>You cannot delete users</p>
@endcannot

@canany(['users.create', 'users.update'])
    <button>Manage Users</button>
@endcanany
```

## Team Permissions

For organization/team-level permissions:

```php
use Omnify\SsoClient\Models\Team;
use Omnify\SsoClient\Models\TeamPermission;

// Create team
$team = Team::create([
    'name' => 'Engineering',
    'console_team_id' => 123,
    'console_org_id' => 456,
]);

// Assign permission to team
TeamPermission::create([
    'console_team_id' => $team->console_team_id,
    'console_org_id' => $team->console_org_id,
    'permission_id' => $permission->id,
]);

// Check team permissions
$team->hasPermission('projects.create');
$team->hasAnyPermission(['projects.create', 'projects.update']);
$team->hasAllPermissions(['projects.create', 'projects.update']);
```

### User Team Permissions

```php
// User's teams from Console
$teams = $user->getTeams();

// Check if user's team has permission
if ($user->teamHasPermission('org-123', 'projects.create')) {
    // Team has permission
}
```

## Role Hierarchy

Roles have a `level` field for hierarchy:

```php
// config/sso-client.php
'role_levels' => [
    'super_admin' => 1000,
    'admin' => 100,
    'manager' => 50,
    'member' => 10,
],
```

```php
// Create roles with levels
Role::create(['name' => 'Super Admin', 'slug' => 'super_admin', 'level' => 1000]);
Role::create(['name' => 'Admin', 'slug' => 'admin', 'level' => 100]);
Role::create(['name' => 'Manager', 'slug' => 'manager', 'level' => 50]);
Role::create(['name' => 'Member', 'slug' => 'member', 'level' => 10]);

// Higher level roles can access lower level resources
$user->hasRoleLevel(50); // True if user's role level >= 50
```

## Permission Groups

Organize permissions by group:

```php
Permission::create(['name' => 'View Users', 'slug' => 'users.view', 'group' => 'users']);
Permission::create(['name' => 'Create Users', 'slug' => 'users.create', 'group' => 'users']);
Permission::create(['name' => 'View Posts', 'slug' => 'posts.view', 'group' => 'posts']);
Permission::create(['name' => 'Create Posts', 'slug' => 'posts.create', 'group' => 'posts']);

// Get permissions by group
$userPermissions = Permission::where('group', 'users')->get();
```

## Sync Permissions from Config

Define permissions in config and sync:

```php
// config/sso-client.php
'permissions' => [
    ['name' => 'View Users', 'slug' => 'users.view', 'group' => 'users'],
    ['name' => 'Create Users', 'slug' => 'users.create', 'group' => 'users'],
    ['name' => 'Update Users', 'slug' => 'users.update', 'group' => 'users'],
    ['name' => 'Delete Users', 'slug' => 'users.delete', 'group' => 'users'],
],
```

```bash
php artisan sso:sync-permissions
```

## Admin API Endpoints

### Roles

```
GET    /api/admin/sso/roles              # List roles
POST   /api/admin/sso/roles              # Create role
GET    /api/admin/sso/roles/{id}         # Get role
PUT    /api/admin/sso/roles/{id}         # Update role
DELETE /api/admin/sso/roles/{id}         # Delete role

GET    /api/admin/sso/roles/{id}/permissions     # Get role permissions
PUT    /api/admin/sso/roles/{id}/permissions     # Sync role permissions
```

### Permissions

```
GET    /api/admin/sso/permissions        # List permissions
POST   /api/admin/sso/permissions        # Create permission
GET    /api/admin/sso/permissions/{id}   # Get permission
PUT    /api/admin/sso/permissions/{id}   # Update permission
DELETE /api/admin/sso/permissions/{id}   # Delete permission

GET    /api/admin/sso/permission-matrix  # Get role-permission matrix
```

### Team Permissions

```
GET    /api/admin/sso/teams/permissions              # List all team permissions
GET    /api/admin/sso/teams/{teamId}/permissions     # Get team permissions
PUT    /api/admin/sso/teams/{teamId}/permissions     # Sync team permissions
DELETE /api/admin/sso/teams/{teamId}/permissions     # Remove team permissions
```

## Example: Setting Up RBAC

```php
// Create permissions
$permissions = [
    Permission::create(['name' => 'View Dashboard', 'slug' => 'dashboard.view', 'group' => 'dashboard']),
    Permission::create(['name' => 'Manage Users', 'slug' => 'users.manage', 'group' => 'users']),
    Permission::create(['name' => 'Manage Settings', 'slug' => 'settings.manage', 'group' => 'settings']),
];

// Create roles
$adminRole = Role::create(['name' => 'Admin', 'slug' => 'admin', 'level' => 100]);
$memberRole = Role::create(['name' => 'Member', 'slug' => 'member', 'level' => 10]);

// Assign permissions
$adminRole->permissions()->sync($permissions->pluck('id')); // Admin gets all
$memberRole->permissions()->sync([$permissions[0]->id]); // Member only dashboard

// Assign role to user
$user->role_id = $adminRole->id;
$user->save();

// Check access
$user->hasPermission('users.manage'); // true
```
