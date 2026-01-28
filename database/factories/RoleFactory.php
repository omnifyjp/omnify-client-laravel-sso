<?php

namespace Omnify\SsoClient\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Omnify\SsoClient\Models\Role;

/**
 * @extends Factory<Role>
 */
class RoleFactory extends Factory
{
    protected $model = Role::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'console_org_id' => fake()->uuid(),
            'name' => fake()->words(3, true),
            'slug' => fake()->unique()->slug(2),
            'description' => fake()->optional()->sentence(),
            'level' => fake()->numberBetween(1, 100),
        ];
    }
}
