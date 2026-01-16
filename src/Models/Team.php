<?php

namespace Omnify\SsoClient\Models;

use Omnify\SsoClient\Models\OmnifyBase\TeamBaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * Team Model
 *
 * This file is generated once and can be customized.
 * Add your custom methods and logic here.
 */
class Team extends TeamBaseModel
{
    use HasFactory;

    /**
     * Create a new model instance.
     */
    public function __construct(array $attributes = [])
    {
        parent::__construct($attributes);
    }

    /**
     * Create a new factory instance for the model.
     */
    protected static function newFactory(): \Omnify\SsoClient\Database\Factories\TeamFactory
    {
        return \Omnify\SsoClient\Database\Factories\TeamFactory::new();
    }

    /**
     * Get permissions for this team via TeamPermission model.
     * Uses console_team_id for Console integration.
     */
    public function permissions(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(
            Permission::class,
            'team_permissions',
            'console_team_id',  // Foreign key on team_permissions
            'permission_id',    // Related key on team_permissions
            'console_team_id',  // Local key on teams
            'id'                // Owner key on permissions
        )->withTimestamps();
    }

    /**
     * Check if team has a specific permission.
     */
    public function hasPermission(string $permission): bool
    {
        return $this->permissions()->where('slug', $permission)->exists();
    }

    /**
     * Check if team has any of the given permissions.
     */
    public function hasAnyPermission(array $permissions): bool
    {
        return $this->permissions()->whereIn('slug', $permissions)->exists();
    }

    /**
     * Check if team has all of the given permissions.
     */
    public function hasAllPermissions(array $permissions): bool
    {
        return $this->permissions()->whereIn('slug', $permissions)->count() === count($permissions);
    }

    /**
     * Find team by Console team ID.
     */
    public static function findByConsoleId(int $consoleTeamId): ?self
    {
        return static::where('console_team_id', $consoleTeamId)->first();
    }

    /**
     * Get teams by Console organization ID.
     */
    public static function getByOrgId(int $consoleOrgId): \Illuminate\Database\Eloquent\Collection
    {
        return static::where('console_org_id', $consoleOrgId)->get();
    }
}
