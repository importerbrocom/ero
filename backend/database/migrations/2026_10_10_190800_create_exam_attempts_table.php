<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exam_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('exam_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('attempt_number')->default(1);

            // Server-generated, STORED display order of logical block ids for THIS attempt.
            // Stable across refresh/resume. Logical ids are preserved; only presentation
            // order varies. e.g. [7, 2, 14, ...]
            $table->json('block_sequence');

            $table->string('status')->default('in_progress')->index(); // in_progress | completed | expired | abandoned
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();

            // Finalised grading snapshot (populated once grading completes)
            $table->unsignedInteger('total_questions')->default(0);
            $table->unsignedInteger('answered_count')->default(0);
            $table->unsignedInteger('correct_count')->default(0);
            $table->unsignedInteger('incorrect_count')->default(0);
            $table->decimal('accuracy', 5, 2)->nullable();
            $table->json('subject_breakdown')->nullable();
            $table->json('topic_breakdown')->nullable();

            $table->timestamps();

            $table->unique(['user_id', 'exam_id', 'attempt_number'], 'exam_attempts_user_exam_attempt_unique');
            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_attempts');
    }
};
