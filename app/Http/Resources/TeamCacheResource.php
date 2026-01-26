<?php

/**
 * TeamCache Resource
 *
 * Custom resource without OmnifyBase dependency.
 */

namespace Omnify\SsoClient\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'TeamCache',
    description: 'Team Cache',
    properties: [
        new OA\Property(property: 'id', type: 'string', example: '019bea70-1234-5678-9abc-def012345678'),
        new OA\Property(property: 'console_team_id', type: 'string'),
        new OA\Property(property: 'console_org_id', type: 'string'),
        new OA\Property(property: 'name', type: 'string', maxLength: 100),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time'),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time'),
        new OA\Property(property: 'deleted_at', type: 'string', format: 'date-time', nullable: true),
    ]
)]
class TeamCacheResource extends JsonResource
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
            'console_team_id' => $this->console_team_id,
            'console_org_id' => $this->console_org_id,
            'name' => $this->name,
            'permissions' => PermissionResource::collection($this->whenLoaded('permissions')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'deleted_at' => $this->deleted_at?->toISOString(),
        ];
    }
}
