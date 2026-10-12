<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class UploadController extends Controller
{
    /**
     * Upload an image (programme cover, welcome banner, question image, etc.)
     * to the public disk and return its public URL.
     *
     * POST /api/v1/admin/uploads  (multipart)  field: image, optional: folder
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'image' => ['required', 'image', 'mimes:jpeg,jpg,png,webp,gif,svg', 'max:5120'], // 5 MB
            'folder' => ['nullable', 'string', 'in:programmes,flags,banners,questions,misc'],
        ]);

        $folder = $data['folder'] ?? 'misc';
        $path = $request->file('image')->store("uploads/{$folder}", 'public');
        $url = Storage::disk('public')->url($path);

        AuditLog::record('image.uploaded', null, ['path' => $path, 'folder' => $folder]);

        return response()->json([
            'data' => [
                'path' => $path,
                'url' => $url,
            ],
        ], 201);
    }
}
