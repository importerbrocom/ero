<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exam_attempt_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_attempt_block_id')->constrained()->cascadeOnDelete();
            $table->foreignId('question_id')->constrained()->cascadeOnDelete();

            // Server-stored, stable per-attempt randomisation:
            $table->unsignedInteger('display_position');  // question order within block (1..20)
            // Ordered array of question_option ids as shown to this student.
            // Correct answer is NEVER derived from display letter; grading reads
            // question_options.is_correct for the canonical option id.
            $table->json('option_order');

            // Student response
            $table->foreignId('selected_option_id')->nullable()
                ->constrained('question_options')->nullOnDelete();
            $table->boolean('is_flagged')->default(false);
            $table->boolean('is_correct')->nullable();   // null until graded
            $table->timestamp('answered_at')->nullable();

            $table->timestamps();

            $table->unique(['exam_attempt_block_id', 'question_id']);
            $table->unique(['exam_attempt_block_id', 'display_position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_attempt_questions');
    }
};
