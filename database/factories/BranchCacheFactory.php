<?php

namespace Database\Factories;

use Omnify\SsoClient\Models\BranchCache;
use Illuminate\Database\Eloquent\Factories\Factory;


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
            'console_branch_id' => fake()->sentence(),
            'console_org_id' => fake()->sentence(),
            'code' => fake()->unique()->regexify('[A-Z0-9]{8}'),
            'name' => fake()->sentence(3),
            'is_headquarters' => fake()->boolean(),
            'is_active' => fake()->boolean(),
        ];
    }
}
