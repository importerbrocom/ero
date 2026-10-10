<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ActivationCode;
use App\Models\ActivationCodeRedemption;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ActivationController extends Controller
{
    /** Redeem an activation code to unlock a programme (server-validated). */
    public function redeem(Request $request)
    {
        $data = $request->validate([
            'code' => ['required', 'string'],
        ]);

        $user = $request->user();

        return DB::transaction(function () use ($data, $user) {
            $code = ActivationCode::where('code', $data['code'])->lockForUpdate()->first();

            if (! $code || ! $code->isRedeemable()) {
                return response()->json(['message' => 'This activation code is invalid, expired or fully used.'], 422);
            }

            // Duplicate-redemption protection.
            $already = ActivationCodeRedemption::where('activation_code_id', $code->id)
                ->where('user_id', $user->id)->exists();
            if ($already) {
                return response()->json(['message' => 'You have already redeemed this code.'], 422);
            }

            ActivationCodeRedemption::create([
                'activation_code_id' => $code->id,
                'user_id' => $user->id,
                'redeemed_at' => now(),
            ]);
            $code->increment('redemption_count');

            if ($code->exam_programme_id) {
                $user->programmeAccess()->updateOrCreate(
                    ['exam_programme_id' => $code->exam_programme_id],
                    ['granted_via' => 'activation_code']
                );
            }

            AuditLog::record('activation_code.redeemed', $code, ['user_id' => $user->id]);

            return response()->json([
                'message' => 'Programme unlocked successfully.',
                'exam_programme_id' => $code->exam_programme_id,
            ]);
        });
    }
}
