<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exam_programmes', function (Blueprint $table) {
            // Optional uploaded flag/badge image (circular flag like the
            // screenshots). flag_emoji remains as a text fallback.
            $table->string('flag_image_url')->nullable()->after('flag_emoji');
        });
    }

    public function down(): void
    {
        Schema::table('exam_programmes', function (Blueprint $table) {
            $table->dropColumn('flag_image_url');
        });
    }
};
