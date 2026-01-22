<?php

declare(strict_types=1);

namespace Omnify\SsoClient\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Omnify\SsoClient\Models\Role;

/**
 * Request validation for scoped role assignment.
 *
 * Validates role assignment with optional scope (org/branch).
 *
 * @property string $role_id Role UUID to assign
 * @property string|null $console_org_id Organization scope (null = global)
 * @property string|null $console_branch_id Branch scope (null = org-wide)
 */
class AssignRoleRequest extends FormRequest
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
            'role_id' => [
                'required',
                'uuid',
                'exists:roles,id',
            ],
            'console_org_id' => [
                'nullable',
                'string',
                'max:36',
            ],
            'console_branch_id' => [
                'nullable',
                'string',
                'max:36',
                // If branch_id is provided, org_id must also be provided
                'required_with:console_org_id',
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
            'role_id.required' => 'Role ID is required.',
            'role_id.uuid' => 'Role ID must be a valid UUID.',
            'role_id.exists' => 'The specified role does not exist.',
            'console_org_id.max' => 'Organization ID must be a valid UUID (max 36 characters).',
            'console_branch_id.max' => 'Branch ID must be a valid UUID (max 36 characters).',
        ];
    }

    /**
     * Get custom attribute names.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'role_id' => 'Role',
            'console_org_id' => 'Organization ID',
            'console_branch_id' => 'Branch ID',
        ];
    }

    /**
     * Get the validated role.
     */
    public function getRole(): Role
    {
        return Role::findOrFail($this->validated('role_id'));
    }

    /**
     * Get the scope type for this assignment.
     *
     * @return string 'global'|'org-wide'|'branch'
     */
    public function getScopeType(): string
    {
        $orgId = $this->validated('console_org_id');
        $branchId = $this->validated('console_branch_id');

        if ($orgId === null) {
            return 'global';
        }

        if ($branchId === null) {
            return 'org-wide';
        }

        return 'branch';
    }
}
