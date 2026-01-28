<?php

namespace Omnify\SsoClient\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Omnify\SsoClient\Models\OrganizationCache;

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
            'console_org_id' => fake()->uuid(),
            'name' => fake()->company(),
            'code' => fake()->unique()->regexify('[A-Z0-9]{8}'),
            'is_active' => true,
        ];
    }
}
