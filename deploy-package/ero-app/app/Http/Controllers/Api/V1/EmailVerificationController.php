<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;

/**
 * Email verification over the API.
 *
 * resend() — re-sends the verification notification to the signed-in user.
 * verify() — the signed URL target the user opens from their email; marks the
 *            address verified. Uses Laravel's standard signed-URL mechanism.
 */
class EmailVerificationController extends Controller
{
    public function status(Request $request)
    {
        return response()->json([
            'verified' => $request->user()->hasVerifiedEmail(),
        ]);
    }

    public function resend(Request $request)
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email already verified.']);
        }

        $user->sendEmailVerificationNotification();

        return response()->json(['message' => 'Verification link sent.']);
    }

    /**
     * Handle the signed verification link. Route is named 'verification.verify'
     * (required by Laravel's VerifyEmail notification) and protected by the
     * 'signed' middleware so the id+hash cannot be forged.
     */
    public function verify(Request $request, int $id, string $hash)
    {
        $user = User::findOrFail($id);

        if (! hash_equals(sha1($user->getEmailForVerification()), $hash)) {
            return response()->json(['message' => 'Invalid verification link.'], 403);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email already verified.']);
        }

        if ($user->markEmailAsVerified()) {
            event(new Verified($user));
        }

        return response()->json(['message' => 'Email verified successfully.']);
    }
}
