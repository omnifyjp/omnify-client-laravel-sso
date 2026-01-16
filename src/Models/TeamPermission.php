<?php

namespace Omnify\SsoClient\Models;

use Omnify\SsoClient\Models\OmnifyBase\TeamPermissionBaseModel;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * TeamPermission Model
 *
 * This file is generated once and can be customized.
 * Add your custom methods and logic here.
 */
class TeamPermission extends TeamPermissionBaseModel
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
    protected static function newFactory(): \Omnify\SsoClient\Database\Factories\TeamPermissionFactory
    {
        return \Omnify\SsoClient\Database\Factories\TeamPermissionFactory::new();
    }

    // Add your custom methods here
}
