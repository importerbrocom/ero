<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activation_codes', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->foreignId('exam_programme_id')->nullable()->constrained()->nullOnDelete();
            $table->string('batch')->nullable()->index();
            $table->boolean('multi_use')->default(false);
            $table->unsignedInteger('max_redemptions')->default(1);
            $table->unsignedInteger('redemption_count')->default(0);
            $table->timestamp('expires_at')->nullable();
            $table->string('status')->default('active')->index(); // active | revoked
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('activation_code_redemptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('activation_code_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('redeemed_at');
            $table->timestamps();

            // A user cannot redeem the same code twice (duplicate-redemption protection).
            $table->unique(['activation_code_id', 'user_id']);
        });

        // Which programmes a student may access (granted via code or admin assignment).
        Schema::create('programme_access', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('exam_programme_id')->constrained()->cascadeOnDelete();
            $table->string('granted_via')->default('activation_code'); // activation_code | admin
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'exam_programme_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('programme_access');
        Schema::dropIfExists('activation_code_redemptions');
        Schema::dropIfExists('activation_codes');
    }
};
