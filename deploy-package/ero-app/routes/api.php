<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — v1
|--------------------------------------------------------------------------
| All API endpoints are versioned under /api/v1. Controllers are wired up in
| the application layer phase. Keeping this file present so routing/boot works.
*/

Route::prefix('v1')->group(function () {
    Route::get('/health', fn () => response()->json([
        'status' => 'ok',
        'service' => 'ero-api',
        'version' => 'v1',
    ]));

    require __DIR__.'/api_v1.php';
});

/*
|--------------------------------------------------------------------------
| TEMPORARY one-time deploy helper — REMOVE after first deploy
|--------------------------------------------------------------------------
| Lets you run migrations + seed on shared hosting without SSH, guarded by a
| secret key set in .env (DEPLOY_MIGRATE_KEY). Visit:
|   https://ero.nokkoo.in/api/deploy/migrate?key=YOUR_KEY
|   https://ero.nokkoo.in/api/deploy/migrate?key=YOUR_KEY&seed=1
| Then set DEPLOY_MIGRATE_KEY= (empty) in .env and delete this block.
*/
Route::get('/deploy/migrate', function (\Illuminate\Http\Request $request) {
    $expected = config('app.deploy_migrate_key');
    abort_if(empty($expected), 404);
    abort_unless(hash_equals($expected, (string) $request->query('key')), 403, 'Invalid key.');

    \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
    $output = \Illuminate\Support\Facades\Artisan::output();

    if ($request->boolean('seed')) {
        \Illuminate\Support\Facades\Artisan::call('db:seed', ['--force' => true]);
        $output .= "\n".\Illuminate\Support\Facades\Artisan::output();
    }

    return response("<pre>".e($output)."</pre>")->header('Content-Type', 'text/html');
});
