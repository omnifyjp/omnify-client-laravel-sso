<?php

namespace Omnify\SsoClient\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Omnify\SsoClient\Models\OmnifyBase\OrganizationCacheBaseModel;

/**
 * OrganizationCache Model
 *
 * Cached organization data from Console SSO server.
 */
class OrganizationCache extends OrganizationCacheBaseModel
{
    use HasFactory;

    protected static function newFactory(): \Omnify\SsoClient\Database\Factories\OrganizationCacheFactory
    {
        return \Omnify\SsoClient\Database\Factories\OrganizationCacheFactory::new();
    }

    /**
     * Find organization by Console organization ID.
     *
     * @param  string  $consoleOrgId  UUID string
     */
    public static function findByConsoleId(string $consoleOrgId): ?self
    {
        return static::where('console_org_id', $consoleOrgId)->first();
    }

    /**
     * Find organization by code.
     *
     * @param  string  $code  Organization code
     */
    public static function findByCode(string $code): ?self
    {
        return static::where('code', $code)->first();
    }
}
