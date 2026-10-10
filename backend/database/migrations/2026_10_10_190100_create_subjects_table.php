<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subjects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_programme_id')->constrained()->cascadeOnDelete();
            $table->string('name');               // Anatomy, Physiology...
            $table->string('slug');
            $table->string('icon')->nullable();   // lucide icon key for the UI
            $table->string('color')->default('#2563EB');
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['exam_programme_id', 'slug']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subjects');
    }
};
