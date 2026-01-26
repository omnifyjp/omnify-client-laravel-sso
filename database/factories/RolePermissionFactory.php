<?php

namespace Database\Factories;

use Omnify\SsoClient\Models\RolePermission;
use Illuminate\Database\Eloquent\Factories\Factory;

use Omnify\SsoClient\Models\Role;
use Omnify\SsoClient\Models\Permission;

/**
 * @extends Factory<RolePermission>
 */
class RolePermissionFactory extends Factory
{
    protected $model = RolePermission::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'role_id' => Role::query()->inRandomOrder()->first()?->id ?? Role::factory()->create()->id,
            'permission_id' => Permission::query()->inRandomOrder()->first()?->id ?? Permission::factory()->create()->id,
        ];
    }
}
