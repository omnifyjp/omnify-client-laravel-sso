<?php

declare(strict_types=1);

namespace Omnify\SsoClient\Services;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Omnify\SsoClient\Models\BranchCache;
use Omnify\SsoClient\Models\OrganizationCache;
use Omnify\SsoClient\Models\TeamCache;
use Omnify\SsoClient\Models\UserCache;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class UserService
{
    /**
     * Get paginated list of users with filters.
     *
     * @param  array{search?: string, org_id?: string, per_page?: int}  $filters
     */
    public function list(array $filters = []): LengthAwarePaginator
    {
        return QueryBuilder::for(UserCache::class)
            ->allowedFilters([
                AllowedFilter::callback('search', function ($query, $value) {
                    $query->where(function ($q) use ($value) {
                        $q->where('name', 'like', "%{$value}%")
                            ->orWhere('email', 'like', "%{$value}%");
                    });
                }),
                AllowedFilter::exact('org_id', 'console_org_id'),
            ])
            ->allowedSorts(['id', 'name', 'email', 'created_at', 'updated_at'])
            ->defaultSort('-id')
            ->paginate($filters['per_page'] ?? 10);
    }

    /**
     * Search users by email (autocomplete).
     */
    public function searchByEmail(string $email, ?string $excludeUserId = null, int $limit = 10): Collection
    {
        if (strlen($email) < 2) {
            return collect([]);
        }

        $query = UserCache::query()
            ->where('email', 'like', "%{$email}%")
            ->limit($limit);

        if ($excludeUserId) {
            $query->where('id', '!=', $excludeUserId);
        }

        return $query->get();
    }

    /**
     * Get user by ID.
     */
    public function find(string $id): ?UserCache
    {
        return UserCache::find($id);
    }

    /**
     * Update user.
     *
     * @param  array{name?: string, email?: string}  $data
     */
    public function update(UserCache $user, array $data): UserCache
    {
        $user->update($data);

        return $user->fresh();
    }

    /**
     * Delete user.
     */
    public function delete(UserCache $user): bool
    {
        return $user->delete();
    }

    /**
     * Get comprehensive permissions breakdown for a user.
     *
     * @return array{
     *     user: array,
     *     context: array{org_id: ?string, branch_id: ?string},
     *     role_assignments: array,
     *     team_memberships: array,
     *     aggregated_permissions: array
     * }
     */
    public function getPermissionsBreakdown(UserCache $user, ?string $orgId = null, ?string $branchId = null): array
    {
        // Get user's primary organization
        $userOrg = $this->getUserOrganization($user);

        // Get role assignments with permissions for this context
        $roleAssignments = $this->getRoleAssignments($user, $orgId, $branchId);

        // Get team memberships with permissions (if org context)
        $teamMemberships = $this->getTeamMemberships($user, $orgId);

        // Get aggregated permissions
        $aggregatedPermissions = $user->getAllPermissions($orgId, $branchId);

        return [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'console_org_id' => $user->console_org_id,
                'organization' => $userOrg,
            ],
            'context' => [
                'org_id' => $orgId,
                'branch_id' => $branchId,
            ],
            'role_assignments' => $roleAssignments,
            'team_memberships' => $teamMemberships,
            'aggregated_permissions' => array_values($aggregatedPermissions),
        ];
    }

    /**
     * Get user's primary organization info.
     */
    private function getUserOrganization(UserCache $user): ?array
    {
        if (! $user->console_org_id) {
            return null;
        }

        $orgCache = OrganizationCache::where('console_org_id', $user->console_org_id)->first();

        return $orgCache ? [
            'id' => $orgCache->id,
            'console_org_id' => $orgCache->console_org_id,
            'name' => $orgCache->name,
            'code' => $orgCache->code,
        ] : null;
    }

    /**
     * Get role assignments with permissions for context.
     */
    private function getRoleAssignments(UserCache $user, ?string $orgId, ?string $branchId): array
    {
        $rolesForContext = $user->getRolesForContext($orgId, $branchId);

        $roleAssignments = $rolesForContext->map(function ($role) {
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
                    $role->pivot->console_org_id ?? null,
                    $role->pivot->console_branch_id ?? null
                ),
                'console_org_id' => $role->pivot->console_org_id ?? null,
                'console_branch_id' => $role->pivot->console_branch_id ?? null,
                'org_name' => $orgName,
                'branch_name' => $branchName,
                'permissions' => $role->permissions->pluck('slug')->toArray(),
            ];
        });

        // Sort: global first, then org-wide, then branch
        return $roleAssignments->sortBy(function ($assignment) {
            return match ($assignment['scope']) {
                'global' => 0,
                'org-wide' => 1,
                'branch' => 2,
                default => 3,
            };
        })->values()->toArray();
    }

    /**
     * Get team memberships with permissions.
     */
    private function getTeamMemberships(UserCache $user, ?string $orgId): array
    {
        if (! $orgId) {
            return [];
        }

        $teams = $user->getConsoleTeams($orgId);
        $memberships = [];

        foreach ($teams as $team) {
            $teamCache = TeamCache::where('console_team_id', $team['id'])->first();
            $memberships[] = [
                'team' => [
                    'id' => $team['id'],
                    'name' => $team['name'],
                    'path' => $team['path'] ?? null,
                ],
                'is_leader' => $team['is_leader'] ?? false,
                'permissions' => $teamCache ? $teamCache->permissions->pluck('slug')->toArray() : [],
            ];
        }

        return $memberships;
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
