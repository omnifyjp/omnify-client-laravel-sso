<?php

namespace Omnify\SsoClient\Database\Factories;

use Omnify\SsoClient\Models\Branch;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Branch>
 */
class BranchFactory extends Factory
{
    protected $model = Branch::class;

    public function definition(): array
    {
        return [
            'console_branch_id' => fake()->unique()->numberBetween(1, 1000000),
            'console_org_id' => fake()->numberBetween(1, 1000),
            'code' => strtoupper(fake()->unique()->lexify('???')),
            'name' => fake()->company() . ' Branch',
            'is_headquarters' => false,
            'is_active' => true,
        ];
    }

    public function headquarters(): static
    {
        return $this->state(fn (array $attributes) => [
            'code' => 'HQ',
            'is_headquarters' => true,
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
