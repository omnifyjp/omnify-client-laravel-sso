<?php

namespace Omnify\SsoClient\Database\Factories;

use Omnify\SsoClient\Models\Permission;
use Illuminate\Database\Eloquent\Factories\Factory;


/**
 * @extends Factory<Permission>
 */
class PermissionFactory extends Factory
{
    protected $model = Permission::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->sentence(3),
            'slug' => fake()->unique()->slug(2),
            'group' => fake()->words(3, true),
        ];
    }
}
