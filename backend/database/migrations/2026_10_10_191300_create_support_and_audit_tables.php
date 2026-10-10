<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('announcements', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('body');
            $table->foreignId('exam_programme_id')->nullable()->constrained()->nullOnDelete();
            $table->boolean('is_published')->default(false);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('support_tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('email');
            $table->string('subject');
            $table->text('message');
            $table->string('status')->default('open')->index(); // open | in_progress | resolved
            $table->text('admin_response')->nullable();
            $table->timestamps();
        });

        // Significant admin / system events — §9 audit requirement.
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action');            // e.g. question.updated, code.revoked
            $table->string('subject_type')->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->json('metadata')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();

            $table->index(['subject_type', 'subject_id']);
            $table->index('action');
        });

        Schema::create('question_imports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_programme_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('filename');
            $table->string('status')->default('pending'); // pending | previewed | committed | failed
            $table->unsignedInteger('total_rows')->default(0);
            $table->unsignedInteger('valid_rows')->default(0);
            $table->unsignedInteger('error_rows')->default(0);
            $table->json('errors')->nullable();   // row-level validation errors
            $table->json('preview')->nullable();  // parsed preview rows
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('question_imports');
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('support_tickets');
        Schema::dropIfExists('announcements');
    }
};
