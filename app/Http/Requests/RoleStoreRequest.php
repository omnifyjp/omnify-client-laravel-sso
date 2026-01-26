<?php

/**
 * Role Store Request
 *
 * SAFE TO EDIT - This file is never overwritten by Omnify.
 */

namespace Omnify\SsoClient\Http\Requests;

use Omnify\SsoClient\Http\Requests\OmnifyBase\RoleStoreRequestBase;
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'RoleStoreRequest',
    required: ['name', 'slug', 'level'],
    properties: [
        new OA\Property(property: 'name', type: 'string', maxLength: 100),
        new OA\Property(property: 'slug', type: 'string', maxLength: 100),
        new OA\Property(property: 'description', type: 'string', nullable: true),
        new OA\Property(property: 'level', type: 'integer', example: 1),
    ]
)]
class RoleStoreRequest extends RoleStoreRequestBase
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
