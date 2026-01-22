<?php

namespace Omnify\SsoClient\Database\Factories;

use Omnify\SsoClient\Models\OrganizationCache;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

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
            'console_org_id' => (string) Str::uuid(),
            'name' => fake()->company(),
            'code' => strtoupper(fake()->unique()->lexify('???')),
            'is_active' => true,
        ];
    }
}
