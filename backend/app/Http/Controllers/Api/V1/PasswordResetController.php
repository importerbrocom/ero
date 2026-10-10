<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

/**
 * Password reset over the API (works for both web SPA and mobile).
 *
 * forgot()  — emails a reset link/token (always returns a generic success so we
 *             never leak which emails are registered).
 * reset()   — consumes the token + sets a new password.
 */
class PasswordResetController extends Controller
{
    public function forgot(Request $request)
    {
        $request->validate(['email' => ['required', 'email']]);

        // Password::sendResetLink dispatches the ResetPassword notification which,
        // on a shared host without SMTP configured, is written to the log driver.
        Password::sendResetLink($request->only('email'));

        // Generic response — do not reveal whether the email exists.
        return response()->json([
            'message' => 'If that email is registered, a password reset link has been sent.',
        ]);
    }

    public function reset(Request $request)
    {
        $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                // Invalidate all existing API tokens on password reset.
                $user->tokens()->delete();

                event(new PasswordReset($user));
            }
        );

        if ($status !== Password::PasswordReset) {
            return response()->json(['message' => __($status)], 422);
        }

        return response()->json(['message' => 'Your password has been reset. Please sign in.']);
    }
}
