<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // The canonical pool of questions assigned to a logical block.
        Schema::create('exam_block_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_block_id')->constrained()->cascadeOnDelete();
            $table->foreignId('question_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('canonical_position')->default(0);
            $table->timestamps();

            // A question cannot be duplicated within a block.
            $table->unique(['exam_block_id', 'question_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_block_questions');
    }
};
