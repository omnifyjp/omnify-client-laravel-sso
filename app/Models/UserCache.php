<?php

declare(strict_types=1);

namespace Omnify\SsoClient\Models;

use Illuminate\Auth\Authenticatable;
use Illuminate\Auth\MustVerifyEmail;
use Illuminate\Auth\Passwords\CanResetPassword;
use Illuminate\Contracts\Auth\Access\Authorizable as AuthorizableContract;
use Illuminate\Contracts\Auth\Authenticatable as AuthenticatableContract;
use Illuminate\Contracts\Auth\CanResetPassword as CanResetPasswordContract;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\Access\Authorizable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Omnify\SsoClient\Models\OmnifyBase\UserCacheBaseModel;
use Omnify\SsoClient\Models\Traits\HasConsoleSso;
use Omnify\SsoClient\Models\Traits\HasTeamPermissions;

/**
 * UserCache Model
 *
 * Laravel-compatible User model for SSO integration.
 * Supports scoped role assignments (global, org-wide, branch-specific).
 *
 * @see https://csrc.nist.gov/Projects/Role-Based-Access-Control NIST RBAC Standard
 */
class UserCache extends UserCacheBaseModel implements AuthenticatableContract, AuthorizableContract, CanResetPasswordContract
{
    use Authenticatable, Authorizable, CanResetPassword, MustVerifyEmail;
    use HasApiTokens, HasFactory, Notifiable;
    use HasConsoleSso, HasTeamPermissions;

