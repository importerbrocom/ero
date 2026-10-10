<?php

use App\Http\Controllers\Api\V1\ActivationController;
use App\Http\Controllers\Api\V1\AttemptController;
use App\Http\Controllers\Api\V1\AuthController;
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

// --- Public programme browsing (reads has_access when authenticated) ---
Route::get('/programmes', [ProgrammeController::class, 'index']);
Route::get('/programmes/{programme}', [ProgrammeController::class, 'show']);

// --- Authenticated (Sanctum) ---
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Activation codes
    Route::post('/activation/redeem', [ActivationController::class, 'redeem']);

    // Exam engine (student)
    Route::post('/exams/{exam}/attempts', [AttemptController::class, 'start']);
    Route::get('/attempts/{attempt}', [AttemptController::class, 'show']);
    Route::post('/attempts/{attempt}/blocks/{block}/start', [AttemptController::class, 'startBlock']);
    Route::get('/attempts/{attempt}/blocks/{block}/questions', [AttemptController::class, 'blockQuestions']);
    Route::post('/attempts/{attempt}/blocks/{block}/answer', [AttemptController::class, 'answer']);
    Route::post('/attempts/{attempt}/blocks/{block}/submit', [AttemptController::class, 'submitBlock']);
});
