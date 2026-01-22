<?php

namespace Omnify\SsoClient\Models;

use Omnify\SsoClient\Models\OmnifyBase\BranchCacheBaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class BranchCache extends BranchCacheBaseModel
{
    use HasFactory;

    protected static function newFactory(): \Omnify\SsoClient\Database\Factories\BranchCacheFactory
    {
        return \Omnify\SsoClient\Database\Factories\BranchCacheFactory::new();
    }

    public static function findByConsoleId(int $consoleBranchId): ?self
    {
        return static::where('console_branch_id', $consoleBranchId)->first();
    }

    public static function getByOrgId(int $consoleOrgId): \Illuminate\Database\Eloquent\Collection
    {
        return static::where('console_org_id', $consoleOrgId)->get();
    }

    public static function getHeadquarters(int $consoleOrgId): ?self
    {
        return static::where('console_org_id', $consoleOrgId)
            ->where('is_headquarters', true)
            ->first();
    }
}
