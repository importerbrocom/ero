<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Logical block. Its logical_number is STABLE and independent of the
        // position in which it is displayed to a given student (per attempt).
        Schema::create('exam_blocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('logical_number'); // 1..N — never changes
            $table->string('label')->nullable();       // optional admin label
            $table->timestamps();

            $table->unique(['exam_id', 'logical_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_blocks');
    }
};
