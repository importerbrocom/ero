<?php

namespace Tests\Feature;

use App\Models\ExamProgramme;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminMediaTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_upload_an_image(): void
    {
        Storage::fake('public');
        $admin = User::factory()->create(['role' => 'admin']);

        $res = $this->actingAs($admin)->postJson('/api/v1/admin/uploads', [
            'image' => UploadedFile::fake()->image('india-gate.jpg', 400, 200),
            'folder' => 'programmes',
        ])->assertCreated();

        $path = $res->json('data.path');
        $this->assertNotEmpty($res->json('data.url'));
        Storage::disk('public')->assertExists($path);
    }

    public function test_student_cannot_upload(): void
    {
        $student = User::factory()->create(['role' => 'student']);
        $this->actingAs($student)->postJson('/api/v1/admin/uploads', [
            'image' => UploadedFile::fake()->image('x.jpg'),
        ])->assertStatus(403);
    }

    public function test_upload_rejects_non_images(): void
    {
        Storage::fake('public');
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin)->postJson('/api/v1/admin/uploads', [
            'image' => UploadedFile::fake()->create('malware.pdf', 100, 'application/pdf'),
        ])->assertStatus(422);
    }

    public function test_admin_can_create_programme_with_cover_image(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)->postJson('/api/v1/admin/programmes', [
            'slug' => 'plab',
            'name' => 'PLAB',
            'full_name' => 'Professional and Linguistic Assessments Board',
            'country' => 'United Kingdom',
            'flag_emoji' => '🇬🇧',
            'accent_color' => '#8B45F6',
            'cover_image_url' => 'https://ero.nokkoo.in/storage/uploads/programmes/bigben.jpg',
            'status' => 'published',
        ])->assertCreated();

        $p = ExamProgramme::where('slug', 'plab')->first();
        $this->assertEquals('https://ero.nokkoo.in/storage/uploads/programmes/bigben.jpg', $p->cover_image_url);
    }

    public function test_admin_can_update_programme_by_numeric_id(): void
    {
        // Regression: ExamProgramme binds by slug for public URLs; the admin
        // update route must bind by id ({programme:id}) since the admin UI
        // sends the numeric id. Previously this 404'd ("No query results").
        $admin = User::factory()->create(['role' => 'admin']);
        $programme = ExamProgramme::create([
            'slug' => 'fmge', 'name' => 'FMGE', 'full_name' => 'FMGE',
            'config' => [], 'status' => 'published',
        ]);

        $this->actingAs($admin)
            ->putJson("/api/v1/admin/programmes/{$programme->id}", [
                'name' => 'FMGE',
                'full_name' => 'Foreign Medical Graduate Examination',
                'cover_image_url' => 'https://ero.nokkoo.in/storage/uploads/programmes/indiagate.jpg',
            ])
            ->assertOk();

        $this->assertEquals(
            'https://ero.nokkoo.in/storage/uploads/programmes/indiagate.jpg',
            $programme->fresh()->cover_image_url,
        );
    }

    public function test_welcome_banner_setting_roundtrip_and_public_read(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)->putJson('/api/v1/admin/settings', [
            'welcome_banner_url' => 'https://ero.nokkoo.in/storage/uploads/banners/welcome.jpg',
        ])->assertOk();

        $this->assertEquals(
            'https://ero.nokkoo.in/storage/uploads/banners/welcome.jpg',
            Setting::get('welcome_banner_url'),
        );

        // Public (unauthenticated) settings endpoint exposes it to the student app.
        $this->getJson('/api/v1/settings')
            ->assertOk()
            ->assertJsonPath('data.welcome_banner_url', 'https://ero.nokkoo.in/storage/uploads/banners/welcome.jpg');
    }
}
