<?php

namespace Omnify\SsoClient\Database\Factories;

use Omnify\SsoClient\Models\UserCache;
use Illuminate\Database\Eloquent\Factories\Factory;


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
            'name' => fake()->sentence(3),
            'email' => fake()->unique()->safeEmail(),
            'console_user_id' => fake()->sentence(),
            'console_org_id' => fake()->sentence(),
            'console_access_token' => fake()->paragraphs(3, true),
            'console_refresh_token' => fake()->paragraphs(3, true),
            'console_token_expires_at' => fake()->dateTime(),
        ];
    }
}
