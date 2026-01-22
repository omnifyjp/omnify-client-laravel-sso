<?php

namespace Omnify\SsoClient\Database\Factories;

use Omnify\SsoClient\Models\BranchCache;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

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
            'console_branch_id' => (string) Str::uuid(),
            'console_org_id' => (string) Str::uuid(),
            'code' => strtoupper(fake()->unique()->lexify('???')),
            'name' => fake()->company() . ' Branch',
            'is_headquarters' => false,
            'is_active' => true,
        ];
    }

    /**
     * Create branch for specific organization.
     */
    public function forOrganization(string $orgId): static
    {
        return $this->state(fn () => [
            'console_org_id' => $orgId,
        ]);
    }

    /**
     * Create headquarters branch.
     */
    public function headquarters(): static
    {
        return $this->state(fn () => [
            'code' => 'HQ',
            'name' => 'Headquarters',
            'is_headquarters' => true,
        ]);
    }
}
