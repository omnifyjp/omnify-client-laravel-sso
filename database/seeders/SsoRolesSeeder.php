<?php

namespace Omnify\SsoClient\Database\Seeders;

use Illuminate\Database\Seeder;
use Omnify\SsoClient\Models\Permission;
use Omnify\SsoClient\Models\Role;

class SsoRolesSeeder extends Seeder
{
    public function run(): void
    {
        // Create default roles
        $this->createRoles();

        // Create base permissions
        $this->createPermissions();

        // Assign default permissions to roles
        $this->assignDefaultPermissions();
    }

    protected function createRoles(): void
    {
        $roles = [
            [
                'slug' => 'admin',
                'display_name' => 'Administrator',
                'level' => 100,
                'description' => 'Full access to all features',
            ],
            [
                'slug' => 'manager',
                'display_name' => 'Manager',
                'level' => 50,
                'description' => 'Can manage most features except system settings',
            ],
            [
                'slug' => 'member',
                'display_name' => 'Member',
                'level' => 10,
                'description' => 'Basic access for regular users',
            ],
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(
                ['slug' => $role['slug']],
                $role
            );
        }
    }

    protected function createPermissions(): void
    {
        $permissions = [
            // Users group
            ['slug' => 'users.view', 'display_name' => 'View Users', 'group' => 'users'],
            ['slug' => 'users.create', 'display_name' => 'Create Users', 'group' => 'users'],
            ['slug' => 'users.update', 'display_name' => 'Update Users', 'group' => 'users'],
            ['slug' => 'users.delete', 'display_name' => 'Delete Users', 'group' => 'users'],

            // Roles group (admin only)
            ['slug' => 'roles.view', 'display_name' => 'View Roles', 'group' => 'roles'],
            ['slug' => 'roles.manage', 'display_name' => 'Manage Roles', 'group' => 'roles'],

            // Settings group
            ['slug' => 'settings.view', 'display_name' => 'View Settings', 'group' => 'settings'],
            ['slug' => 'settings.update', 'display_name' => 'Update Settings', 'group' => 'settings'],
        ];

        foreach ($permissions as $permission) {
            Permission::updateOrCreate(
                ['slug' => $permission['slug']],
                $permission
            );
        }
    }

    protected function assignDefaultPermissions(): void
    {
        $admin = Role::where('slug', 'admin')->first();
        $manager = Role::where('slug', 'manager')->first();
        $member = Role::where('slug', 'member')->first();

        // Admin gets all permissions
        if ($admin) {
            $admin->permissions()->sync(Permission::pluck('id'));
        }

        // Manager gets most permissions except admin-only
        if ($manager) {
            $manager->permissions()->sync(
                Permission::whereNotIn('slug', ['users.delete', 'roles.manage', 'settings.update'])
                    ->pluck('id')
            );
        }

        // Member gets view-only permissions
        if ($member) {
            $member->permissions()->sync(
                Permission::where('slug', 'like', '%.view')->pluck('id')
            );
        }
    }
}
