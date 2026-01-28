<?php

namespace Omnify\SsoClient\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Omnify\SsoClient\Models\BranchCache;

/**
 * @extends Factory<BranchCache>
 */
class BranchCacheFactory extends Factory
{
    protected $model = BranchCache::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'console_branch_id' => fake()->uuid(),
            'console_org_id' => fake()->uuid(),
            'code' => fake()->unique()->regexify('[A-Z0-9]{8}'),
            'name' => fake()->company().' Branch',
            'is_headquarters' => fake()->boolean(20),
            'is_active' => true,
        ];
    }
}
