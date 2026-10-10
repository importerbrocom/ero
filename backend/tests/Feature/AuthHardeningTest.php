<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class AuthHardeningTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_sends_verification_email_and_reports_unverified(): void
    {
        Notification::fake();

        $res = $this->postJson('/api/v1/auth/register', [
            'name' => 'Grad',
            'email' => 'grad@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertCreated();

        $this->assertFalse($res->json('user.email_verified'));
        $user = User::where('email', 'grad@example.com')->first();
        Notification::assertSentTo($user, VerifyEmail::class);
    }

    public function test_forgot_password_sends_reset_notification_and_is_generic(): void
    {
        Notification::fake();
        $user = User::factory()->create(['email' => 'reset@example.com']);

        $res = $this->postJson('/api/v1/auth/forgot-password', ['email' => 'reset@example.com'])
            ->assertOk();
        $this->assertStringContainsString('reset link has been sent', $res->json('message'));

        Notification::assertSentTo($user, ResetPassword::class);

        // Unknown email returns the SAME generic message (no account enumeration).
        $this->postJson('/api/v1/auth/forgot-password', ['email' => 'nobody@example.com'])
            ->assertOk()
            ->assertJson(['message' => 'If that email is registered, a password reset link has been sent.']);
    }

    public function test_password_can_be_reset_with_a_valid_token(): void
    {
        $user = User::factory()->create(['email' => 'reset2@example.com']);
        $token = Password::createToken($user);

        $this->postJson('/api/v1/auth/reset-password', [
            'token' => $token,
            'email' => 'reset2@example.com',
            'password' => 'brand-new-pass',
            'password_confirmation' => 'brand-new-pass',
        ])->assertOk();

        // The new password now authenticates.
        $this->postJson('/api/v1/auth/login', [
            'email' => 'reset2@example.com',
            'password' => 'brand-new-pass',
        ])->assertOk()->assertJsonStructure(['token']);
    }

    public function test_reset_fails_with_invalid_token(): void
    {
        User::factory()->create(['email' => 'reset3@example.com']);

        $this->postJson('/api/v1/auth/reset-password', [
            'token' => 'totally-wrong-token',
            'email' => 'reset3@example.com',
            'password' => 'whatever123',
            'password_confirmation' => 'whatever123',
        ])->assertStatus(422);
    }

    public function test_signed_verification_link_verifies_the_email(): void
    {
        $user = User::factory()->unverified()->create();
        $this->assertFalse($user->hasVerifiedEmail());

        $url = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            ['id' => $user->id, 'hash' => sha1($user->getEmailForVerification())],
        );

        $this->getJson($url)->assertOk();
        $this->assertTrue($user->fresh()->hasVerifiedEmail());
    }

    public function test_verification_link_rejects_tampered_hash(): void
    {
        $user = User::factory()->unverified()->create();

        $url = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            ['id' => $user->id, 'hash' => sha1('wrong@example.com')],
        );

        $this->getJson($url)->assertStatus(403);
        $this->assertFalse($user->fresh()->hasVerifiedEmail());
    }

    public function test_authenticated_user_can_check_and_resend_verification(): void
    {
        Notification::fake();
        $user = User::factory()->unverified()->create();

        $this->actingAs($user)->getJson('/api/v1/auth/email/status')
            ->assertOk()->assertJson(['verified' => false]);

        $this->actingAs($user)->postJson('/api/v1/auth/email/resend')
            ->assertOk();
        Notification::assertSentTo($user, VerifyEmail::class);
    }
}
