<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exam_programmes', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();          // fmge, usmle, plab, amc...
            $table->string('name');                    // "FMGE"
            $table->string('full_name');               // "Foreign Medical Graduate Examination"
            $table->string('country')->nullable();     // "India", "United States"
            $table->string('flag_emoji')->nullable();
            $table->text('description')->nullable();
            $table->string('accent_color')->default('#2563EB');
            $table->string('cover_image_url')->nullable();
            // Fully data-driven configuration (durations, blocks, counts, schedules,
            // retry/visibility rules). Nothing about exam structure is hard-coded in
            // application/UI code — see ProgrammeConfig value object.
            $table->json('config');
            $table->string('status')->default('draft')->index(); // draft | published | archived
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_programmes');
    }
};
