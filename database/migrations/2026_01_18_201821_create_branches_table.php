<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('branches', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('console_branch_id')->unique()->unsigned();
            $table->bigInteger('console_org_id')->unsigned();
            $table->string('code', 20);
            $table->string('name', 100);
            $table->boolean('is_headquarters')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('console_org_id');
            $table->unique(['console_org_id', 'code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('branches');
    }
};
