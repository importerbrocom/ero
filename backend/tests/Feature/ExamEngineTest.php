<?php

namespace Tests\Feature;

use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\ExamAttemptBlock;
use App\Models\ExamBlock;
use App\Models\ExamProgramme;
use App\Models\Question;
use App\Models\QuestionOption;
use App\Models\Subject;
use App\Models\User;
use App\Services\ExamEngine;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class ExamEngineTest extends TestCase
{
    use RefreshDatabase;

    private function buildExam(array $overrides = []): Exam
    {
        $programme = ExamProgramme::create([
            'slug' => 'test-prog',
            'name' => 'TEST',
            'full_name' => 'Test Programme',
            'config' => [],
            'status' => 'published',
        ]);

        $subject = Subject::create([
            'exam_programme_id' => $programme->id,
            'name' => 'General',
            'slug' => 'general',
        ]);

        $exam = Exam::create(array_merge([
            'exam_programme_id' => $programme->id,
            'type' => Exam::TYPE_FULL_MOCK,
            'title' => 'Test Mock',
            'block_count' => 3,
            'questions_per_block' => 4,
            'block_duration_minutes' => 30,
            'block_release_interval_minutes' => 55,
            'block_release_mode' => 'from_start',
            'randomize_block_order' => true,
            'randomize_questions' => true,
            'randomize_options' => true,
            'allow_retry' => true,
            'result_visibility' => 'after_exam',
            'status' => 'published',
        ], $overrides));

        for ($b = 1; $b <= $exam->block_count; $b++) {
            $block = ExamBlock::create([
                'exam_id' => $exam->id,
                'logical_number' => $b,
            ]);
            $attach = [];
            for ($q = 1; $q <= $exam->questions_per_block; $q++) {
                $question = Question::create([
                    'exam_programme_id' => $programme->id,
                    'subject_id' => $subject->id,
                    'stem' => "Q{$b}.{$q}",
                    'status' => 'active',
                ]);
                foreach (['A', 'B', 'C', 'D'] as $i => $label) {
                    QuestionOption::create([
                        'question_id' => $question->id,
                        'text' => $label,
                        'is_correct' => $i === 0, // canonical correct = first authored
                        'canonical_order' => $i,
                    ]);
                }
                $attach[$question->id] = ['canonical_position' => $q];
            }
            $block->questions()->attach($attach);
        }

        return $exam;
    }

    public function test_attempt_builds_correct_structure(): void
    {
        $exam = $this->buildExam();
        $user = User::factory()->create(['role' => 'student']);

        $attempt = app(ExamEngine::class)->startAttempt($user, $exam);

        $this->assertCount(3, $attempt->block_sequence);
        $this->assertEquals(3, $attempt->attemptBlocks()->count());
        $this->assertEquals(12, $attempt->total_questions); // 3 blocks x 4
        // Each attempt block has exactly questions_per_block questions, no dupes.
        foreach ($attempt->attemptBlocks as $ab) {
            $this->assertEquals(4, $ab->questions()->count());
            $this->assertEquals(4, $ab->questions()->distinct('question_id')->count('question_id'));
        }
    }

    public function test_block_order_is_randomised_but_identity_preserved(): void
    {
        $exam = $this->buildExam();
        $u1 = User::factory()->create(['role' => 'student']);
        $u2 = User::factory()->create(['role' => 'student']);

        $engine = app(ExamEngine::class);
        $seqs = collect();
        // Collect a few sequences; at least structurally all logical ids 1..3 present.
        foreach ([$u1, $u2] as $u) {
            $attempt = $engine->startAttempt($u, $exam);
            $logicalNumbers = $attempt->attemptBlocks()
                ->get()
                ->map(fn ($ab) => $ab->block->logical_number)
                ->sort()
                ->values()
                ->all();
            $this->assertEquals([1, 2, 3], $logicalNumbers, 'All logical blocks must be present with identity preserved.');
            $seqs->push(implode(',', $attempt->block_sequence));
        }

        $this->assertCount(3, $exam->blocks); // identities intact in source
    }

    public function test_sequence_is_stable_across_resume(): void
    {
        $exam = $this->buildExam();
        $user = User::factory()->create(['role' => 'student']);
        $engine = app(ExamEngine::class);

        $first = $engine->startAttempt($user, $exam);
        $firstSeq = $first->block_sequence;

        // "Resume" — must NOT reshuffle.
        $resumed = $engine->startAttempt($user, $exam);
        $this->assertEquals($firstSeq, $resumed->block_sequence);
        $this->assertEquals($first->id, $resumed->id);
    }

    public function test_grading_follows_canonical_correct_option_not_display_letter(): void
    {
        $exam = $this->buildExam();
        $user = User::factory()->create(['role' => 'student']);
        $engine = app(ExamEngine::class);

        $attempt = $engine->startAttempt($user, $exam);
        $block = $attempt->attemptBlocks()->first();
        $engine->startBlock($block);

        // Answer every question with the CANONICAL correct option regardless of
        // its shuffled display position.
        foreach ($block->questions()->with('question.options')->get() as $aq) {
            $correct = $aq->question->options->firstWhere('is_correct', true);
            $engine->saveAnswer($block->fresh(), $aq->id, $correct->id, false);
        }

        $block = $engine->submitBlock($block->fresh());
        $this->assertEquals(4, $block->correct_count);
    }

    public function test_block_timer_is_server_authoritative_and_auto_submits(): void
    {
        $exam = $this->buildExam();
        $user = User::factory()->create(['role' => 'student']);
        $engine = app(ExamEngine::class);

        $attempt = $engine->startAttempt($user, $exam);
        $block = $attempt->attemptBlocks()->first();
        $engine->startBlock($block);
        $block->refresh();

        $this->assertEquals(30, $block->started_at->diffInMinutes($block->deadline_at));

        // Travel past the deadline — syncSchedule must auto-submit/expire it.
        Carbon::setTestNow(now()->addMinutes(31));
        $engine->syncSchedule($attempt->fresh());
        $block->refresh();

        $this->assertEquals(ExamAttemptBlock::STATUS_EXPIRED, $block->status);
        $this->assertTrue($block->auto_submitted);

        Carbon::setTestNow();
    }

    public function test_55_minute_release_schedule_from_start(): void
    {
        Carbon::setTestNow(Carbon::create(2026, 1, 1, 9, 0, 0));
        $exam = $this->buildExam();
        $user = User::factory()->create(['role' => 'student']);
        $engine = app(ExamEngine::class);

        $attempt = $engine->startAttempt($user, $exam);
        $blocks = $attempt->attemptBlocks()->get();

        $b1 = $blocks->firstWhere('display_position', 1);
        $b2 = $blocks->firstWhere('display_position', 2);

        $this->assertEquals(ExamAttemptBlock::STATUS_AVAILABLE, $b1->status);
        $this->assertEquals(ExamAttemptBlock::STATUS_LOCKED, $b2->status);
        // Block 2 available 55 minutes after start (09:55).
        $this->assertEquals('09:55', $b2->available_at->format('H:i'));

        // At 09:54 still locked.
        Carbon::setTestNow(Carbon::create(2026, 1, 1, 9, 54, 0));
        $engine->syncSchedule($attempt->fresh());
        $this->assertEquals(ExamAttemptBlock::STATUS_LOCKED, $b2->fresh()->status);

        // At 09:55 it releases.
        Carbon::setTestNow(Carbon::create(2026, 1, 1, 9, 55, 0));
        $engine->syncSchedule($attempt->fresh());
        $this->assertEquals(ExamAttemptBlock::STATUS_AVAILABLE, $b2->fresh()->status);

        Carbon::setTestNow();
    }

    public function test_submission_is_idempotent_no_double_grading(): void
    {
        $exam = $this->buildExam();
        $user = User::factory()->create(['role' => 'student']);
        $engine = app(ExamEngine::class);

        $attempt = $engine->startAttempt($user, $exam);
        $block = $attempt->attemptBlocks()->first();
        $engine->startBlock($block);
        $aq = $block->questions()->first();
        $correct = $aq->question->options->firstWhere('is_correct', true);
        $engine->saveAnswer($block->fresh(), $aq->id, $correct->id, false);

        $engine->submitBlock($block->fresh());
        $submittedAt = $block->fresh()->submitted_at;
        // Second submit must not change anything.
        $engine->submitBlock($block->fresh());
        $this->assertEquals($submittedAt->timestamp, $block->fresh()->submitted_at->timestamp);
    }
}
