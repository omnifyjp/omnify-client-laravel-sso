<?php

declare(strict_types=1);

namespace Omnify\SsoClient\Services;

use Illuminate\Support\Collection;
use Omnify\SsoClient\Models\BranchCache;
use Omnify\SsoClient\Models\OrganizationCache;
use Omnify\SsoClient\Models\Role;
use Omnify\SsoClient\Models\UserCache;

class UserRoleService
{
    /**
     * Get user's role assignments.
     */
    public function getUserRoles(UserCache $user, ?string $orgId = null): Collection
    {
        $query = $user->roles();

        // If org context, filter to global + org roles
        if ($orgId) {
            $query->where(function ($q) use ($orgId) {
                $q->whereNull('user_roles.console_org_id')
                    ->orWhere('user_roles.console_org_id', $orgId);
            });
        }

        $roles = $query->get();

        // Add organization and branch info
        return $roles->map(function ($role) {
            $orgName = null;
            $branchName = null;

            if ($role->pivot->console_org_id) {
                $org = OrganizationCache::where('console_org_id', $role->pivot->console_org_id)->first();
                $orgName = $org?->name;
            }

            if ($role->pivot->console_branch_id) {
                $branch = BranchCache::where('console_branch_id', $role->pivot->console_branch_id)->first();
                $branchName = $branch?->name;
            }

            return [
                'role' => [
                    'id' => $role->id,
                    'name' => $role->name,
                    'slug' => $role->slug,
                    'level' => $role->level,
                ],
                'scope' => $this->getScopeType(
                    $role->pivot->console_org_id,
                    $role->pivot->console_branch_id
                ),
                'console_org_id' => $role->pivot->console_org_id,
                'console_branch_id' => $role->pivot->console_branch_id,
                'org_name' => $orgName,
                'branch_name' => $branchName,
            ];
        });
    }

    /**
     * Assign a role to a user.
     *
     * @param  array{role_id: string, console_org_id?: string|null, console_branch_id?: string|null}  $data
     * @return array{success: bool, error?: string, message?: string}
     */
    public function assignRole(UserCache $user, array $data): array
    {
        $roleId = $data['role_id'];
        $orgId = $data['console_org_id'] ?? null;
        $branchId = $data['console_branch_id'] ?? null;

        // Validate role exists
        $role = Role::find($roleId);
        if (! $role) {
            return [
                'success' => false,
                'error' => 'ROLE_NOT_FOUND',
                'message' => 'Role not found',
            ];
        }

        // Check for duplicate assignment
        $existingAssignment = $user->roles()
            ->where('roles.id', $roleId)
            ->wherePivot('console_org_id', $orgId)
            ->wherePivot('console_branch_id', $branchId)
            ->exists();

        if ($existingAssignment) {
            return [
                'success' => false,
                'error' => 'DUPLICATE_ASSIGNMENT',
                'message' => 'User already has this role assignment',
            ];
        }

        // Attach role with scope
        $user->roles()->attach($roleId, [
            'console_org_id' => $orgId,
            'console_branch_id' => $branchId,
        ]);

        return [
            'success' => true,
            'message' => 'Role assigned successfully',
        ];
    }

    /**
     * Remove a role from a user.
     *
     * @return array{success: bool, error?: string, message?: string}
     */
    public function removeRole(UserCache $user, string $roleId, ?string $orgId = null, ?string $branchId = null): array
    {
        // Find the assignment
        $assignment = $user->roles()
            ->where('roles.id', $roleId)
            ->wherePivot('console_org_id', $orgId)
            ->wherePivot('console_branch_id', $branchId)
            ->first();

        if (! $assignment) {
            return [
                'success' => false,
                'error' => 'ASSIGNMENT_NOT_FOUND',
                'message' => 'Role assignment not found',
            ];
        }

        // Detach with specific pivot conditions
        $user->roles()->wherePivot('console_org_id', $orgId)
            ->wherePivot('console_branch_id', $branchId)
            ->detach($roleId);

        return [
            'success' => true,
            'message' => 'Role removed successfully',
        ];
    }

    /**
     * Sync user's roles (replace all).
     *
     * @param  array<array{role_id: string, console_org_id?: string|null, console_branch_id?: string|null}>  $assignments
     */
    public function syncRoles(UserCache $user, array $assignments, ?string $orgId = null): array
    {
        // If org context, only sync roles for that org
        if ($orgId) {
            // Remove existing roles for this org
            $user->roles()
                ->wherePivot('console_org_id', $orgId)
                ->detach();

            // Also remove global roles if specified
            $globalAssignments = collect($assignments)->filter(fn ($a) => ($a['console_org_id'] ?? null) === null);
            if ($globalAssignments->isNotEmpty()) {
                $user->roles()
                    ->wherePivot('console_org_id', null)
                    ->detach();
            }
        } else {
            // Sync all roles
            $user->roles()->detach();
        }

        // Attach new roles
        foreach ($assignments as $assignment) {
            $user->roles()->attach($assignment['role_id'], [
                'console_org_id' => $assignment['console_org_id'] ?? null,
                'console_branch_id' => $assignment['console_branch_id'] ?? null,
            ]);
        }

        return [
            'success' => true,
            'message' => 'Roles synced successfully',
            'count' => count($assignments),
        ];
    }

    /**
     * Get scope type from org_id and branch_id.
     */
    private function getScopeType(?string $orgId, ?string $branchId): string
    {
        if ($orgId === null) {
            return 'global';
        }
        if ($branchId === null) {
            return 'org-wide';
        }

        return 'branch';
    }
}
