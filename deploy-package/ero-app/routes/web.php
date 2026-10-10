<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web routes
|--------------------------------------------------------------------------
| The React SPA (built to public/) is served for all non-API, non-asset
| paths so client-side routing works on deep links (e.g. /app/exams).
| The API lives under /api/v1 (see routes/api.php) and is matched first.
*/

Route::get('/{any?}', function () {
    // SPA entry is stored as app.html so it never collides with Laravel's
    // public/index.php front controller.
    $index = public_path('app.html');

    abort_unless(file_exists($index), 404, 'Frontend build not found. Deploy the SPA into public/.');

    return response()->file($index);
})->where('any', '^(?!api).*$');
