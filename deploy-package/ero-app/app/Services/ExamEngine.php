<?php

namespace App\Services;

use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\ExamAttemptBlock;
use App\Models\ExamAttemptQuestion;
use App\Models\ExamBlock;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * The reusable examination engine.
 *
 * Implements, server-side (never trusting the client):
 *   §5.2 randomised logical-block order per attempt (stored, stable on refresh)
 *   §5.3 randomised question order within each block (stored, no duplicates)
 *   §5.4 randomised answer-option order (correctness from canonical is_correct)
 *   §5.5 per-block 30-min server-authoritative timer
 *   §5.6 55-min block release schedule (from_start | from_completion)
 *   §5.7 navigation/locking rules
 *   §5.8 full-exam grading & analytics
 *
 * The same engine serves USMLE, FMGE and future programmes purely via the
 * data-driven Exam configuration — nothing is hard-coded per programme.
 */
class ExamEngine
{
    /**
     * Begin (or resume) an attempt. Uses a transaction so a student can never
     * create duplicate in-progress attempts or partially-built attempts.
     */
    public function startAttempt(User $user, Exam $exam): ExamAttempt
    {
        // Resume an existing in-progress attempt instead of creating a new one.
        $existing = ExamAttempt::where('user_id', $user->id)
            ->where('exam_id', $exam->id)
            ->where('status', ExamAttempt::STATUS_IN_PROGRESS)
            ->first();

        if ($existing) {
            $this->syncSchedule($existing);
            return $existing;
        }

        $priorAttempts = ExamAttempt::where('user_id', $user->id)
            ->where('exam_id', $exam->id)
            ->count();

        if ($priorAttempts > 0 && ! $exam->allow_retry) {
            throw new RuntimeException('Retries are not permitted for this exam.');
        }
        if ($exam->max_attempts !== null && $priorAttempts >= $exam->max_attempts) {
            throw new RuntimeException('Maximum number of attempts reached.');
        }

        return DB::transaction(function () use ($user, $exam, $priorAttempts) {
            $blocks = $exam->blocks()->with('questions')->get();

            if ($blocks->count() !== $exam->block_count) {
                throw new RuntimeException(
                    "Exam is not ready: expected {$exam->block_count} blocks, found {$blocks->count()}."
                );
            }

            // §5.2 — randomised sequence of LOGICAL block ids (identity preserved).
            $sequence = $blocks->pluck('id')->all();
            if ($exam->randomize_block_order) {
                $sequence = $this->secureShuffle($sequence);
            }

            $attempt = ExamAttempt::create([
                'user_id' => $user->id,
                'exam_id' => $exam->id,
                'attempt_number' => $priorAttempts + 1,
                'block_sequence' => $sequence,
                'status' => ExamAttempt::STATUS_IN_PROGRESS,
                'started_at' => now(),
                'total_questions' => $exam->totalQuestions(),
            ]);

            $blocksById = $blocks->keyBy('id');
            $firstStart = now();

            foreach ($sequence as $position => $logicalBlockId) {
                /** @var ExamBlock $block */
                $block = $blocksById[$logicalBlockId];
                $displayPosition = $position + 1;

                // §5.6 default (from_start): block N available at
                // firstStart + (N-1) * release_interval.
                $availableAt = (clone $firstStart)->addMinutes(
                    $position * $exam->block_release_interval_minutes
                );

                $attemptBlock = ExamAttemptBlock::create([
                    'exam_attempt_id' => $attempt->id,
                    'exam_block_id' => $block->id,
                    'display_position' => $displayPosition,
                    'available_at' => $exam->block_release_mode === 'from_start' ? $availableAt : null,
                    'status' => $displayPosition === 1
                        ? ExamAttemptBlock::STATUS_AVAILABLE
                        : ExamAttemptBlock::STATUS_LOCKED,
                ]);

                $this->buildBlockQuestions($attemptBlock, $block, $exam);
            }

            return $attempt->fresh('attemptBlocks');
        });
    }

    /**
     * §5.3 + §5.4 — build the per-attempt question order and per-question option
     * order, stored so they stay stable across refresh/resume.
     */
    protected function buildBlockQuestions(ExamAttemptBlock $attemptBlock, ExamBlock $block, Exam $exam): void
    {
        $questions = $block->questions; // ordered by canonical_position

        if ($questions->count() !== $exam->questions_per_block) {
            throw new RuntimeException(
                "Block {$block->logical_number} has {$questions->count()} questions, expected {$exam->questions_per_block}."
            );
        }

        $ordered = $exam->randomize_questions
            ? collect($this->secureShuffle($questions->all()))
            : $questions;

        foreach ($ordered as $i => $question) {
            $optionIds = $question->options->pluck('id')->all();
            if ($exam->randomize_options) {
                $optionIds = $this->secureShuffle($optionIds);
            }

            ExamAttemptQuestion::create([
                'exam_attempt_block_id' => $attemptBlock->id,
                'question_id' => $question->id,
                'display_position' => $i + 1,
                'option_order' => $optionIds, // canonical option ids, shuffled order
            ]);
        }
    }

