<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // An "exam" is a concrete assessable instance within a programme:
        // a full mock (e.g. USMLE 14x20=280), a level mock (FMGE 300), a
        // daily-practice template, or a subject/custom test.
        Schema::create('exams', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_programme_id')->constrained()->cascadeOnDelete();
            $table->string('type')->index(); // full_mock | level_mock | daily_practice | subject_test
            $table->string('title');
            $table->text('description')->nullable();

            // Structure (data-driven, validated before publish):
            $table->unsignedInteger('block_count')->default(1);
            $table->unsignedInteger('questions_per_block')->default(20);
            $table->unsignedInteger('block_duration_minutes')->default(30);
            // Release schedule: interval minutes + mode (from_start | from_completion)
            $table->unsignedInteger('block_release_interval_minutes')->default(55);
            $table->string('block_release_mode')->default('from_start'); // from_start | from_completion

            // Rules
            $table->boolean('randomize_block_order')->default(true);
            $table->boolean('randomize_questions')->default(true);
            $table->boolean('randomize_options')->default(true);
            $table->boolean('allow_retry')->default(false);
            $table->unsignedInteger('max_attempts')->nullable();
            // When answers/explanations become visible: never_during | after_block | after_exam | immediate
            $table->string('result_visibility')->default('after_exam');
            $table->boolean('timer_enabled')->default(true);
            $table->boolean('allow_flagging')->default(true);
            $table->boolean('require_unique_questions')->default(true);

            // For daily practice plans
            $table->unsignedInteger('plan_days')->nullable();            // e.g. 14 or 30
            $table->unsignedInteger('questions_per_day')->nullable();    // e.g. 20 or 10

            $table->string('status')->default('draft')->index(); // draft | published | archived
            $table->timestamps();
            $table->softDeletes();

            $table->index(['exam_programme_id', 'type', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exams');
    }
};
