<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exam_attempt_blocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_attempt_id')->constrained()->cascadeOnDelete();
            $table->foreignId('exam_block_id')->constrained()->cascadeOnDelete();

            $table->unsignedInteger('display_position'); // position within this attempt's sequence (1..N)

            // Server-authoritative timing. Deadlines computed from server timestamps,
            // never trusting the client clock.
            $table->timestamp('available_at')->nullable();  // scheduled release time
            $table->timestamp('started_at')->nullable();    // when student actually started
            $table->timestamp('deadline_at')->nullable();   // started_at + block_duration (server)
            $table->timestamp('submitted_at')->nullable();

            // locked | available | in_progress | submitted | expired
            $table->string('status')->default('locked')->index();
            $table->boolean('auto_submitted')->default(false);

            $table->unsignedInteger('correct_count')->default(0);
            $table->unsignedInteger('answered_count')->default(0);
            $table->timestamps();

            // Explicit short index names — MySQL caps identifiers at 64 chars.
            $table->unique(['exam_attempt_id', 'exam_block_id'], 'eab_attempt_block_unique');
            $table->unique(['exam_attempt_id', 'display_position'], 'eab_attempt_position_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_attempt_blocks');
    }
};
