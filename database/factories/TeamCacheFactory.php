<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Omnify\SsoClient\Models\TeamCache;

/**
 * @extends Factory<TeamCache>
 */
class TeamCacheFactory extends Factory
{
    protected $model = TeamCache::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'console_team_id' => fake()->sentence(),
            'console_org_id' => fake()->sentence(),
            'name' => fake()->sentence(3),
        ];
    }
}
