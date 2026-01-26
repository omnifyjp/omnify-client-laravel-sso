<?php

/**
 * UserCache Resource
 *
 * Custom resource without OmnifyBase dependency.
 */

namespace Omnify\SsoClient\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'UserCache',
    description: 'User Cache',
    properties: [
        new OA\Property(property: 'id', type: 'string', example: '019bea70-1234-5678-9abc-def012345678'),
        new OA\Property(property: 'name', type: 'string'),
        new OA\Property(property: 'email', type: 'string', format: 'email'),
        new OA\Property(property: 'console_user_id', type: 'string', nullable: true),
        new OA\Property(property: 'console_org_id', type: 'string', nullable: true),
        new OA\Property(property: 'organization', type: 'object', nullable: true),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time'),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time'),
    ]
)]
class UserCacheResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Get organization info if console_org_id exists
        $organization = null;
        if ($this->console_org_id) {
            $orgCache = \Omnify\SsoClient\Models\OrganizationCache::where('console_org_id', $this->console_org_id)->first();
            if ($orgCache) {
                $organization = [
                    'id' => $orgCache->id,
                    'console_org_id' => $orgCache->console_org_id,
                    'name' => $orgCache->name,
                    'code' => $orgCache->code,
                ];
            }
        }

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'console_user_id' => $this->console_user_id,
            'console_org_id' => $this->console_org_id,
            'organization' => $organization,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
