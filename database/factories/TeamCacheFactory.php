<?php

namespace Omnify\SsoClient\Database\Factories;

use Omnify\SsoClient\Models\TeamCache;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

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
            'console_team_id' => (string) Str::uuid(),
            'console_org_id' => (string) Str::uuid(),
            'name' => fake()->words(2, true) . ' Team',
        ];
    }

    /**
     * Create team for specific organization.
     */
    public function forOrganization(string $orgId): static
    {
        return $this->state(fn () => [
            'console_org_id' => $orgId,
        ]);
    }
}
