<?php

/**
 * BranchCache Resource
 *
 * Custom resource without OmnifyBase dependency.
 */

namespace Omnify\SsoClient\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'BranchCache',
    description: 'Branch Cache',
    properties: [
        new OA\Property(property: 'id', type: 'string', example: '019bea70-1234-5678-9abc-def012345678'),
        new OA\Property(property: 'console_branch_id', type: 'string'),
        new OA\Property(property: 'console_org_id', type: 'string'),
        new OA\Property(property: 'code', type: 'string', maxLength: 20),
        new OA\Property(property: 'name', type: 'string', maxLength: 100),
        new OA\Property(property: 'is_headquarters', type: 'boolean'),
        new OA\Property(property: 'is_active', type: 'boolean'),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time'),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time'),
        new OA\Property(property: 'deleted_at', type: 'string', format: 'date-time', nullable: true),
    ]
)]
class BranchCacheResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'console_branch_id' => $this->console_branch_id,
            'console_org_id' => $this->console_org_id,
            'code' => $this->code,
            'name' => $this->name,
            'is_headquarters' => $this->is_headquarters,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'deleted_at' => $this->deleted_at?->toISOString(),
        ];
    }
}
