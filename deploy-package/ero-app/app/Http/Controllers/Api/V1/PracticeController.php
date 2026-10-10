<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\PracticeDay;
use App\Models\PracticeEnrollment;
use App\Models\Question;
use App\Services\PracticeEngine;
use Illuminate\Http\Request;
use RuntimeException;

class PracticeController extends Controller
{
    public function __construct(private PracticeEngine $engine)
    {
    }

    /** Enrol in (or fetch) a daily-practice plan and return the plan overview. */
    public function enroll(Request $request, Exam $exam)
    {
        $user = $request->user();
        abort_unless($exam->status === 'published', 404);
        abort_unless($user->canAccessProgramme($exam->exam_programme_id), 403,
            'You do not have access to this programme.');

        try {
            $enrollment = $this->engine->enroll($user, $exam);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['data' => $this->planPayload($enrollment)]);
    }

    /** Overview of the student's enrollment (progress, streak, per-day status). */
    public function show(Request $request, PracticeEnrollment $enrollment)
    {
        $this->authorizeEnrollment($request, $enrollment);
        return response()->json(['data' => $this->planPayload($enrollment)]);
    }

    /** Fetch (building if needed) a specific study day's quiz. */
    public function day(Request $request, PracticeEnrollment $enrollment, int $day)
    {
        $this->authorizeEnrollment($request, $enrollment);

        try {
            $practiceDay = $this->engine->getOrBuildDay($enrollment, $day);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['data' => $this->dayPayload($practiceDay, $enrollment)]);
    }

    /** Submit a day's answers and get graded results. */
    public function submitDay(Request $request, PracticeEnrollment $enrollment, PracticeDay $day)
    {
        $this->authorizeEnrollment($request, $enrollment);
        abort_unless($day->practice_enrollment_id === $enrollment->id, 404);

        $data = $request->validate([
            'responses' => ['present', 'array'], // { question_id: option_id }
        ]);

        try {
            $day = $this->engine->submitDay($day, $data['responses']);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'data' => $this->dayPayload($day->fresh(), $enrollment->fresh(), reveal: true),
            'enrollment' => $this->planPayload($enrollment->fresh()),
        ]);
    }

    // ---- payloads ----

    private function planPayload(PracticeEnrollment $enrollment): array
    {
        $exam = $enrollment->exam;
        $planDays = $exam->plan_days ?? 14;
        $days = $enrollment->days()->get()->keyBy('day_number');

        $schedule = [];
        for ($d = 1; $d <= $planDays; $d++) {
            $record = $days->get($d);
            $schedule[] = [
                'day_number' => $d,
                'status' => $record?->status
                    ?? ($d <= $enrollment->current_day ? 'available' : 'locked'),
                'accuracy' => $record?->accuracy !== null ? (float) $record->accuracy : null,
                'correct_count' => $record?->correct_count,
                'answered_count' => $record?->answered_count,
                'completed_at' => $record?->completed_at?->toIso8601String(),
            ];
        }

        return [
            'enrollment_id' => $enrollment->id,
            'exam_id' => $exam->id,
            'title' => $exam->title,
            'plan_days' => $planDays,
            'questions_per_day' => $exam->questions_per_day ?? 10,
            'timer_enabled' => $exam->timer_enabled,
            'allow_retry' => $exam->allow_retry,
            'current_day' => $enrollment->current_day,
            'streak' => $enrollment->streak,
            'best_streak' => $enrollment->best_streak,
            'last_completed_date' => $enrollment->last_completed_date?->toDateString(),
            'completed_days' => $enrollment->days()->where('status', 'completed')->count(),
            'schedule' => $schedule,
        ];
    }

    private function dayPayload(PracticeDay $day, PracticeEnrollment $enrollment, bool $reveal = false): array
    {
        $exam = $enrollment->exam;
        // Reveal explanations when the day is completed and the plan permits it.
        $revealAnswers = $reveal
            || ($day->status === 'completed' && $exam->result_visibility !== 'never_during');

        $questionIds = $day->question_ids ?? [];
        $optionOrders = $day->option_orders ?? [];
        $responses = $day->responses ?? [];

        $questions = Question::with('options', 'subject:id,name', 'topic:id,name')
            ->whereIn('id', $questionIds)
            ->get()
            ->keyBy('id');

        $letters = range('A', 'Z');
        $items = [];
        foreach ($questionIds as $position => $qid) {
            $q = $questions->get($qid);
            if (! $q) {
                continue;
            }
            $byId = $q->options->keyBy('id');
            $order = $optionOrders[$qid] ?? $q->options->pluck('id')->all();

            $options = [];
            foreach ($order as $i => $oid) {
                $opt = $byId->get($oid);
                if (! $opt) {
                    continue;
                }
                $row = ['id' => $opt->id, 'letter' => $letters[$i] ?? '?', 'text' => $opt->text];
                if ($revealAnswers) {
                    $row['is_correct'] = $opt->is_correct;
                }
                $options[] = $row;
            }

            $item = [
                'question_id' => $qid,
                'display_position' => $position + 1,
                'stem' => $q->stem,
                'image_url' => $q->image_url,
                'subject' => $q->subject?->name,
                'topic' => $q->topic?->name,
                'difficulty' => $q->difficulty,
                'options' => $options,
                'selected_option_id' => $responses[$qid] ?? null,
            ];
            if ($revealAnswers) {
                $item['explanation'] = $q->explanation;
                $item['key_points'] = $q->key_points;
                $item['high_yield_fact'] = $q->high_yield_fact;
            }
            $items[] = $item;
        }

        return [
            'id' => $day->id,
            'day_number' => $day->day_number,
            'status' => $day->status,
            'timer_enabled' => $exam->timer_enabled,
            'correct_count' => $day->status === 'completed' ? $day->correct_count : null,
            'answered_count' => $day->status === 'completed' ? $day->answered_count : null,
            'accuracy' => $day->status === 'completed' && $day->accuracy !== null ? (float) $day->accuracy : null,
            'questions' => $items,
        ];
    }

    private function authorizeEnrollment(Request $request, PracticeEnrollment $enrollment): void
    {
        abort_unless($enrollment->user_id === $request->user()->id, 403);
    }
}
