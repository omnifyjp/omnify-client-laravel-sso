<?php

/**
 * Team Store Request
 *
 * SAFE TO EDIT - This file is never overwritten by Omnify.
 */

namespace App\Http\Requests;

use App\Http\Requests\OmnifyBase\TeamStoreRequestBase;
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'TeamStoreRequest',
    required: ['console_team_id', 'console_org_id'],
    properties: [
        new OA\Property(property: 'console_team_id', type: 'string', example: 1),
        new OA\Property(property: 'console_org_id', type: 'string', example: 1),
    ]
)]
class TeamStoreRequest extends TeamStoreRequestBase
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
