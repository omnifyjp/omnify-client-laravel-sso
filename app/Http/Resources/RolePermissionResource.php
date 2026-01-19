<?php

/**
 * RolePermission Resource
 *
 * SAFE TO EDIT - This file is never overwritten by Omnify.
 */

namespace App\Http\Resources;

use Illuminate\Http\Request;
use OpenApi\Attributes as OA;
use App\Http\Resources\OmnifyBase\RolePermissionResourceBase;

#[OA\Schema(
    schema: 'RolePermission',
    description: 'Role Permission',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 1),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time'),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time'),
    ]
)]
class RolePermissionResource extends RolePermissionResourceBase
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return array_merge($this->schemaArray($request), [
            // Custom fields here
        ]);
    }

    /**
     * Get additional data that should be returned with the resource array.
     *
     * @return array<string, mixed>
     */
    public function with(Request $request): array
    {
        return [
            // Additional metadata here
        ];
    }
}
