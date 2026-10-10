<?php

namespace Tests\Feature;

use App\Models\Exam;
use App\Models\ExamBlock;
use App\Models\ExamProgramme;
use App\Models\Question;
use App\Models\QuestionOption;
use App\Models\Subject;
use App\Models\User;
use App\Services\ExamEngine;
use App\Support\ProgrammeConfig;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LevelMockTest extends TestCase
{
    use RefreshDatabase;

    private ExamProgramme $programme;
    private Subject $subject;

    private function setupProgramme(int $levels = 3, int $size = 4, float $pass = 50): void
    {
        $this->programme = ExamProgramme::create([
            'slug' => 'fmge', 'name' => 'FMGE', 'full_name' => 'FMGE',
            'config' => array_merge(ProgrammeConfig::fmgeDefaults(), [
                'levels' => $levels,
                'level_pass_accuracy' => $pass,
            ]),
            'status' => 'published',
        ]);
        $this->subject = Subject::create([
            'exam_programme_id' => $this->programme->id, 'name' => 'Anatomy', 'slug' => 'anatomy',
        ]);

        for ($lvl = 1; $lvl <= $levels; $lvl++) {
            $exam = Exam::create([
                'exam_programme_id' => $this->programme->id,
                'type' => Exam::TYPE_LEVEL_MOCK,
                'level' => $lvl,
                'title' => "Level {$lvl} Mock",
                'block_count' => 1,
                'questions_per_block' => $size,
                'block_duration_minutes' => 180,
                'allow_retry' => true,
                'result_visibility' => 'after_exam',
                'status' => 'published',
            ]);
            $block = ExamBlock::create(['exam_id' => $exam->id, 'logical_number' => 1]);
            $attach = [];
            for ($q = 1; $q <= $size; $q++) {
                $question = Question::create([
                    'exam_programme_id' => $this->programme->id,
                    'subject_id' => $this->subject->id,
                    'stem' => "L{$lvl}Q{$q}", 'status' => 'active',
                ]);
                foreach (range(0, 3) as $o) {
                    QuestionOption::create([
                        'question_id' => $question->id, 'text' => "o{$o}",
                        'is_correct' => $o === 0, 'canonical_order' => $o,
                    ]);
                }
                $attach[$question->id] = ['canonical_position' => $q];
            }
            $block->questions()->attach($attach);
        }
    }

    private function student(): User
    {
        $user = User::factory()->create(['role' => 'student']);
        $user->programmeAccess()->create([
            'exam_programme_id' => $this->programme->id, 'granted_via' => 'admin',
        ]);
        return $user;
    }

    public function test_level_ladder_reports_first_level_available_rest_locked(): void
    {
        $this->setupProgramme();
        $user = $this->student();

        $ladder = $this->actingAs($user)
            ->getJson("/api/v1/programmes/{$this->programme->slug}/levels")
            ->assertOk()
            ->json('data.ladder');

        $this->assertEquals('available', $ladder[0]['status']);
        $this->assertEquals('locked', $ladder[1]['status']);
        $this->assertEquals('locked', $ladder[2]['status']);
    }

    public function test_cannot_start_level_2_before_passing_level_1(): void
    {
        $this->setupProgramme();
        $user = $this->student();
        $level2 = Exam::where('level', 2)->first();

        $this->actingAs($user)
            ->postJson("/api/v1/exams/{$level2->id}/attempts")
            ->assertStatus(403);
    }

    public function test_passing_level_1_unlocks_level_2(): void
    {
        $this->setupProgramme(size: 4, pass: 50);
        $user = $this->student();
        $engine = app(ExamEngine::class);

        // Complete level 1 at 100%.
        $level1 = Exam::where('level', 1)->first();
        $attempt = $engine->startAttempt($user, $level1);
        $block = $attempt->attemptBlocks()->first();
        $engine->startBlock($block);
        foreach ($block->questions()->with('question.options')->get() as $aq) {
            $correct = $aq->question->options->firstWhere('is_correct', true);
            $engine->saveAnswer($block->fresh(), $aq->id, $correct->id, false);
        }
        $engine->submitBlock($block->fresh());

        // Ladder now shows level 2 available and level 1 passed.
        $ladder = $this->actingAs($user)
            ->getJson("/api/v1/programmes/{$this->programme->slug}/levels")
            ->json('data.ladder');
        $this->assertTrue($ladder[0]['passed']);
        $this->assertEquals('available', $ladder[1]['status']);

        // And starting level 2 is now permitted.
        $level2 = Exam::where('level', 2)->first();
        $this->actingAs($user)
            ->postJson("/api/v1/exams/{$level2->id}/attempts")
            ->assertOk();
    }

    public function test_failing_level_1_does_not_unlock_level_2(): void
    {
        $this->setupProgramme(size: 4, pass: 50);
        $user = $this->student();
        $engine = app(ExamEngine::class);

        // Complete level 1 but answer everything WRONG (0%).
        $level1 = Exam::where('level', 1)->first();
        $attempt = $engine->startAttempt($user, $level1);
        $block = $attempt->attemptBlocks()->first();
        $engine->startBlock($block);
        foreach ($block->questions()->with('question.options')->get() as $aq) {
            $wrong = $aq->question->options->firstWhere('is_correct', false);
            $engine->saveAnswer($block->fresh(), $aq->id, $wrong->id, false);
        }
        $engine->submitBlock($block->fresh());

        $ladder = $this->actingAs($user)
            ->getJson("/api/v1/programmes/{$this->programme->slug}/levels")
            ->json('data.ladder');
        $this->assertFalse($ladder[0]['passed']);
        $this->assertEquals('locked', $ladder[1]['status']);

        $level2 = Exam::where('level', 2)->first();
        $this->actingAs($user)
            ->postJson("/api/v1/exams/{$level2->id}/attempts")
            ->assertStatus(403);
    }
}
