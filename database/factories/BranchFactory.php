<?php

namespace Omnify\SsoClient\Database\Factories;

use Omnify\SsoClient\Models\Branch;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Branch>
 */
class BranchFactory extends Factory
{
    protected $model = Branch::class;

    public function definition(): array
    {
        return [
            'console_branch_id' => (string) Str::uuid(),
            'console_org_id' => (string) Str::uuid(),
            'code' => strtoupper(fake()->unique()->lexify('???')),
            'name' => fake()->company() . ' Branch',
        ];
    }

    /**
     * Branch belonging to a specific organization.
     */
    public function forOrganization(string $orgId): static
    {
        return $this->state(fn () => [
            'console_org_id' => $orgId,
        ]);
    }

    /**
     * Headquarters branch.
     */
    public function headquarters(): static
    {
        return $this->state(fn () => [
            'code' => 'HQ',
            'name' => 'Headquarters',
        ]);
    }
}
