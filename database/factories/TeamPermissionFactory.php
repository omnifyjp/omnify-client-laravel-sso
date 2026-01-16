<?php

namespace Database\Factories;

use Omnify\SsoClient\Models\TeamPermission;
use Illuminate\Database\Eloquent\Factories\Factory;

use Omnify\SsoClient\Models\Permission;

/**
 * @extends Factory<TeamPermission>
 */
class TeamPermissionFactory extends Factory
{
    protected $model = TeamPermission::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'console_org_id' => fake()->numberBetween(1, 1000),
            'console_team_id' => fake()->numberBetween(1, 1000),
            'permission_id' => Permission::query()->inRandomOrder()->first()?->id ?? Permission::factory()->create()->id,
        ];
    }
}
