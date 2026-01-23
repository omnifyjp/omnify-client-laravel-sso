<?php

namespace Omnify\SsoClient\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Omnify\SsoClient\Models\OmnifyBase\RolePermissionBaseModel;

/**
 * RolePermission Model
 *
 * This file is generated once and can be customized.
 * Add your custom methods and logic here.
 */
class RolePermission extends RolePermissionBaseModel
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
    protected static function newFactory(): \Omnify\SsoClient\Database\Factories\RolePermissionFactory
    {
        return \Omnify\SsoClient\Database\Factories\RolePermissionFactory::new();
    }

    // Add your custom methods here
}
