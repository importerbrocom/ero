<?php

namespace App\Services;

use App\Models\Exam;
use App\Models\PracticeDay;
use App\Models\PracticeEnrollment;
use App\Models\Question;
use App\Models\QuestionOption;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Daily-practice runtime (§5.9 USMLE / §6 FMGE).
 *
 * Kept DELIBERATELY separate from the full-mock ExamEngine so practice history
 * never overwrites mock history (§5.9). Reuses the same randomisation
 * philosophy as ExamEngine (secure shuffle, server-stored stable order).
 *
 * A daily-practice Exam defines:
 *   - plan_days          (e.g. 14 or 30)
 *   - questions_per_day  (e.g. 20 or 10)
 *   - timer_enabled, allow_retry, result_visibility (reveal explanations)
 *
 * Each study day draws a fresh pool of questions from the programme's active
 * bank. Day→block mapping is NOT fixed (§5.9: "do not permanently map Study
 * Day 1 to logical Block 1").
 */
class PracticeEngine
{
    /** Enrol the student (idempotent) in a daily-practice exam. */
    public function enroll(User $user, Exam $exam): PracticeEnrollment
    {
        if ($exam->type !== Exam::TYPE_DAILY_PRACTICE) {
            throw new RuntimeException('This exam is not a daily-practice plan.');
        }

        return PracticeEnrollment::firstOrCreate(
            ['user_id' => $user->id, 'exam_id' => $exam->id],
            ['current_day' => 1, 'streak' => 0, 'best_streak' => 0],
        );
    }

    /**
     * Return (building if necessary) the quiz for a given study day.
     * The day's questions + option orders are generated once and stored, so the
     * quiz is stable across refresh/resume.
     */
    public function getOrBuildDay(PracticeEnrollment $enrollment, int $dayNumber): PracticeDay
    {
        $exam = $enrollment->exam;
        $planDays = $exam->plan_days ?? 14;

        if ($dayNumber < 1 || $dayNumber > $planDays) {
            throw new RuntimeException("Day {$dayNumber} is outside the {$planDays}-day plan.");
        }

        // Lock: a student may only access up to their current unlocked day.
        if ($dayNumber > $enrollment->current_day) {
            throw new RuntimeException('Complete earlier days first to unlock this day.');
        }

        $existing = $enrollment->days()->where('day_number', $dayNumber)->first();
        if ($existing) {
            return $existing;
        }

        return DB::transaction(function () use ($enrollment, $exam, $dayNumber) {
            $perDay = $exam->questions_per_day ?? 10;

            // Draw a pool from the programme's active questions, excluding ones
            // already assigned to earlier days of THIS enrollment (no repeats
            // within the plan where possible).
            $used = $enrollment->days()
                ->get()
                ->flatMap(fn ($d) => $d->question_ids ?? [])
                ->unique()
                ->all();

            $pool = Question::where('exam_programme_id', $exam->exam_programme_id)
                ->where('status', 'active')
                ->whereNotIn('id', $used)
                ->inRandomOrder()
                ->limit($perDay)
                ->pluck('id')
                ->all();

            // If the bank is exhausted, allow reuse so the plan can still run.
            if (count($pool) < $perDay) {
                $extra = Question::where('exam_programme_id', $exam->exam_programme_id)
                    ->where('status', 'active')
                    ->whereNotIn('id', $pool)
                    ->inRandomOrder()
                    ->limit($perDay - count($pool))
                    ->pluck('id')
                    ->all();
                $pool = array_merge($pool, $extra);
            }

            if (count($pool) === 0) {
                throw new RuntimeException('No active questions are available for this programme yet.');
            }

            // Pre-compute a stable, shuffled option order per question.
            $optionOrders = [];
            $options = QuestionOption::whereIn('question_id', $pool)->get()->groupBy('question_id');
            foreach ($pool as $qid) {
                $ids = $options->get($qid)?->pluck('id')->all() ?? [];
                $optionOrders[$qid] = $this->secureShuffle($ids);
            }

            return $enrollment->days()->create([
                'day_number' => $dayNumber,
                'question_ids' => $pool,
                'option_orders' => $optionOrders,
                'responses' => [],
                'status' => 'pending',
            ]);
        });
    }

    /**
     * Submit a day's answers. Grades from canonical is_correct, updates streak,
     * and unlocks the next day. Retries allowed only if the exam permits.
     */
    public function submitDay(PracticeDay $day, array $responses): PracticeDay
    {
        $enrollment = $day->enrollment;
        $exam = $enrollment->exam;

        if ($day->status === 'completed' && ! $exam->allow_retry) {
            throw new RuntimeException('This day has already been completed.');
        }

        return DB::transaction(function () use ($day, $enrollment, $exam, $responses) {
            $questionIds = $day->question_ids ?? [];
            $correctByQuestion = QuestionOption::whereIn('question_id', $questionIds)
                ->where('is_correct', true)
                ->pluck('id', 'question_id'); // question_id => correct option id

            $correct = 0;
            $answered = 0;
            $clean = [];
            foreach ($questionIds as $qid) {
                $selected = $responses[$qid] ?? null;
                if ($selected !== null) {
                    $answered++;
                    $clean[$qid] = (int) $selected;
                    if ((int) $selected === (int) ($correctByQuestion[$qid] ?? -1)) {
                        $correct++;
                    }
                }
            }

            $total = count($questionIds);
            $wasAlreadyCompleted = $day->status === 'completed';

            $day->update([
                'responses' => $clean,
                'correct_count' => $correct,
                'answered_count' => $answered,
                'accuracy' => $total > 0 ? round($correct / $total * 100, 2) : 0,
                'status' => 'completed',
                'completed_at' => now(),
            ]);

            // Streak + progression only advance on first completion of a day.
            if (! $wasAlreadyCompleted) {
                $this->advanceProgress($enrollment);
            }

            return $day->fresh();
        });
    }

    /** Update streak + unlock the next day after a first completion. */
    protected function advanceProgress(PracticeEnrollment $enrollment): void
    {
        $today = Carbon::today();
        $last = $enrollment->last_completed_date;

        if ($last === null) {
            $streak = 1;
        } elseif ($last->isSameDay($today)) {
            $streak = max(1, $enrollment->streak); // another day completed same calendar day
        } elseif ($last->copy()->addDay()->isSameDay($today)) {
            $streak = $enrollment->streak + 1;      // consecutive day
        } else {
            $streak = 1;                            // streak broken
        }

        $planDays = $enrollment->exam->plan_days ?? 14;

        $enrollment->update([
            'streak' => $streak,
            'best_streak' => max($enrollment->best_streak, $streak),
            'last_completed_date' => $today,
            'current_day' => min($planDays, $enrollment->current_day + 1),
        ]);
    }

    /** Cryptographically-secure Fisher–Yates shuffle (identity preserving). */
    protected function secureShuffle(array $items): array
    {
        for ($i = count($items) - 1; $i > 0; $i--) {
            $j = random_int(0, $i);
            [$items[$i], $items[$j]] = [$items[$j], $items[$i]];
        }

        return array_values($items);
    }
}
