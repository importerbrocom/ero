<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivationCode;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ActivationCodeController extends Controller
{
    public function index(Request $request)
    {
        $query = ActivationCode::with('programme:id,name')->withCount('redemptions');
        if ($batch = $request->query('batch')) {
            $query->where('batch', $batch);
        }
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $codes = $query->latest()->paginate(25);

        return response()->json([
            'data' => $codes->items(),
            'meta' => ['current_page' => $codes->currentPage(), 'last_page' => $codes->lastPage(), 'total' => $codes->total()],
        ]);
    }

    /** Generate a batch of codes in one call. */
    public function generate(Request $request)
    {
        $data = $request->validate([
            'exam_programme_id' => ['nullable', 'exists:exam_programmes,id'],
            'quantity' => ['required', 'integer', 'min:1', 'max:1000'],
            'multi_use' => ['boolean'],
            'max_redemptions' => ['required', 'integer', 'min:1'],
            'expires_at' => ['nullable', 'date', 'after:now'],
        ]);

        $batch = 'batch_'.now()->format('ymd_His');
        $codes = [];
        for ($i = 0; $i < $data['quantity']; $i++) {
            $codes[] = ActivationCode::create([
                'code' => $this->uniqueCode(),
                'exam_programme_id' => $data['exam_programme_id'] ?? null,
                'batch' => $batch,
                'multi_use' => $data['multi_use'] ?? false,
                'max_redemptions' => $data['max_redemptions'],
                'expires_at' => $data['expires_at'] ?? null,
                'status' => 'active',
                'created_by' => $request->user()->id,
            ]);
        }

        AuditLog::record('activation_codes.generated', null, ['batch' => $batch, 'quantity' => $data['quantity']]);

        return response()->json(['data' => ['batch' => $batch, 'codes' => $codes]], 201);
    }

    public function revoke(ActivationCode $activationCode)
    {
        $activationCode->update(['status' => 'revoked']);
        AuditLog::record('activation_code.revoked', $activationCode);
        return response()->json(['message' => 'Revoked.']);
    }

    private function uniqueCode(): string
    {
        do {
            $code = 'ERO-'.Str::upper(Str::random(4)).'-'.Str::upper(Str::random(4));
        } while (ActivationCode::where('code', $code)->exists());

        return $code;
    }
}
