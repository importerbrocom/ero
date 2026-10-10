<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // A student's enrolment into a daily-practice plan for a given exam.
        // Kept separate from full-mock history so neither overwrites the other.
        Schema::create('practice_enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('exam_id')->constrained()->cascadeOnDelete(); // daily_practice exam
            $table->unsignedInteger('current_day')->default(1);
            $table->unsignedInteger('streak')->default(0);
            $table->unsignedInteger('best_streak')->default(0);
            $table->date('last_completed_date')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'exam_id']);
        });

        // One record per study day = one quiz the student takes that day.
        Schema::create('practice_days', function (Blueprint $table) {
            $table->id();
            $table->foreignId('practice_enrollment_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('day_number');       // 1..plan_days
            $table->foreignId('exam_block_id')->nullable()->constrained()->nullOnDelete(); // logical block mapped (randomised, not fixed)
            $table->json('question_ids');                 // the day's assigned question pool
            $table->json('option_orders')->nullable();    // per-question shuffled option ids
            $table->json('responses')->nullable();        // question_id => selected_option_id
            $table->string('status')->default('pending')->index(); // pending | completed
            $table->unsignedInteger('correct_count')->default(0);
            $table->unsignedInteger('answered_count')->default(0);
            $table->decimal('accuracy', 5, 2)->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['practice_enrollment_id', 'day_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('practice_days');
        Schema::dropIfExists('practice_enrollments');
    }
};
