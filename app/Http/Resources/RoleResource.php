<?php

/**
 * Role Resource
 *
 * Custom resource without OmnifyBase dependency.
 */

namespace Omnify\SsoClient\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'Role',
    description: 'Role',
    properties: [
        new OA\Property(property: 'id', type: 'string', example: '019bea70-1234-5678-9abc-def012345678'),
        new OA\Property(property: 'name', type: 'string', maxLength: 100),
        new OA\Property(property: 'slug', type: 'string', maxLength: 100),
        new OA\Property(property: 'description', type: 'string', nullable: true),
        new OA\Property(property: 'level', type: 'integer'),
        new OA\Property(property: 'console_org_id', type: 'string', nullable: true),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time'),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time'),
    ]
)]
class RoleResource extends JsonResource
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
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'level' => $this->level,
            'console_org_id' => $this->console_org_id,
            'permissions' => PermissionResource::collection($this->whenLoaded('permissions')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
