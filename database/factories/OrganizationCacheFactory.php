<?php

namespace Database\Factories;

use Omnify\SsoClient\Models\OrganizationCache;
use Illuminate\Database\Eloquent\Factories\Factory;


/**
 * @extends Factory<OrganizationCache>
 */
class OrganizationCacheFactory extends Factory
{
    protected $model = OrganizationCache::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'console_org_id' => fake()->sentence(),
            'name' => fake()->sentence(3),
            'code' => fake()->unique()->regexify('[A-Z0-9]{8}'),
            'is_active' => fake()->boolean(),
        ];
    }
}
