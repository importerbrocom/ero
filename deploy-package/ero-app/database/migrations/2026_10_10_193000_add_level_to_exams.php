<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exams', function (Blueprint $table) {
            // For FMGE level mocks: which level (1..6) this exam belongs to.
            // Null for non-levelled exams (full_mock, daily_practice).
            $table->unsignedInteger('level')->nullable()->after('type')->index();
        });
    }

    public function down(): void
    {
        Schema::table('exams', function (Blueprint $table) {
            $table->dropColumn('level');
        });
    }
};
