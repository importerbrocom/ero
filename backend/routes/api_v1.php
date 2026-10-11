<?php

use App\Http\Controllers\Api\V1\ActivationController;
use App\Http\Controllers\Api\V1\Admin;
use App\Http\Controllers\Api\V1\AnalyticsController;
use App\Http\Controllers\Api\V1\AttemptController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\EmailVerificationController;
use App\Http\Controllers\Api\V1\LevelController;
use App\Http\Controllers\Api\V1\PasswordResetController;
use App\Http\Controllers\Api\V1\PracticeController;
use App\Http\Controllers\Api\V1\ProgrammeController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API v1 route definitions
|--------------------------------------------------------------------------
*/

// --- Public auth ---
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// --- Password reset (public) ---
Route::post('/auth/forgot-password', [PasswordResetController::class, 'forgot']);
Route::post('/auth/reset-password', [PasswordResetController::class, 'reset']);

// --- Email verification: signed link target (public, signature-protected) ---
Route::get('/auth/verify-email/{id}/{hash}', [EmailVerificationController::class, 'verify'])
    ->middleware('signed')
    ->name('verification.verify');

// --- Public programme browsing (reads has_access when authenticated) ---
Route::get('/programmes', [ProgrammeController::class, 'index']);
Route::get('/programmes/{programme}', [ProgrammeController::class, 'show']);

// --- Public site settings (welcome banner image, etc.) ---
Route::get('/settings', fn () => response()->json(['data' => \App\Models\Setting::publicSettings()]));

// --- Authenticated (Sanctum) ---
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Email verification (authenticated)
    Route::get('/auth/email/status', [EmailVerificationController::class, 'status']);
    Route::post('/auth/email/resend', [EmailVerificationController::class, 'resend']);

    // Activation codes
    Route::post('/activation/redeem', [ActivationController::class, 'redeem']);

    // Exam engine (student)
    Route::post('/exams/{exam}/attempts', [AttemptController::class, 'start']);
    Route::get('/attempts/{attempt}', [AttemptController::class, 'show']);
    Route::post('/attempts/{attempt}/blocks/{block}/start', [AttemptController::class, 'startBlock']);
    Route::get('/attempts/{attempt}/blocks/{block}/questions', [AttemptController::class, 'blockQuestions']);
    Route::post('/attempts/{attempt}/blocks/{block}/answer', [AttemptController::class, 'answer']);
    Route::post('/attempts/{attempt}/blocks/{block}/submit', [AttemptController::class, 'submitBlock']);

    // Daily practice runtime (§5.9 / §6)
    Route::post('/exams/{exam}/practice/enroll', [PracticeController::class, 'enroll']);
    Route::get('/practice/{enrollment}', [PracticeController::class, 'show']);
    Route::get('/practice/{enrollment}/days/{day}', [PracticeController::class, 'day']);
    Route::post('/practice/{enrollment}/days/{day}/submit', [PracticeController::class, 'submitDay']);

    // Student analytics (screenshot 12)
    Route::get('/analytics/overview', [AnalyticsController::class, 'overview']);
    Route::get('/analytics/attempts', [AnalyticsController::class, 'attempts']);

    // FMGE level ladder (§6)
    Route::get('/programmes/{programme}/levels', [LevelController::class, 'index']);
});

/*
|--------------------------------------------------------------------------
| Admin API — all gated server-side by the role middleware (§4, §9)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function () {
    Route::get('/overview', [Admin\DashboardController::class, 'overview']);

    // Students
    Route::get('/students', [Admin\StudentController::class, 'index']);
    Route::get('/students/{student}', [Admin\StudentController::class, 'show']);
    Route::patch('/students/{student}/status', [Admin\StudentController::class, 'updateStatus']);
    Route::post('/students/{student}/programmes', [Admin\StudentController::class, 'assignProgramme']);

    // Questions
    Route::get('/questions', [Admin\QuestionController::class, 'index']);
    Route::post('/questions', [Admin\QuestionController::class, 'store']);
    Route::get('/questions/{question}', [Admin\QuestionController::class, 'show']);
    Route::put('/questions/{question}', [Admin\QuestionController::class, 'update']);
    Route::delete('/questions/{question}', [Admin\QuestionController::class, 'archive']);

    // Question import (CSV/XLSX, two-phase)
    Route::get('/imports', [Admin\ImportController::class, 'index']);
    Route::get('/imports/template', [Admin\ImportController::class, 'template']);
    Route::post('/imports/preview', [Admin\ImportController::class, 'preview']);
    Route::post('/imports/{import}/commit', [Admin\ImportController::class, 'commit']);

    // Programmes & exam configuration
    Route::get('/programmes', [Admin\ProgrammeAdminController::class, 'index']);
    Route::post('/programmes', [Admin\ProgrammeAdminController::class, 'store']);
    Route::put('/programmes/{programme}', [Admin\ProgrammeAdminController::class, 'update']);
    Route::post('/programmes/{programme}/exams', [Admin\ProgrammeAdminController::class, 'upsertExam']);

    // Activation codes
    Route::get('/activation-codes', [Admin\ActivationCodeController::class, 'index']);
    Route::post('/activation-codes', [Admin\ActivationCodeController::class, 'generate']);
    Route::post('/activation-codes/{activationCode}/revoke', [Admin\ActivationCodeController::class, 'revoke']);

    // Audit logs
    Route::get('/audit-logs', [Admin\AuditLogController::class, 'index']);

    // Image uploads (programme covers, welcome banner, question images)
    Route::post('/uploads', [Admin\UploadController::class, 'store']);

    // Site settings (student welcome banner, etc.)
    Route::get('/settings', [Admin\SettingsController::class, 'index']);
    Route::put('/settings', [Admin\SettingsController::class, 'update']);
});
