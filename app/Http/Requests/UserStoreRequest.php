<?php

/**
 * User Store Request
 *
 * SAFE TO EDIT - This file is never overwritten by Omnify.
 */

namespace Omnify\SsoClient\Http\Requests;

use Omnify\SsoClient\Http\Requests\OmnifyBase\UserStoreRequestBase;
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'UserStoreRequest',
    properties: [
        new OA\Property(property: 'console_user_id', type: 'string', nullable: true, example: 1),
        new OA\Property(property: 'console_access_token', type: 'string', nullable: true),
        new OA\Property(property: 'console_refresh_token', type: 'string', nullable: true),
        new OA\Property(property: 'console_token_expires_at', type: 'string', format: 'date-time', nullable: true, example: '2024-01-01T00:00:00Z'),
        new OA\Property(property: 'role_id', type: 'integer', nullable: true, example: 1),
    ]
)]
class UserStoreRequest extends UserStoreRequestBase
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
