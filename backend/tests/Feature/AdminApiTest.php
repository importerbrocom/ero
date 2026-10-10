<?php

namespace Tests\Feature;

use App\Models\ExamProgramme;
use App\Models\Question;
use App\Models\QuestionImport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminApiTest extends TestCase
{
    use RefreshDatabase;

    private function programme(): ExamProgramme
    {
        return ExamProgramme::create([
            'slug' => 'fmge', 'name' => 'FMGE', 'full_name' => 'FMGE',
            'config' => [], 'status' => 'published',
        ]);
    }

    public function test_student_is_forbidden_from_admin_endpoints(): void
    {
        $student = User::factory()->create(['role' => 'student']);

        $this->actingAs($student)->getJson('/api/v1/admin/overview')->assertStatus(403);
        $this->actingAs($student)->getJson('/api/v1/admin/students')->assertStatus(403);
        $this->actingAs($student)->getJson('/api/v1/admin/questions')->assertStatus(403);
    }

    public function test_admin_can_view_overview(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)->getJson('/api/v1/admin/overview')
            ->assertOk()
            ->assertJsonStructure(['data' => ['students', 'attempts', 'content', 'programme_performance']]);
    }

    public function test_super_admin_satisfies_admin_role(): void
    {
        $super = User::factory()->create(['role' => 'super_admin']);
        $this->actingAs($super)->getJson('/api/v1/admin/overview')->assertOk();
    }

    public function test_admin_can_create_a_question_with_correct_mapping(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $programme = $this->programme();

        $res = $this->actingAs($admin)->postJson('/api/v1/admin/questions', [
            'exam_programme_id' => $programme->id,
            'stem' => 'What is 2+2?',
            'options' => ['3', '4', '5'],
            'correct_index' => 1,
            'status' => 'active',
        ])->assertCreated();

        $questionId = $res->json('data.id');
        $correct = Question::find($questionId)->options->firstWhere('is_correct', true);
        $this->assertEquals('4', $correct->text);
    }

    public function test_activation_code_batch_generation(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $programme = $this->programme();

        $this->actingAs($admin)->postJson('/api/v1/admin/activation-codes', [
            'exam_programme_id' => $programme->id,
            'quantity' => 5,
            'max_redemptions' => 1,
        ])->assertCreated()
          ->assertJsonCount(5, 'data.codes');
    }

    public function test_csv_import_preview_validates_and_commit_persists(): void
    {
        Storage::fake('local');
        $admin = User::factory()->create(['role' => 'admin']);
        $programme = $this->programme();

        $csv = "stem,option_a,option_b,option_c,option_d,correct,subject,difficulty\n"
            ."\"Valid Q1\",Apple,Banana,Cherry,Date,B,Anatomy,easy\n"
            ."\"Bad Q - missing correct\",A,B,C,D,,Anatomy,easy\n"       // invalid: no correct
            ."\"Bad Q - correct out of range\",A,B,,,Z,Anatomy,easy\n";  // invalid: Z has no option

        $file = UploadedFile::fake()->createWithContent('questions.csv', $csv);

        $preview = $this->actingAs($admin)->postJson('/api/v1/admin/imports/preview', [
            'exam_programme_id' => $programme->id,
            'file' => $file,
        ])->assertOk();

        $this->assertEquals(3, $preview->json('data.total_rows'));
        $this->assertEquals(1, $preview->json('data.valid_rows'));
        $this->assertEquals(2, $preview->json('data.error_rows'));

        $importId = $preview->json('data.id');
        $storedPath = $preview->json('data.stored_path');

        $commit = $this->actingAs($admin)->postJson("/api/v1/admin/imports/{$importId}/commit", [
            'stored_path' => $storedPath,
        ])->assertOk();

        // Only the single valid row is persisted.
        $this->assertEquals(1, $commit->json('result.imported'));
        $this->assertEquals(2, $commit->json('result.skipped'));
        $this->assertEquals(1, Question::where('exam_programme_id', $programme->id)->count());

        // And the correct option (B = Banana) is mapped canonically.
        $q = Question::where('exam_programme_id', $programme->id)->first();
        $this->assertEquals('Banana', $q->options->firstWhere('is_correct', true)->text);
    }
}
