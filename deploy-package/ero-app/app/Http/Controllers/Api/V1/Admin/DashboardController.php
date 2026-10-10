<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\ExamAttempt;
use App\Models\ExamProgramme;
use App\Models\Question;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function overview()
    {
        $completed = ExamAttempt::where('status', 'completed');

        return response()->json([
            'data' => [
                'students' => [
                    'total' => User::where('role', 'student')->count(),
                    'active' => User::where('role', 'student')->where('status', 'active')->count(),
                    'new_last_30_days' => User::where('role', 'student')
                        ->where('created_at', '>=', now()->subDays(30))->count(),
                ],
                'attempts' => [
                    'total' => ExamAttempt::count(),
                    'completed' => (clone $completed)->count(),
                    'in_progress' => ExamAttempt::where('status', 'in_progress')->count(),
                    'average_accuracy' => round((float) (clone $completed)->avg('accuracy'), 1),
                ],
                'content' => [
                    'programmes' => ExamProgramme::count(),
                    'questions' => Question::count(),
                    'active_questions' => Question::where('status', 'active')->count(),
                ],
                'programme_performance' => ExamProgramme::query()
                    ->get()
                    ->map(fn ($p) => [
                        'id' => $p->id,
                        'name' => $p->name,
                        'questions' => $p->questions()->count(),
                        'attempts' => ExamAttempt::whereHas('exam', fn ($q) => $q->where('exam_programme_id', $p->id))->count(),
                    ]),
                'recent_activity' => AuditLog::with('user:id,name')
                    ->latest()->limit(10)->get()
                    ->map(fn ($log) => [
                        'id' => $log->id,
                        'action' => $log->action,
                        'user' => $log->user?->name,
                        'at' => $log->created_at->toIso8601String(),
                    ]),
            ],
        ]);
    }
}