    /**
     * §5.5 — start a block's 30-minute server-authoritative timer. Idempotent:
     * re-calling returns the existing deadline (survives refresh/reconnect).
     */
    public function startBlock(ExamAttemptBlock $attemptBlock): ExamAttemptBlock
    {
        $this->syncSchedule($attemptBlock->attempt);
        $attemptBlock->refresh();

        if ($attemptBlock->status === ExamAttemptBlock::STATUS_LOCKED) {
            throw new RuntimeException('This block has not been released yet.');
        }
        if (in_array($attemptBlock->status, [
            ExamAttemptBlock::STATUS_SUBMITTED, ExamAttemptBlock::STATUS_EXPIRED,
        ], true)) {
            throw new RuntimeException('This block is already closed.');
        }

        if ($attemptBlock->started_at === null) {
            $exam = $attemptBlock->attempt->exam;
            $now = now();
            $attemptBlock->update([
                'started_at' => $now,
                'deadline_at' => (clone $now)->addMinutes($exam->block_duration_minutes),
                'status' => ExamAttemptBlock::STATUS_IN_PROGRESS,
            ]);
        }

        return $attemptBlock;
    }

    /**
     * Save a single answer. Rejects writes to locked/closed blocks or past the
     * server deadline. Correctness is NOT computed here (hidden during the mock
     * unless policy allows); only the selected canonical option id is stored.
     */
    public function saveAnswer(ExamAttemptBlock $attemptBlock, int $attemptQuestionId, ?int $selectedOptionId, bool $flagged): ExamAttemptQuestion
    {
        $this->syncSchedule($attemptBlock->attempt);
        $attemptBlock->refresh();

        if ($attemptBlock->status !== ExamAttemptBlock::STATUS_IN_PROGRESS) {
            throw new RuntimeException('This block is not open for answering.');
        }
        if ($attemptBlock->isPastDeadline()) {
            $this->submitBlock($attemptBlock, auto: true);
            throw new RuntimeException('The block timer has expired.');
        }

        /** @var ExamAttemptQuestion $aq */
        $aq = $attemptBlock->questions()->findOrFail($attemptQuestionId);

        // Guard: selected option must be one of THIS question's canonical options.
        if ($selectedOptionId !== null && ! in_array($selectedOptionId, $aq->option_order, true)) {
            throw new RuntimeException('Invalid option for this question.');
        }

        $aq->update([
            'selected_option_id' => $selectedOptionId,
            'is_flagged' => $flagged,
            'answered_at' => $selectedOptionId !== null ? now() : null,
        ]);

        return $aq;
    }

    /**
     * §5.5/§5.7 — submit (or auto-submit) a block. Grades the block's responses
     * from canonical is_correct, locks answers, releases nothing extra.
     */
    public function submitBlock(ExamAttemptBlock $attemptBlock, bool $auto = false): ExamAttemptBlock
    {
        return DB::transaction(function () use ($attemptBlock, $auto) {
            $attemptBlock = ExamAttemptBlock::lockForUpdate()->find($attemptBlock->id);

            if (in_array($attemptBlock->status, [
                ExamAttemptBlock::STATUS_SUBMITTED, ExamAttemptBlock::STATUS_EXPIRED,
            ], true)) {
                return $attemptBlock; // idempotent — no double submission
            }

            $questions = $attemptBlock->questions()->with('question.options')->get();
            $correct = 0;
            $answered = 0;

            foreach ($questions as $aq) {
                $isCorrect = false;
                if ($aq->selected_option_id !== null) {
                    $answered++;
                    $correctOption = $aq->question->options->firstWhere('is_correct', true);
                    $isCorrect = $correctOption && $correctOption->id === $aq->selected_option_id;
                }
                $aq->update(['is_correct' => $isCorrect]);
                if ($isCorrect) {
                    $correct++;
                }
            }

            $expired = $attemptBlock->isPastDeadline();
            $attemptBlock->update([
                'status' => $expired ? ExamAttemptBlock::STATUS_EXPIRED : ExamAttemptBlock::STATUS_SUBMITTED,
                'submitted_at' => now(),
                'auto_submitted' => $auto || $expired,
                'correct_count' => $correct,
                'answered_count' => $answered,
            ]);

            $this->syncSchedule($attemptBlock->attempt);
            $this->maybeFinalizeAttempt($attemptBlock->attempt->fresh('attemptBlocks'));

            return $attemptBlock->fresh();
        });
    }

