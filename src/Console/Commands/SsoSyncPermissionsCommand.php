<?php

declare(strict_types=1);

namespace Omnify\SsoClient\Console\Commands;

use Illuminate\Console\Command;
use Omnify\SsoClient\Models\Permission;
use Omnify\SsoClient\Models\Role;

class SsoSyncPermissionsCommand extends Command
{
    protected $signature = 'sso:sync-permissions {--force : Force update existing permissions}';

    protected $description = 'Sync SSO admin permissions to the database';

    /**
     * Admin permissions for SSO management.
     * Format: service-admin.{resource}.{action}
     */
    protected array $permissions = [
        // Role management
        [
            'slug' => 'service-admin.role.view',
            'name' => 'View Roles',
            'group' => 'service-admin.role',
            'description' => 'View roles list and details',
        ],
        [
            'slug' => 'service-admin.role.create',
            'name' => 'Create Roles',
            'group' => 'service-admin.role',
            'description' => 'Create new roles',
        ],
        [
            'slug' => 'service-admin.role.edit',
            'name' => 'Edit Roles',
            'group' => 'service-admin.role',
            'description' => 'Edit existing roles',
        ],
        [
            'slug' => 'service-admin.role.delete',
            'name' => 'Delete Roles',
            'group' => 'service-admin.role',
            'description' => 'Delete roles (except system roles)',
        ],
        [
            'slug' => 'service-admin.role.sync-permissions',
            'name' => 'Sync Role Permissions',
            'group' => 'service-admin.role',
            'description' => 'Assign/remove permissions to roles',
        ],

        // Permission management
        [
            'slug' => 'service-admin.permission.view',
            'name' => 'View Permissions',
            'group' => 'service-admin.permission',
            'description' => 'View permissions list and details',
        ],
        [
            'slug' => 'service-admin.permission.create',
            'name' => 'Create Permissions',
            'group' => 'service-admin.permission',
            'description' => 'Create new permissions',
        ],
        [
            'slug' => 'service-admin.permission.edit',
            'name' => 'Edit Permissions',
            'group' => 'service-admin.permission',
            'description' => 'Edit existing permissions',
        ],
        [
            'slug' => 'service-admin.permission.delete',
            'name' => 'Delete Permissions',
            'group' => 'service-admin.permission',
            'description' => 'Delete permissions',
        ],
        [
            'slug' => 'service-admin.permission.matrix',
            'name' => 'View Permission Matrix',
            'group' => 'service-admin.permission',
            'description' => 'View role-permission matrix',
        ],

        // Team permission management
        [
            'slug' => 'service-admin.team.view',
            'name' => 'View Team Permissions',
            'group' => 'service-admin.team',
            'description' => 'View team permissions',
        ],
        [
            'slug' => 'service-admin.team.edit',
            'name' => 'Edit Team Permissions',
            'group' => 'service-admin.team',
            'description' => 'Assign/remove permissions to teams',
        ],
        [
            'slug' => 'service-admin.team.delete',
            'name' => 'Delete Team Permissions',
            'group' => 'service-admin.team',
            'description' => 'Remove all permissions from a team',
        ],
        [
            'slug' => 'service-admin.team.cleanup',
            'name' => 'Cleanup Orphaned Teams',
            'group' => 'service-admin.team',
            'description' => 'View and cleanup orphaned team permissions',
        ],

        // User management
        [
            'slug' => 'service-admin.user.view',
            'name' => 'View Users',
            'group' => 'service-admin.user',
            'description' => 'View users list and details',
        ],
        [
            'slug' => 'service-admin.user.create',
            'name' => 'Create Users',
            'group' => 'service-admin.user',
            'description' => 'Create new users',
        ],
        [
            'slug' => 'service-admin.user.edit',
            'name' => 'Edit Users',
            'group' => 'service-admin.user',
            'description' => 'Edit existing users',
        ],
        [
            'slug' => 'service-admin.user.delete',
            'name' => 'Delete Users',
            'group' => 'service-admin.user',
            'description' => 'Delete users',
        ],
        [
            'slug' => 'service-admin.user.assign-role',
            'name' => 'Assign User Roles',
            'group' => 'service-admin.user',
            'description' => 'Assign roles to users',
        ],
    ];

    /**
     * Default roles with their permissions.
     */
    protected array $defaultRoles = [
        [
            'slug' => 'admin',
            'name' => 'Administrator',
            'level' => 100,
            'description' => 'Full system access',
            'permissions' => 'all', // All permissions
        ],
        [
            'slug' => 'manager',
            'name' => 'Manager',
            'level' => 50,
            'description' => 'Management access',
            'permissions' => [
                'service-admin.role.view',
                'service-admin.permission.view',
                'service-admin.permission.matrix',
                'service-admin.team.view',
                'service-admin.team.edit',
                'service-admin.user.view',
                'service-admin.user.edit',
                'service-admin.user.assign-role',
            ],
        ],
        [
            'slug' => 'member',
            'name' => 'Member',
            'level' => 10,
            'description' => 'Basic member access',
            'permissions' => [], // No admin permissions
        ],
    ];

    public function handle(): int
    {
        $this->info('Syncing SSO admin permissions...');

        $created = 0;
        $updated = 0;
        $skipped = 0;

        foreach ($this->permissions as $permissionData) {
            $existing = Permission::where('slug', $permissionData['slug'])->first();

            if ($existing) {
                if ($this->option('force')) {
                    $existing->update([
                        'name' => $permissionData['name'],
                        'group' => $permissionData['group'],
                        'description' => $permissionData['description'],
                    ]);
                    $updated++;
                    $this->line("  Updated: {$permissionData['slug']}");
                } else {
                    $skipped++;
                }
            } else {
                Permission::create($permissionData);
                $created++;
                $this->line("  Created: {$permissionData['slug']}");
            }
        }

        $this->newLine();
        $this->info("Permissions: {$created} created, {$updated} updated, {$skipped} skipped");

        // Sync default roles
        $this->syncDefaultRoles();

        $this->newLine();
        $this->info('✓ SSO permissions synced successfully!');

        return self::SUCCESS;
    }

    protected function syncDefaultRoles(): void
    {
        $this->newLine();
        $this->info('Syncing default roles...');

        $allPermissionSlugs = collect($this->permissions)->pluck('slug')->toArray();

        foreach ($this->defaultRoles as $roleData) {
            $role = Role::firstOrCreate(
                ['slug' => $roleData['slug']],
                [
                    'name' => $roleData['name'],
                    'level' => $roleData['level'],
                    'description' => $roleData['description'],
                ]
            );

            // Sync permissions
            if ($roleData['permissions'] === 'all') {
                $permissionIds = Permission::whereIn('slug', $allPermissionSlugs)->pluck('id')->toArray();
            } else {
                $permissionIds = Permission::whereIn('slug', $roleData['permissions'])->pluck('id')->toArray();
            }

            // Only add new permissions, don't remove existing ones
            $existingIds = $role->permissions()->pluck('permissions.id')->toArray();
            $newIds = array_diff($permissionIds, $existingIds);

            if (! empty($newIds)) {
                $role->permissions()->attach($newIds);
                $this->line("  {$role->slug}: Added " . count($newIds) . ' permission(s)');
            } else {
                $this->line("  {$role->slug}: No new permissions to add");
            }
        }
    }
}
