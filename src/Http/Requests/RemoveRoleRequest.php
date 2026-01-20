<?php

declare(strict_types=1);

namespace Omnify\SsoClient\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Request validation for scoped role removal.
 *
 * Validates role removal with optional scope (org/branch).
 *
 * @property string|null $console_org_id Organization scope (null = global)
 * @property string|null $console_branch_id Branch scope (null = org-wide)
 */
class RemoveRoleRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Authorization is handled by middleware (sso.role:admin)
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'console_org_id' => [
                'nullable',
                'string',
                'max:36',
            ],
            'console_branch_id' => [
                'nullable',
                'string',
                'max:36',
                function ($attribute, $value, $fail) {
                    // Branch without org doesn't make sense
                    if ($value !== null && $this->input('console_org_id') === null) {
                        $fail('console_branch_id requires console_org_id to be set.');
                    }
                },
            ],
        ];
    }

    /**
     * Get custom error messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'console_org_id.max' => 'Organization ID must be a valid UUID (max 36 characters).',
            'console_branch_id.max' => 'Branch ID must be a valid UUID (max 36 characters).',
        ];
    }
}