    /**
     * §5.6 — reconcile schedule & deadlines against the server clock. Called on
     * every read/write so refresh/reconnect/clock-tampering can't bypass rules.
     */
    public function syncSchedule(ExamAttempt $attempt): void
    {
        $exam = $attempt->exam;
        $blocks = $attempt->attemptBlocks()->get();

        foreach ($blocks as $block) {
            // Auto-expire in-progress blocks whose deadline has passed.
            if ($block->status === ExamAttemptBlock::STATUS_IN_PROGRESS && $block->isPastDeadline()) {
                $this->submitBlock($block, auto: true);
                continue;
            }

            // Release locked blocks once their scheduled time arrives (from_start).
            if ($block->status === ExamAttemptBlock::STATUS_LOCKED
                && $exam->block_release_mode === 'from_start'
                && $block->available_at !== null
                && now()->greaterThanOrEqualTo($block->available_at)) {
                $block->update(['status' => ExamAttemptBlock::STATUS_AVAILABLE]);
            }
        }

        // from_completion mode: release the next block 'interval' minutes after
        // the previous block was submitted.
        if ($exam->block_release_mode === 'from_completion') {
            $ordered = $attempt->attemptBlocks()->get();
            foreach ($ordered as $block) {
                if ($block->display_position === 1) {
                    continue;
                }
                $prev = $ordered->firstWhere('display_position', $block->display_position - 1);
                if ($prev && $prev->submitted_at && $block->status === ExamAttemptBlock::STATUS_LOCKED) {
                    $releaseAt = (clone $prev->submitted_at)->addMinutes($exam->block_release_interval_minutes);
                    $block->update(['available_at' => $releaseAt]);
                    if (now()->greaterThanOrEqualTo($releaseAt)) {
                        $block->update(['status' => ExamAttemptBlock::STATUS_AVAILABLE]);
                    }
                }
            }
        }
    }

    /** §5.8 — finalise the whole attempt once every block is closed. */
    protected function maybeFinalizeAttempt(ExamAttempt $attempt): void
    {
        $blocks = $attempt->attemptBlocks;
        $allClosed = $blocks->every(fn ($b) => in_array($b->status, [
            ExamAttemptBlock::STATUS_SUBMITTED, ExamAttemptBlock::STATUS_EXPIRED,
        ], true));

        if (! $allClosed) {
            return;
        }

        $aqs = ExamAttemptQuestion::whereIn('exam_attempt_block_id', $blocks->pluck('id'))
            ->with('question.subject', 'question.topic')
            ->get();

        $correct = $aqs->where('is_correct', true)->count();
        $answered = $aqs->whereNotNull('selected_option_id')->count();
        $total = $aqs->count();

        $subjectBreakdown = [];
        $topicBreakdown = [];
        foreach ($aqs as $aq) {
            $subj = $aq->question->subject?->name ?? 'Uncategorised';
            $subjectBreakdown[$subj]['total'] = ($subjectBreakdown[$subj]['total'] ?? 0) + 1;
            $subjectBreakdown[$subj]['correct'] = ($subjectBreakdown[$subj]['correct'] ?? 0) + ($aq->is_correct ? 1 : 0);

            if ($aq->question->topic) {
                $t = $aq->question->topic->name;
                $topicBreakdown[$t]['total'] = ($topicBreakdown[$t]['total'] ?? 0) + 1;
                $topicBreakdown[$t]['correct'] = ($topicBreakdown[$t]['correct'] ?? 0) + ($aq->is_correct ? 1 : 0);
            }
        }

        $attempt->update([
            'status' => ExamAttempt::STATUS_COMPLETED,
            'completed_at' => now(),
            'total_questions' => $total,
            'answered_count' => $answered,
            'correct_count' => $correct,
            'incorrect_count' => $answered - $correct,
            'accuracy' => $total > 0 ? round($correct / $total * 100, 2) : 0,
            'subject_breakdown' => $subjectBreakdown,
            'topic_breakdown' => $topicBreakdown,
        ]);
    }

    /**
     * Cryptographically-secure Fisher-Yates shuffle (random_int). Preserves
     * element identity; used for blocks, questions and options so allocation is
     * fair and not predictable from the client.
     */
    protected function secureShuffle(array $items): array
    {
        for ($i = count($items) - 1; $i > 0; $i--) {
            $j = random_int(0, $i);
            [$items[$i], $items[$j]] = [$items[$j], $items[$i]];
        }

        return array_values($items);
    }
}
