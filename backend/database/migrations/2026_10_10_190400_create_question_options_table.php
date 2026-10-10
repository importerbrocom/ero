<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('question_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('question_id')->constrained()->cascadeOnDelete();
            $table->longText('text');
            // Stable identity of the option, independent of any displayed letter.
            // Correctness is ALWAYS derived from is_correct on this canonical row,
            // never from a display position/letter sent to the client.
            $table->boolean('is_correct')->default(false);
            $table->unsignedInteger('canonical_order')->default(0); // original authored order
            $table->timestamps();

            $table->index('question_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('question_options');
    }
};
