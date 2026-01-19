<?php

namespace Omnify\SsoClient\Database\Factories;

use Omnify\SsoClient\Models\Team;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

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
            'console_team_id' => (string) Str::uuid(),
            'console_org_id' => (string) Str::uuid(),
            'name' => fake()->company() . ' Team',
        ];
    }

    /**
     * Team belonging to a specific organization.
     */
    public function forOrganization(string $orgId): static
    {
        return $this->state(fn () => [
            'console_org_id' => $orgId,
        ]);
    }
}
