<?php

namespace Omnify\SsoClient\Database\Seeders\Concerns;

use Illuminate\Support\Facades\DB;
use Omnify\SsoClient\Models\Role;
use Omnify\SsoClient\Models\UserCache;

/**
 * Trait for assigning roles to users with scope support.
 *
 * This trait provides methods to assign roles to users with optional scope
 * (organization and/or branch level). It supports the hierarchical permission
 * model used by Omnify SSO.
 *
 * Scope Hierarchy:
 * - Global (org=null, branch=null): Role applies everywhere
 * - Org-wide (org=uuid, branch=null): Role applies to all branches in org
 * - Branch-specific (org=uuid, branch=uuid): Role applies only to specific branch
 *
 * @example
 * ```php
 * class MySeeder extends Seeder
 * {
 *     use AssignsRoles, FetchesConsoleData;
 *
 *     public function run(): void
 *     {
 *         $orgData = $this->fetchOrgDataFromConsole('company-abc');
 *
 *         // Global assignment
 *         $this->assignRoleToUserByEmail('admin@example.com', 'admin');
 *
 *         // Org-wide assignment
 *         $this->assignRoleToUserByEmail('manager@example.com', 'manager', $orgData['org_id']);
 *
 *         // Branch-specific assignment
 *         $tokyoBranch = $this->getBranchId($orgData, 'TOKYO');
 *         $this->assignRoleToUserByEmail('staff@example.com', 'member', $orgData['org_id'], $tokyoBranch);
 *     }
 * }
 * ```
 *
 * @see \Omnify\SsoClient\Database\Seeders\Concerns\FetchesConsoleData
 * @see \Omnify\SsoClient\Database\Seeders\SsoRolesSeeder
 */
trait AssignsRoles
{
    /**
     * Assign a role to user with optional scope (org/branch).
     *
     * Uses updateOrInsert to handle duplicates gracefully.
     * Note: Primary key is (user_id, role_id), so scope gets updated if role already assigned.
     *
     * @param  string|null  $orgId  Console organization ID
     * @param  string|null  $branchId  Console branch ID
     */
    protected function assignRoleToUser(UserCache $user, Role $role, ?string $orgId = null, ?string $branchId = null): void
    {
        DB::table('role_user_cache')->updateOrInsert(
            [
                'user_cach_id' => $user->id,
                'role_id' => $role->id,
            ],
            [
                'console_org_id' => $orgId,
                'console_branch_id' => $branchId,
                'updated_at' => now(),
            ]
        );
    }

    /**
     * Assign role to user by email.
     *
     * @param  string  $email  User email
     * @param  string  $roleSlug  Role slug (e.g., 'admin')
     * @param  string|null  $orgId  Console organization ID
     * @param  string|null  $branchId  Console branch ID
     * @return bool Whether assignment was successful
     */
    protected function assignRoleToUserByEmail(
        string $email,
        string $roleSlug,
        ?string $orgId = null,
        ?string $branchId = null
    ): bool {
        $user = UserCache::where('email', $email)->first();
        $role = Role::where('slug', $roleSlug)->first();

        if (! $user || ! $role) {
            return false;
        }

        $this->assignRoleToUser($user, $role, $orgId, $branchId);

        return true;
    }

    /**
     * Remove all role assignments for a user in a specific scope.
     *
     * @return int Number of removed assignments
     */
    protected function removeUserRolesInScope(UserCache $user, ?string $orgId = null, ?string $branchId = null): int
    {
        return DB::table('role_user_cache')
            ->where('user_cach_id', $user->id)
            ->where('console_org_id', $orgId)
            ->where('console_branch_id', $branchId)
            ->delete();
    }
}
