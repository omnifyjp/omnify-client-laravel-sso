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
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'console_user_id' => (string) \Illuminate\Support\Str::uuid(),
            'console_access_token' => \Illuminate\Support\Str::random(100),
            'console_refresh_token' => \Illuminate\Support\Str::random(100),
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

    /**
     * User without console user ID (local user, not SSO linked).
     */
    public function withoutConsoleUserId(): static
    {
        return $this->state(fn () => [
            'console_user_id' => null,
            'console_access_token' => null,
            'console_refresh_token' => null,
            'console_token_expires_at' => null,
        ]);
    }

    /**
     * User with specific role (alias for withRole).
     */
    public function withRole(string $roleSlug): static
    {
        return $this->afterCreating(function (UserCache $user) use ($roleSlug) {
            $user->assignRole($roleSlug);
        });
    }

    /**
     * Unverified user (SSO users are verified via Console - this is a no-op for compatibility).
     */
    public function unverified(): static
    {
        // No-op - SSO users are always verified via Console
        return $this;
    }
}
