<?php

namespace Omnify\SsoClient\Database\Factories;

use Omnify\SsoClient\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

use Omnify\SsoClient\Models\Role;

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
            'name' => fake()->sentence(3),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => fake()->dateTime(),
            'password' => fake()->sentence(),
            'remember_token' => \Illuminate\Support\Str::random(32),
            'console_user_id' => fake()->unique()->numberBetween(1, 1000000),
            'console_access_token' => fake()->paragraphs(3, true),
            'console_refresh_token' => fake()->paragraphs(3, true),
            'console_token_expires_at' => fake()->dateTime(),
            'role_id' => Role::query()->inRandomOrder()->first()?->id,
        ];
    }
}
