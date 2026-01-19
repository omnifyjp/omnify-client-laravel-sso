<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create all SSO package tables
 * 
 * This migration creates the base tables for the SSO Client package.
 * All tables use UUID primary keys.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Users table
        Schema::create('users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('console_user_id')->nullable()->unique();
            $table->text('console_access_token')->nullable();
            $table->text('console_refresh_token')->nullable();
            $table->timestamp('console_token_expires_at')->nullable();
            $table->timestamps();
        });

        // Roles table
        Schema::create('roles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 100)->unique();
            $table->string('slug', 100)->unique();
            $table->text('description')->nullable();
            $table->integer('level')->default(0);
            $table->timestamps();
        });

        // Role-User pivot table (ManyToMany)
        Schema::create('role_user', function (Blueprint $table) {
            $table->uuid('role_id');
            $table->uuid('user_id');
            $table->timestamps();

            $table->primary(['role_id', 'user_id']);
            $table->foreign('role_id')->references('id')->on('roles')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        // Permissions table
        Schema::create('permissions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 100)->unique();
            $table->string('slug', 100)->unique();
            $table->string('group', 50)->nullable();
            $table->timestamps();
        });

        // Role-Permission pivot table
        Schema::create('role_permissions', function (Blueprint $table) {
            $table->uuid('role_id');
            $table->uuid('permission_id');
            $table->timestamps();

            $table->primary(['role_id', 'permission_id']);
            $table->foreign('role_id')->references('id')->on('roles')->onDelete('cascade');
            $table->foreign('permission_id')->references('id')->on('permissions')->onDelete('cascade');
        });

        // Teams table
        Schema::create('teams', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('console_team_id')->unique();
            $table->string('console_org_id');
            $table->string('name', 100);
            $table->timestamps();
            $table->softDeletes();

            $table->index('console_org_id');
        });

        // Branches table
        Schema::create('branches', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('console_branch_id')->unique();
            $table->string('console_org_id');
            $table->string('code', 20);
            $table->string('name', 100);
            $table->timestamps();
            $table->softDeletes();

            $table->index('console_org_id');
            $table->unique(['console_org_id', 'code']);
        });

        // Team Permissions table
        Schema::create('team_permissions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('console_org_id');
            $table->string('console_team_id');
            $table->uuid('permission_id');
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['console_team_id', 'permission_id']);
            $table->foreign('permission_id')->references('id')->on('permissions')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('team_permissions');
        Schema::dropIfExists('branches');
        Schema::dropIfExists('teams');
        Schema::dropIfExists('role_permissions');
        Schema::dropIfExists('permissions');
        Schema::dropIfExists('role_user');
        Schema::dropIfExists('roles');
        Schema::dropIfExists('users');
    }
};
