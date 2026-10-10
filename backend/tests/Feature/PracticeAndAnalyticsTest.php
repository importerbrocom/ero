<?php

namespace Tests\Feature;

use App\Models\Exam;
use App\Models\ExamProgramme;
use App\Models\Question;
use App\Models\QuestionOption;
use App\Models\Subject;
use App\Models\User;
use App\Services\PracticeEngine;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class PracticeAndAnalyticsTest extends TestCase
{
    use RefreshDatabase;

    private function buildPractice(int $perDay = 5, int $planDays = 3): Exam
    {
        $programme = ExamProgramme::create([
            'slug' => 'fmge', 'name' => 'FMGE', 'full_name' => 'FMGE',
            'config' => [], 'status' => 'published',
        ]);
        $subject = Subject::create(['exam_programme_id' => $programme->id, 'name' => 'Anatomy', 'slug' => 'anatomy']);

        // Seed enough questions for several unique days.
        for ($i = 0; $i < 40; $i++) {
            $q = Question::create([
                'exam_programme_id' => $programme->id,
                'subject_id' => $subject->id,
                'stem' => "Q{$i}",
                'explanation' => 'because',
                'status' => 'active',
            ]);
            foreach (range(0, 3) as $o) {
                QuestionOption::create([
                    'question_id' => $q->id, 'text' => "opt{$o}",
                    'is_correct' => $o === 0, 'canonical_order' => $o,
                ]);
            }
        }

        return Exam::create([
            'exam_programme_id' => $programme->id,
            'type' => Exam::TYPE_DAILY_PRACTICE,
            'title' => 'FMGE Daily Practice',
            'block_count' => 1,
            'questions_per_block' => $perDay,
            'block_duration_minutes' => 15,
            'plan_days' => $planDays,
            'questions_per_day' => $perDay,
            'timer_enabled' => false,
            'allow_retry' => true,
            'result_visibility' => 'immediate',
            'status' => 'published',
        ]);
    }

    private function student(Exam $exam): User
    {
        $user = User::factory()->create(['role' => 'student']);
        $user->programmeAccess()->create([
            'exam_programme_id' => $exam->exam_programme_id, 'granted_via' => 'admin',
        ]);
        return $user;
    }

    public function test_day_builds_correct_number_of_questions_without_leaking_answers(): void
    {
        $exam = $this->buildPractice(perDay: 5);
        $user = $this->student($exam);

        $this->actingAs($user);
        $plan = $this->postJson("/api/v1/exams/{$exam->id}/practice/enroll")->json('data');
        $enrollmentId = $plan['enrollment_id'];

        $day = $this->getJson("/api/v1/practice/{$enrollmentId}/days/1")->json('data');

        $this->assertCount(5, $day['questions']);
        // Pending day must NOT reveal is_correct / explanation.
        foreach ($day['questions'] as $q) {
            $this->assertArrayNotHasKey('explanation', $q);
            foreach ($q['options'] as $opt) {
                $this->assertArrayNotHasKey('is_correct', $opt);
            }
        }
    }

    public function test_locked_future_day_cannot_be_accessed(): void
    {
        $exam = $this->buildPractice();
        $user = $this->student($exam);
        $this->actingAs($user);
        $plan = $this->postJson("/api/v1/exams/{$exam->id}/practice/enroll")->json('data');

        // current_day is 1; day 2 must be locked.
        $this->getJson("/api/v1/practice/{$plan['enrollment_id']}/days/2")->assertStatus(422);
    }

    public function test_submitting_a_day_grades_and_unlocks_next_day_and_streak(): void
    {
        $exam = $this->buildPractice(perDay: 5, planDays: 3);
        $user = $this->student($exam);
        $this->actingAs($user);

        $plan = $this->postJson("/api/v1/exams/{$exam->id}/practice/enroll")->json('data');
        $enrollmentId = $plan['enrollment_id'];
        $day = $this->getJson("/api/v1/practice/{$enrollmentId}/days/1")->json('data');

        // Answer every question with its canonical correct option.
        $responses = [];
        foreach ($day['questions'] as $q) {
            $correct = QuestionOption::where('question_id', $q['question_id'])->where('is_correct', true)->first();
            $responses[$q['question_id']] = $correct->id;
        }

        $res = $this->postJson("/api/v1/practice/{$enrollmentId}/days/{$day['id']}/submit", [
            'responses' => $responses,
        ])->assertOk();

        $this->assertEquals(5, $res->json('data.correct_count'));
        $this->assertEquals(100, $res->json('data.accuracy'));
        // Submitted day reveals answers.
        $this->assertTrue($res->json('data.questions.0.options.0.is_correct') !== null);
        // Streak + progression advanced.
        $this->assertEquals(1, $res->json('enrollment.streak'));
        $this->assertEquals(2, $res->json('enrollment.current_day'));

        // Day 2 now accessible.
        $this->getJson("/api/v1/practice/{$enrollmentId}/days/2")->assertOk();
    }

    public function test_days_do_not_repeat_questions_within_the_plan(): void
    {
        $exam = $this->buildPractice(perDay: 5, planDays: 3);
        $user = $this->student($exam);
        $engine = app(PracticeEngine::class);
        $enrollment = $engine->enroll($user, $exam);

        $d1 = $engine->getOrBuildDay($enrollment, 1);
        $engine->submitDay($d1, []); // unlock day 2
        $d2 = $engine->getOrBuildDay($enrollment->fresh(), 2);

        $overlap = array_intersect($d1->question_ids, $d2->question_ids);
        $this->assertEmpty($overlap, 'Days should not reuse questions while the bank is sufficient.');
    }

    public function test_analytics_overview_reflects_completed_practice(): void
    {
        $exam = $this->buildPractice(perDay: 5, planDays: 3);
        $user = $this->student($exam);
        $engine = app(PracticeEngine::class);
        $enrollment = $engine->enroll($user, $exam);
        $day = $engine->getOrBuildDay($enrollment, 1);

        $responses = [];
        foreach ($day->question_ids as $i => $qid) {
            // Answer first 3 correctly, leave 2 blank.
            if ($i < 3) {
                $responses[$qid] = QuestionOption::where('question_id', $qid)->where('is_correct', true)->first()->id;
            }
        }
        $engine->submitDay($day, $responses);

        $this->actingAs($user);
        $overview = $this->getJson('/api/v1/analytics/overview')->json('data');

        $this->assertTrue($overview['has_activity']);
        $this->assertEquals(3, $overview['correct']);
        $this->assertEquals(3, $overview['questions_attempted']);
        $this->assertEquals(1, $overview['days_completed']);
        $this->assertEquals(1, $overview['current_streak']);
    }

    public function test_analytics_empty_for_new_student(): void
    {
        $exam = $this->buildPractice();
        $user = $this->student($exam);

        $this->actingAs($user);
        $overview = $this->getJson('/api/v1/analytics/overview')->json('data');

        $this->assertFalse($overview['has_activity']);
        $this->assertEquals(0, $overview['correct']);
        $this->assertEquals(0.0, $overview['overall_accuracy']);
    }
}
