<?php

/**
 * Branch Resource
 *
 * SAFE TO EDIT - This file is never overwritten by Omnify.
 */

namespace App\Http\Resources;

use Illuminate\Http\Request;
use OpenApi\Attributes as OA;
use App\Http\Resources\OmnifyBase\BranchResourceBase;

#[OA\Schema(
    schema: 'Branch',
    description: 'Branch',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 1),
        new OA\Property(property: 'console_branch_id', type: 'string'),
        new OA\Property(property: 'console_org_id', type: 'string'),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time'),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time'),
        new OA\Property(property: 'deleted_at', type: 'string', format: 'date-time', nullable: true),
    ]
)]
class BranchResource extends BranchResourceBase
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
