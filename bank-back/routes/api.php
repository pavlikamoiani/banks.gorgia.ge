<?php

use App\Http\Controllers\ContragentController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BOGStatementController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;


/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::post('/login', [AuthController::class, 'login']);
Route::get('/bog/todayactivities', [BOGStatementController::class, 'todayActivities']);

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/contragents', [ContragentController::class, 'index']);
    Route::post('/contragents', [ContragentController::class, 'store']);
    Route::middleware('auth:sanctum')->post('/logout', [AuthController::class, 'logout']);
    Route::post('/users', [AuthController::class, 'store']);
    Route::get('/users', function () {
        return \App\Models\User::orderBy('created_at', 'desc')->get();
    });
    Route::put('/users/{id}', [AuthController::class, 'update']);
    Route::delete('/users/{id}', [AuthController::class, 'destroy']);
});
