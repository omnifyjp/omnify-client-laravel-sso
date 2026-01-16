<?php

namespace Database\Factories;

use Omnify\SsoClient\Models\Team;
use Illuminate\Database\Eloquent\Factories\Factory;


/**
 * @extends Factory<Team>
 */
class TeamFactory extends Factory
{
    protected $model = Team::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'console_team_id' => fake()->unique()->numberBetween(1, 1000000),
            'console_org_id' => fake()->numberBetween(1, 1000),
            'name' => fake()->sentence(3),
        ];
    }
}
