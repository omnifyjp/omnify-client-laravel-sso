<?php

/**
 * TeamPermission Resource
 *
 * Custom resource without OmnifyBase dependency.
 */

namespace Omnify\SsoClient\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'TeamPermission',
    description: 'Team Permission',
    properties: [
        new OA\Property(property: 'id', type: 'string', example: '019bea70-1234-5678-9abc-def012345678'),
        new OA\Property(property: 'console_org_id', type: 'string'),
        new OA\Property(property: 'console_team_id', type: 'string'),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time'),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time'),
    ]
)]
class TeamPermissionResource extends JsonResource
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
            'console_org_id' => $this->console_org_id,
            'console_team_id' => $this->console_team_id,
            'permission' => PermissionResource::make($this->whenLoaded('permission')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
