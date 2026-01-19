<?php

namespace Omnify\SsoClient\Database\Factories;

use Omnify\SsoClient\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected $model = User::class;

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
            'console_user_id' => (string) Str::uuid(),
            'console_access_token' => Str::random(100),
            'console_refresh_token' => Str::random(100),
            'console_token_expires_at' => now()->addHour(),
        ];
    }

    /**
     * User without console tokens (new user).
     */
    public function withoutTokens(): static
    {
        return $this->state(fn () => [
            'console_access_token' => null,
            'console_refresh_token' => null,
            'console_token_expires_at' => null,
        ]);
    }

    /**
     * User with expired tokens.
     */
    public function withExpiredTokens(): static
    {
        return $this->state(fn () => [
            'console_token_expires_at' => now()->subHour(),
        ]);
    }
}
