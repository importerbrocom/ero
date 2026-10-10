<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ExamAttempt;
use App\Models\PracticeDay;
use App\Models\PracticeEnrollment;
use Illuminate\Http\Request;

/**
 * Student analytics (screenshot 12): overall accuracy, questions/correct/
 * incorrect, accuracy trend, subject & topic breakdowns, mock-test scores,
 * streaks. All values are derived from the student's OWN completed attempts and
 * practice days — never fabricated.
 */
class AnalyticsController extends Controller
{
    public function overview(Request $request)
    {
        $user = $request->user();
        $programmeId = $request->query('programme_id');

        $attempts = ExamAttempt::where('user_id', $user->id)
            ->where('status', 'completed')
            ->when($programmeId, fn ($q) => $q->whereHas('exam',
                fn ($e) => $e->where('exam_programme_id', $programmeId)))
            ->with('exam:id,title,type,exam_programme_id')
            ->orderBy('completed_at')
            ->get();

        $practiceDays = PracticeDay::whereHas('enrollment',
            fn ($q) => $q->where('user_id', $user->id)
                ->when($programmeId, fn ($qq) => $qq->whereHas('exam',
                    fn ($e) => $e->where('exam_programme_id', $programmeId))))
            ->where('status', 'completed')
            ->orderBy('completed_at')
            ->get();

        // ---- Aggregate totals across mocks + practice ----
        $totalQuestions = $attempts->sum('total_questions') + $practiceDays->sum(fn ($d) => count($d->question_ids ?? []));
        $correct = $attempts->sum('correct_count') + $practiceDays->sum('correct_count');
        $answered = $attempts->sum('answered_count') + $practiceDays->sum('answered_count');
        $incorrect = max(0, $answered - $correct);
        $overallAccuracy = $totalQuestions > 0 ? round($correct / $totalQuestions * 100, 1) : 0.0;

        // ---- Subject + topic breakdown (merge mock breakdowns) ----
        $subjects = [];
        foreach ($attempts as $a) {
            foreach (($a->subject_breakdown ?? []) as $name => $v) {
                $subjects[$name]['total'] = ($subjects[$name]['total'] ?? 0) + ($v['total'] ?? 0);
                $subjects[$name]['correct'] = ($subjects[$name]['correct'] ?? 0) + ($v['correct'] ?? 0);
            }
        }
        $subjectAccuracy = collect($subjects)->map(fn ($v, $name) => [
            'subject' => $name,
            'total' => $v['total'],
            'correct' => $v['correct'],
            'accuracy' => $v['total'] > 0 ? round($v['correct'] / $v['total'] * 100, 1) : 0,
        ])->values();

        $topics = [];
        foreach ($attempts as $a) {
            foreach (($a->topic_breakdown ?? []) as $name => $v) {
                $topics[$name]['total'] = ($topics[$name]['total'] ?? 0) + ($v['total'] ?? 0);
                $topics[$name]['correct'] = ($topics[$name]['correct'] ?? 0) + ($v['correct'] ?? 0);
            }
        }
        $topicAccuracy = collect($topics)->map(fn ($v, $name) => [
            'topic' => $name,
            'total' => $v['total'],
            'correct' => $v['correct'],
            'accuracy' => $v['total'] > 0 ? round($v['correct'] / $v['total'] * 100, 1) : 0,
        ])->sortByDesc('total')->take(15)->values();

        // ---- Accuracy trend (per completed activity, chronological) ----
        $trend = $attempts->map(fn ($a) => [
            'label' => $a->completed_at?->format('d M'),
            'date' => $a->completed_at?->toDateString(),
            'accuracy' => (float) $a->accuracy,
            'kind' => 'mock',
            'title' => $a->exam->title,
        ])->concat($practiceDays->map(fn ($d) => [
            'label' => $d->completed_at?->format('d M'),
            'date' => $d->completed_at?->toDateString(),
            'accuracy' => (float) $d->accuracy,
            'kind' => 'practice',
            'title' => "Day {$d->day_number}",
        ]))->sortBy('date')->values();

        // ---- Mock-test performance (bar chart) ----
        $mockScores = $attempts->map(fn ($a) => [
            'title' => $a->exam->title,
            'accuracy' => (float) $a->accuracy,
            'completed_at' => $a->completed_at?->toDateString(),
        ])->values();

        // ---- Streaks (best across the student's practice enrollments) ----
        $enrollQuery = PracticeEnrollment::where('user_id', $user->id)
            ->when($programmeId, fn ($q) => $q->whereHas('exam',
                fn ($e) => $e->where('exam_programme_id', $programmeId)));
        $currentStreak = (int) (clone $enrollQuery)->max('streak');
        $bestStreak = (int) (clone $enrollQuery)->max('best_streak');
        $daysCompleted = $practiceDays->count();

        return response()->json([
            'data' => [
                'overall_accuracy' => $overallAccuracy,
                'questions_attempted' => $answered,
                'questions_total' => $totalQuestions,
                'correct' => $correct,
                'incorrect' => $incorrect,
                'mock_attempts' => $attempts->count(),
                'current_streak' => $currentStreak,
                'best_streak' => $bestStreak,
                'days_completed' => $daysCompleted,
                'subject_accuracy' => $subjectAccuracy,
                'topic_accuracy' => $topicAccuracy,
                'accuracy_trend' => $trend,
                'mock_scores' => $mockScores,
                'has_activity' => $attempts->count() > 0 || $practiceDays->count() > 0,
            ],
        ]);
    }

    /** The student's attempt history for the Tests page. */
    public function attempts(Request $request)
    {
        $user = $request->user();

        $attempts = ExamAttempt::where('user_id', $user->id)
            ->with('exam:id,title,type,exam_programme_id', 'exam.programme:id,name,flag_emoji')
            ->latest()
            ->paginate(20);

        return response()->json([
            'data' => collect($attempts->items())->map(fn ($a) => [
                'id' => $a->id,
                'exam_title' => $a->exam->title,
                'exam_type' => $a->exam->type,
                'programme' => $a->exam->programme?->name,
                'flag_emoji' => $a->exam->programme?->flag_emoji,
                'status' => $a->status,
                'accuracy' => $a->status === 'completed' ? (float) $a->accuracy : null,
                'correct_count' => $a->correct_count,
                'total_questions' => $a->total_questions,
                'started_at' => $a->started_at?->toIso8601String(),
                'completed_at' => $a->completed_at?->toIso8601String(),
            ]),
            'meta' => [
                'current_page' => $attempts->currentPage(),
                'last_page' => $attempts->lastPage(),
                'total' => $attempts->total(),
            ],
        ]);
    }
}
