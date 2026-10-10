<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\AttemptBlockResource;
use App\Http\Resources\ExamQuestionResource;
use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\ExamAttemptBlock;
use App\Services\ExamEngine;
use Illuminate\Http\Request;
use RuntimeException;

class AttemptController extends Controller
{
    public function __construct(private ExamEngine $engine)
    {
    }

    /** Start or resume an attempt for an exam. */
    public function start(Request $request, Exam $exam)
    {
        $user = $request->user();
        abort_unless($exam->status === 'published', 404);
        abort_unless($user->canAccessProgramme($exam->exam_programme_id), 403,
            'You do not have access to this programme. Redeem an activation code to unlock it.');

        try {
            $attempt = $this->engine->startAttempt($user, $exam);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['data' => $this->attemptPayload($attempt)]);
    }

    /** Fetch the live attempt state (schedule, timers, block statuses). */
    public function show(Request $request, ExamAttempt $attempt)
    {
        $this->authorizeAttempt($request, $attempt);
        $this->engine->syncSchedule($attempt);

        return response()->json(['data' => $this->attemptPayload($attempt->fresh('attemptBlocks'))]);
    }

    /** Start a specific block's 30-minute timer. */
    public function startBlock(Request $request, ExamAttempt $attempt, ExamAttemptBlock $block)
    {
        $this->authorizeAttempt($request, $attempt);
        $this->assertBlockBelongs($attempt, $block);

        try {
            $this->engine->startBlock($block);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['data' => $this->blockPayload($block->fresh(), $attempt)]);
    }

    /** Return the questions of a block (only when open; never leaks answer key). */
    public function blockQuestions(Request $request, ExamAttempt $attempt, ExamAttemptBlock $block)
    {
        $this->authorizeAttempt($request, $attempt);
        $this->assertBlockBelongs($attempt, $block);
        $this->engine->syncSchedule($attempt);
        $block->refresh();

        // §5.7 — students must not read a locked future block.
        abort_if($block->status === ExamAttemptBlock::STATUS_LOCKED, 403,
            'This block has not been released yet.');

        $reveal = $this->shouldRevealAnswers($attempt->exam, $block);
        $questions = $block->questions()->with('question.options', 'question.subject', 'question.topic')->get();

        return response()->json([
            'data' => [
                'block' => (new AttemptBlockResource($block))->resolve(),
                'questions' => $questions->map(fn ($aq) =>
                    (new ExamQuestionResource($aq, $reveal))->resolve()
                ),
            ],
        ]);
    }

    /** Save a single answer / flag. */
    public function answer(Request $request, ExamAttempt $attempt, ExamAttemptBlock $block)
    {
        $this->authorizeAttempt($request, $attempt);
        $this->assertBlockBelongs($attempt, $block);

        $data = $request->validate([
            'attempt_question_id' => ['required', 'integer'],
            'selected_option_id' => ['nullable', 'integer'],
            'flagged' => ['boolean'],
        ]);

        try {
            $aq = $this->engine->saveAnswer(
                $block,
                $data['attempt_question_id'],
                $data['selected_option_id'] ?? null,
                $data['flagged'] ?? false,
            );
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['data' => [
            'attempt_question_id' => $aq->id,
            'selected_option_id' => $aq->selected_option_id,
            'is_flagged' => $aq->is_flagged,
        ]]);
    }

    /** Submit a block manually (also auto-submitted by the engine on timeout). */
    public function submitBlock(Request $request, ExamAttempt $attempt, ExamAttemptBlock $block)
    {
        $this->authorizeAttempt($request, $attempt);
        $this->assertBlockBelongs($attempt, $block);

        $this->engine->submitBlock($block);

        return response()->json(['data' => $this->attemptPayload($attempt->fresh('attemptBlocks'))]);
    }

    // ---- helpers ----

    private function attemptPayload(ExamAttempt $attempt): array
    {
        $exam = $attempt->exam;

        return [
            'id' => $attempt->id,
            'exam_id' => $attempt->exam_id,
            'status' => $attempt->status,
            'attempt_number' => $attempt->attempt_number,
            'started_at' => $attempt->started_at?->toIso8601String(),
            'completed_at' => $attempt->completed_at?->toIso8601String(),
            'server_time' => now()->toIso8601String(),
            'exam' => [
                'title' => $exam->title,
                'block_count' => $exam->block_count,
                'questions_per_block' => $exam->questions_per_block,
                'block_duration_minutes' => $exam->block_duration_minutes,
                'block_release_interval_minutes' => $exam->block_release_interval_minutes,
                'block_release_mode' => $exam->block_release_mode,
                'allow_flagging' => $exam->allow_flagging,
                'result_visibility' => $exam->result_visibility,
            ],
            'blocks' => $attempt->attemptBlocks->map(fn ($b) =>
                (new AttemptBlockResource($b))->resolve()
            ),
            'result' => $attempt->status === ExamAttempt::STATUS_COMPLETED ? [
                'total_questions' => $attempt->total_questions,
                'answered_count' => $attempt->answered_count,
                'correct_count' => $attempt->correct_count,
                'incorrect_count' => $attempt->incorrect_count,
                'accuracy' => $attempt->accuracy,
                'subject_breakdown' => $attempt->subject_breakdown,
                'topic_breakdown' => $attempt->topic_breakdown,
            ] : null,
        ];
    }

    private function blockPayload(ExamAttemptBlock $block, ExamAttempt $attempt): array
    {
        return (new AttemptBlockResource($block))->resolve();
    }

    private function shouldRevealAnswers(Exam $exam, ExamAttemptBlock $block): bool
    {
        return match ($exam->result_visibility) {
            'immediate' => true,
            'after_block' => in_array($block->status, [
                ExamAttemptBlock::STATUS_SUBMITTED, ExamAttemptBlock::STATUS_EXPIRED,
            ], true),
            'after_exam' => $block->attempt->status === ExamAttempt::STATUS_COMPLETED,
            default => false, // never_during
        };
    }

    private function authorizeAttempt(Request $request, ExamAttempt $attempt): void
    {
        abort_unless($attempt->user_id === $request->user()->id, 403);
    }

    private function assertBlockBelongs(ExamAttempt $attempt, ExamAttemptBlock $block): void
    {
        abort_unless($block->exam_attempt_id === $attempt->id, 404);
    }
}
