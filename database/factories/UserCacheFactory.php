<?php

namespace Omnify\SsoClient\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Omnify\SsoClient\Models\UserCache;

/**
 * @extends Factory<UserCache>
 */
class UserCacheFactory extends Factory
{
    protected $model = UserCache::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'console_user_id' => fake()->uuid(),
            'console_org_id' => fake()->uuid(),
            'console_access_token' => fake()->sha256(),
            'console_refresh_token' => fake()->sha256(),
            'console_token_expires_at' => fake()->dateTimeBetween('now', '+1 year'),
        ];
    }
}
