<?php

namespace Omnify\SsoClient\Tests\Fixtures\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * テスト用Userファクトリー
 */
class UserFactory extends Factory
{
    protected $model = User::class;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => Hash::make('password'),
            'remember_token' => Str::random(10),
            'console_user_id' => fake()->unique()->numberBetween(1, 10000),
        ];
    }

    /**
     * パスワードなしのユーザー
     */
    public function withoutPassword(): static
    {
        return $this->state(fn (array $attributes) => [
            'password' => null,
        ]);
    }

    /**
     * コンソールユーザーIDなしのユーザー
     */
    public function withoutConsoleUserId(): static
    {
        return $this->state(fn (array $attributes) => [
            'console_user_id' => null,
        ]);
    }

    /**
     * 特定のコンソールユーザーID
     */
    public function withConsoleUserId(int $id): static
    {
        return $this->state(fn (array $attributes) => [
            'console_user_id' => $id,
        ]);
    }
}
