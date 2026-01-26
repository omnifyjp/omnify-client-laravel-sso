<?php

/**
 * OrganizationCache Store Request
 *
 * SAFE TO EDIT - This file is never overwritten by Omnify.
 */

namespace Omnify\SsoClient\Http\Requests;

use Omnify\SsoClient\Http\Requests\OmnifyBase\OrganizationCacheStoreRequestBase;
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'OrganizationCacheStoreRequest',
    required: ['console_org_id', 'name', 'code', 'is_active'],
    properties: [
        new OA\Property(property: 'console_org_id', type: 'string', example: 1),
        new OA\Property(property: 'name', type: 'string', maxLength: 100),
        new OA\Property(property: 'code', type: 'string', maxLength: 20),
        new OA\Property(property: 'is_active', type: 'boolean', example: true),
    ]
)]
class OrganizationCacheStoreRequest extends OrganizationCacheStoreRequestBase
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return array_merge($this->schemaRules(), [
            // Custom/override rules here
        ]);
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return array_merge($this->schemaAttributes(), [
            // Custom attributes here
        ]);
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            // Custom messages here
        ];
    }
}
