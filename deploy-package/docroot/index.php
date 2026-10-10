<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

/*
|--------------------------------------------------------------------------
| ERO — cPanel front controller
|--------------------------------------------------------------------------
| The Laravel application lives ABOVE the public web root so that source code,
| .env and storage are never web-accessible. This file is the ONLY PHP entry
| point inside the document root (/home/uddjzwrz/ero.nokkoo.in).
|
| $APP_BASE must point at the Laravel app directory. Default assumes it sits
| next to the docroot as /home/uddjzwrz/ero-app. If you place it elsewhere,
| edit this one line.
*/
$APP_BASE = __DIR__.'/../ero-app';

// Maintenance mode...
if (file_exists($maintenance = $APP_BASE.'/storage/framework/maintenance.php')) {
    require $maintenance;
}

// Composer autoloader...
require $APP_BASE.'/vendor/autoload.php';

// Bootstrap Laravel and handle the request...
/** @var Application $app */
$app = require_once $APP_BASE.'/bootstrap/app.php';

// The real public web root is THIS directory (the docroot), not ero-app/public.
// Point Laravel's public_path() here so asset()/public_path() resolve correctly
// (e.g. the SPA entry app.html lives here).
$app->usePublicPath(__DIR__);

$app->handleRequest(Request::capture());
