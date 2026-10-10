<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_programme_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subject_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('topic_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('author_id')->nullable()->constrained('users')->nullOnDelete();

            $table->longText('stem');                       // question text
            $table->string('difficulty')->default('medium'); // easy | medium | hard
            $table->longText('explanation')->nullable();
            $table->json('key_points')->nullable();         // bullet list for review panel
            $table->text('high_yield_fact')->nullable();
            $table->string('image_url')->nullable();
            $table->json('tags')->nullable();

            $table->string('status')->default('draft')->index(); // draft | active | archived
            $table->unsignedInteger('version')->default(1);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['exam_programme_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('questions');
    }
};
