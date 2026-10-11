<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    /** Return all admin-editable settings. */
    public function index()
    {
        return response()->json([
            'data' => [
                'welcome_banner_url' => Setting::get('welcome_banner_url'),
            ],
        ]);
    }

    /** Update settings (e.g. the student welcome-banner image URL). */
    public function update(Request $request)
    {
        $data = $request->validate([
            'welcome_banner_url' => ['nullable', 'string', 'max:2048'],
        ]);

        foreach ($data as $key => $value) {
            Setting::put($key, $value);
        }

        AuditLog::record('settings.updated', null, array_keys($data));

        return response()->json(['data' => Setting::publicSettings()]);
    }
}
