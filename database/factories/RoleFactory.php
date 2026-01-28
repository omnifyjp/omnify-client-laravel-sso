<?php

namespace Omnify\SsoClient\Database\Factories;

use Omnify\SsoClient\Models\Role;
use Illuminate\Database\Eloquent\Factories\Factory;


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
            'console_org_id' => fake()->words(3, true),
            'name' => fake()->sentence(3),
            'slug' => fake()->unique()->slug(2),
            'description' => fake()->paragraphs(3, true),
            'level' => fake()->numberBetween(1, 1000),
        ];
    }
}
