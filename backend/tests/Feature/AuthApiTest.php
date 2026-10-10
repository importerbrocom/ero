<?php

namespace Tests\Feature;

use App\Models\Exam;
use App\Models\ExamBlock;
use App\Models\ExamProgramme;
use App\Models\Question;
use App\Models\QuestionOption;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_and_receives_token(): void
    {
        $res = $this->postJson('/api/v1/auth/register', [
            'name' => 'New Grad',
            'email' => 'grad@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $res->assertCreated()
            ->assertJsonStructure(['user' => ['id', 'name', 'email', 'role'], 'token']);
        $this->assertEquals('student', $res->json('user.role'));
    }

    public function test_login_rejects_bad_credentials(): void
    {
        User::factory()->create(['email' => 'a@b.com']);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'a@b.com',
            'password' => 'wrong-password',
        ])->assertStatus(422);
    }

    public function test_student_cannot_start_attempt_without_programme_access(): void
    {
        $exam = $this->publishedExam();
        $user = User::factory()->create(['role' => 'student']);

        $this->actingAs($user)
            ->postJson("/api/v1/exams/{$exam->id}/attempts")
            ->assertStatus(403);
    }

    public function test_block_questions_never_leak_answer_key_during_mock(): void
    {
        $exam = $this->publishedExam();
        $user = User::factory()->create(['role' => 'student']);
        $user->programmeAccess()->create([
            'exam_programme_id' => $exam->exam_programme_id,
            'granted_via' => 'admin',
        ]);

        $this->actingAs($user);
        $attempt = $this->postJson("/api/v1/exams/{$exam->id}/attempts")->json('data');
        $blockId = $attempt['blocks'][0]['id'];

        $this->postJson("/api/v1/attempts/{$attempt['id']}/blocks/{$blockId}/start");
        $questions = $this->getJson("/api/v1/attempts/{$attempt['id']}/blocks/{$blockId}/questions")
            ->json('data.questions');

        foreach ($questions as $q) {
            $this->assertArrayNotHasKey('explanation', $q, 'Explanation leaked during active mock.');
            foreach ($q['options'] as $opt) {
                $this->assertArrayNotHasKey('is_correct', $opt, 'Answer key leaked during active mock.');
            }
        }
    }

    public function test_locked_future_block_cannot_be_read(): void
    {
        $exam = $this->publishedExam();
        $user = User::factory()->create(['role' => 'student']);
        $user->programmeAccess()->create([
            'exam_programme_id' => $exam->exam_programme_id,
            'granted_via' => 'admin',
        ]);

        $this->actingAs($user);
        $attempt = $this->postJson("/api/v1/exams/{$exam->id}/attempts")->json('data');
        // The second block in display order is locked.
        $lockedBlock = collect($attempt['blocks'])->firstWhere('status', 'locked');

        $this->getJson("/api/v1/attempts/{$attempt['id']}/blocks/{$lockedBlock['id']}/questions")
            ->assertStatus(403);
    }

    private function publishedExam(): Exam
    {
        $programme = ExamProgramme::create([
            'slug' => 'p', 'name' => 'P', 'full_name' => 'P', 'config' => [], 'status' => 'published',
        ]);
        $subject = Subject::create(['exam_programme_id' => $programme->id, 'name' => 'S', 'slug' => 's']);
        $exam = Exam::create([
            'exam_programme_id' => $programme->id,
            'type' => Exam::TYPE_FULL_MOCK,
            'title' => 'Mock',
            'block_count' => 2,
            'questions_per_block' => 3,
            'block_duration_minutes' => 30,
            'block_release_interval_minutes' => 55,
            'status' => 'published',
            'allow_retry' => true,
        ]);
        for ($b = 1; $b <= 2; $b++) {
            $block = ExamBlock::create(['exam_id' => $exam->id, 'logical_number' => $b]);
            $attach = [];
            for ($q = 1; $q <= 3; $q++) {
                $question = Question::create([
                    'exam_programme_id' => $programme->id,
                    'subject_id' => $subject->id,
                    'stem' => "Q{$b}{$q}",
                    'explanation' => 'secret explanation',
                    'status' => 'active',
                ]);
                foreach (range(0, 3) as $i) {
                    QuestionOption::create([
                        'question_id' => $question->id,
                        'text' => "opt{$i}",
                        'is_correct' => $i === 0,
                        'canonical_order' => $i,
                    ]);
                }
                $attach[$question->id] = ['canonical_position' => $q];
            }
            $block->questions()->attach($attach);
        }

        return $exam;
    }
}