    /**
     * The attributes that should be hidden for serialization.
     */
    protected $hidden = [
        'remember_token',
        'console_access_token',
        'console_refresh_token',
    ];

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return parent::casts();
    }

    /**
     * Create a new factory instance for the model.
     */
    protected static function newFactory(): \Omnify\SsoClient\Database\Factories\UserCacheFactory
    {
        return \Omnify\SsoClient\Database\Factories\UserCacheFactory::new();
    }

    // =========================================================================
    // SCOPED ROLE METHODS (Branch-Level Permissions - Option B)
    // =========================================================================

    /**
     * Get roles applicable for a specific context (org/branch).
     *
     * Permission Resolution Hierarchy:
     * 1. Global roles (org=null, branch=null) - Apply everywhere
     * 2. Org-wide roles (org=X, branch=null) - Apply to all branches in org
     * 3. Branch-specific roles (org=X, branch=Y) - Apply only to that branch
     *
     * @param  string|null  $orgId  Organization ID (console_org_id). null = global context only.
     * @param  string|null  $branchId  Branch ID (console_branch_id). null = org-wide context.
     * @return Collection<int, Role>
     *
     * @example
     * // Get roles for branch context (includes global + org-wide + branch-specific)
     * $roles = $user->getRolesForContext($orgId, $branchId);
     *
     * // Get roles for org context (includes global + org-wide only)
     * $roles = $user->getRolesForContext($orgId);
     *
     * // Get global roles only
     * $roles = $user->getRolesForContext();
     */
    /**
     * Override roles relation to use correct foreign key.
     */
    public function roles(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(
            Role::class,
            'role_user_cache',
            'user_cach_id',  // Foreign key on role_user_cache table (note: migration uses user_cach_id)
            'role_id',        // Related key on role_user_cache table
            'id',             // Local key on user_caches table
            'id'              // Owner key on roles table
        )
            ->withPivot('console_org_id', 'console_branch_id')
            ->withTimestamps();
    }

    public function getRolesForContext(?string $orgId = null, ?string $branchId = null): Collection
    {
        return $this->roles()
            ->where(function ($query) use ($orgId, $branchId) {
                // 1. Global assignments (both null) - always applicable
                $query->where(function ($q) {
                    $q->whereNull('role_user_cache.console_org_id')
                        ->whereNull('role_user_cache.console_branch_id');
                });

                // 2. Org-wide assignments (if org context provided)
                if ($orgId !== null) {
                    $query->orWhere(function ($q) use ($orgId) {
                        $q->where('role_user_cache.console_org_id', $orgId)
                            ->whereNull('role_user_cache.console_branch_id');
                    });

                    // 3. Branch-specific assignments (if branch context provided)
                    if ($branchId !== null) {
                        $query->orWhere(function ($q) use ($orgId, $branchId) {
                            $q->where('role_user_cache.console_org_id', $orgId)
                                ->where('role_user_cache.console_branch_id', $branchId);
                        });
                    }
                }
            })
            ->get();
    }

    /**
     * Get all role assignments for this user (with scope info).
     *
     * Returns all role assignments with their scope information,
     * useful for admin UI to display user's complete role configuration.
     *
     * @return Collection<int, Role> Roles with pivot data (console_org_id, console_branch_id)
     *
     * @example
     * $assignments = $user->getRoleAssignments();
     * foreach ($assignments as $role) {
     *     $scope = match(true) {
     *         $role->pivot->console_org_id === null => 'global',
     *         $role->pivot->console_branch_id === null => 'org-wide',
     *         default => 'branch-specific',
     *     };
     *     echo "{$role->name}: {$scope}";
     * }
     */
    public function getRoleAssignments(): Collection
    {
        return $this->roles()
            ->withPivot(['console_org_id', 'console_branch_id', 'created_at', 'updated_at'])
            ->get();
    }

    /**
     * Assign a role to the user with optional scope.
     *
     * Scope Hierarchy:
     * - Global: orgId=null, branchId=null → Role applies everywhere
     * - Org-wide: orgId=X, branchId=null → Role applies to all branches in org X
     * - Branch: orgId=X, branchId=Y → Role applies only to branch Y in org X
     *
     * @param  Role|string  $role  Role instance or role slug
     * @param  string|null  $orgId  Organization ID for scoping. null = global.
     * @param  string|null  $branchId  Branch ID for scoping. null = org-wide.
     *
     * @throws \InvalidArgumentException If role not found when passing slug
     *
     * @example
     * // Global admin (can do everything everywhere)
     * $user->assignRole($adminRole);
     *
     * // Org-wide manager (all branches in org)
     * $user->assignRole($managerRole, $orgId);
     *
     * // Branch-specific staff (only Tokyo branch)
     * $user->assignRole($staffRole, $orgId, $tokyoBranchId);
     *
     * // Same user: admin at Tokyo, staff at Osaka
     * $user->assignRole('admin', $orgId, $tokyoBranchId);
     * $user->assignRole('staff', $orgId, $osakaBranchId);
     */
    public function assignRole(Role|string $role, ?string $orgId = null, ?string $branchId = null): void
    {
        $role = $this->resolveRole($role);

        // Check if exact assignment already exists (same role + same scope)
        // Use whereNull for NULL values to handle SQL NULL comparison correctly
        $query = $this->roles()->where('roles.id', $role->id);

        if ($orgId === null) {
            $query->wherePivotNull('console_org_id');
        } else {
            $query->wherePivot('console_org_id', $orgId);
        }

        if ($branchId === null) {
            $query->wherePivotNull('console_branch_id');
        } else {
            $query->wherePivot('console_branch_id', $branchId);
        }

        if ($query->exists()) {
            return; // Already assigned with this exact scope
        }

        // Use attach to allow multiple assignments with different scopes
        $this->roles()->attach($role->id, [
            'console_org_id' => $orgId,
            'console_branch_id' => $branchId,
        ]);
    }

    /**
     * Remove a role from the user in a specific scope.
     *
     * @param  Role|string  $role  Role instance or role slug
     * @param  string|null  $orgId  Organization ID. null = global scope.
     * @param  string|null  $branchId  Branch ID. null = org-wide scope.
     * @return int Number of detached records
     *
     * @example
     * // Remove global admin role
     * $user->removeRole($adminRole);
     *
     * // Remove org-wide manager role
     * $user->removeRole($managerRole, $orgId);
     *
     * // Remove branch-specific staff role
     * $user->removeRole($staffRole, $orgId, $branchId);
     */
    public function removeRole(Role|string $role, ?string $orgId = null, ?string $branchId = null): int
    {
        $role = $this->resolveRole($role);

        // Use DB query to handle NULL values correctly
        $query = \DB::table('role_user_cache')
            ->where('user_cach_id', $this->id)
            ->where('role_id', $role->id);

        if ($orgId === null) {
            $query->whereNull('console_org_id');
        } else {
            $query->where('console_org_id', $orgId);
        }

        if ($branchId === null) {
            $query->whereNull('console_branch_id');
        } else {
            $query->where('console_branch_id', $branchId);
        }

        return $query->delete();
    }

    /**
     * Remove all role assignments for a specific scope.
     *
     * @param  string|null  $orgId  Organization ID
     * @param  string|null  $branchId  Branch ID
     * @return int Number of detached records
     *
     * @example
     * // Remove all roles in branch context
     * $user->removeRolesInScope($orgId, $branchId);
     *
     * // Remove all org-wide roles
     * $user->removeRolesInScope($orgId);
     */
    public function removeRolesInScope(?string $orgId = null, ?string $branchId = null): int
    {
        // Use DB query to handle NULL values correctly
        $query = \DB::table('role_user_cache')
            ->where('user_cach_id', $this->id);

        if ($orgId === null) {
            $query->whereNull('console_org_id');
        } else {
            $query->where('console_org_id', $orgId);
        }

        if ($branchId === null) {
            $query->whereNull('console_branch_id');
        } else {
            $query->where('console_branch_id', $branchId);
        }

        return $query->delete();
    }

    /**
     * Check if user has a specific role in a context.
     *
     * @param  string  $roleSlug  Role slug to check
     * @param  string|null  $orgId  Organization context
     * @param  string|null  $branchId  Branch context
     *
     * @example
     * // Check if user is admin anywhere (global role)
     * $user->hasRoleInContext('admin');
     *
     * // Check if user is manager in this org (global or org-wide)
     * $user->hasRoleInContext('manager', $orgId);
     *
     * // Check if user is staff in this branch (global, org-wide, or branch-specific)
     * $user->hasRoleInContext('staff', $orgId, $branchId);
     */
    public function hasRoleInContext(string $roleSlug, ?string $orgId = null, ?string $branchId = null): bool
    {
        return $this->getRolesForContext($orgId, $branchId)
            ->contains('slug', $roleSlug);
    }

    /**
     * Get the highest role level for a context.
     *
     * Useful for role hierarchy checks (e.g., can user manage other users).
     *
     * @param  string|null  $orgId  Organization context
     * @param  string|null  $branchId  Branch context
     * @return int Highest role level (0 if no roles)
     *
     * @example
     * $level = $user->getHighestRoleLevelInContext($orgId, $branchId);
     * if ($level >= 50) { // Manager level or above
     *     // Allow management actions
     * }
     */
    public function getHighestRoleLevelInContext(?string $orgId = null, ?string $branchId = null): int
    {
        return $this->getRolesForContext($orgId, $branchId)
            ->max('level') ?? 0;
    }

    /**
     * Sync roles for a specific scope (replace all roles in that scope).
     *
     * @param  array<Role|string>  $roles  Array of Role instances or slugs
     * @param  string|null  $orgId  Organization ID
     * @param  string|null  $branchId  Branch ID
     * @return array{attached: array, detached: array}
     *
     * @example
     * // Set user as manager and viewer in org (removes other org-wide roles)
     * $user->syncRolesInScope(['manager', 'viewer'], $orgId);
     */
    public function syncRolesInScope(array $roles, ?string $orgId = null, ?string $branchId = null): array
    {
        // Get current role IDs in this scope
        $currentRoleIds = $this->roles()
            ->wherePivot('console_org_id', $orgId)
            ->wherePivot('console_branch_id', $branchId)
            ->pluck('roles.id')
            ->toArray();

        // Resolve new role IDs
        $newRoleIds = collect($roles)->map(function ($role) {
            return $this->resolveRole($role)->id;
        })->toArray();

        // Calculate diff
        $toAttach = array_diff($newRoleIds, $currentRoleIds);
        $toDetach = array_diff($currentRoleIds, $newRoleIds);

        // Detach removed roles
        if (! empty($toDetach)) {
            \DB::table('role_user_cache')
                ->where('user_cach_id', $this->id)
                ->where('console_org_id', $orgId)
                ->where('console_branch_id', $branchId)
                ->whereIn('role_id', $toDetach)
                ->delete();
        }

        // Attach new roles using syncWithoutDetaching to handle existing records
        if (! empty($toAttach)) {
            $attachData = [];
            foreach ($toAttach as $roleId) {
                $attachData[$roleId] = [
                    'console_org_id' => $orgId,
                    'console_branch_id' => $branchId,
                ];
            }
            $this->roles()->syncWithoutDetaching($attachData);
        }

        return [
            'attached' => $toAttach,
            'detached' => $toDetach,
        ];
    }

    /**
     * Resolve a role from slug or instance.
     *
     * @param  Role|string  $role  Role instance or slug
     *
     * @throws \InvalidArgumentException If role not found
     */
    protected function resolveRole(Role|string $role): Role
    {
        if ($role instanceof Role) {
            return $role;
        }

        $resolved = Role::where('slug', $role)->first();

        if (! $resolved) {
            throw new \InvalidArgumentException("Role with slug '{$role}' not found.");
        }

        return $resolved;
    }
}
