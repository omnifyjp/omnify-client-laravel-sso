<?php

namespace Omnify\SsoClient\Models;

use Omnify\SsoClient\Models\OmnifyBase\PermissionBaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * Permission Model
 *
 * This file is generated once and can be customized.
 * Add your custom methods and logic here.
 */
class Permission extends PermissionBaseModel
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
    protected static function newFactory(): \Omnify\SsoClient\Database\Factories\PermissionFactory
    {
        return \Omnify\SsoClient\Database\Factories\PermissionFactory::new();
    }

    // Add your custom methods here
}
