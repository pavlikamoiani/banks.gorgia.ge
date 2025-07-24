<?php

use App\Http\Controllers\ContragentController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BOGStatementController;
use App\Http\Controllers\TBCStatementController;
use App\Http\Controllers\LiveStatementController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TbcPasswordController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\DashboardController;

Route::post('/login', [AuthController::class, 'login']);

Route::get('/dashboard-stats', [DashboardController::class, 'stats']);

Route::middleware('auth:sanctum')->group(function () {
    // Users
    Route::get('/users', [AuthController::class, 'index']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Contragents
    Route::get('/contragents', [ContragentController::class, 'index']);
    Route::post('/contragents', [ContragentController::class, 'store']);
    Route::put('/contragents/{id}', [ContragentController::class, 'update']);
    Route::delete('/contragents/{id}', [ContragentController::class, 'destroy']);

    Route::middleware('auth:sanctum')->post('/logout', [AuthController::class, 'logout']);
    Route::post('/users', [AuthController::class, 'store']);
    Route::put('/users/{id}', [AuthController::class, 'update']);
    Route::delete('/users/{id}', [AuthController::class, 'destroy']);

    // TBC Password Management
    Route::get('/tbc-password/info', [TbcPasswordController::class, 'info']);
    Route::post('/tbc-password/update', [TbcPasswordController::class, 'update']);

    // TBC Gorgia Statements

    // BOG Gorgia Statements
    Route::get('/bog/statement/{accountNumber}/{currency}/{startDate}/{endDate}/{includeToday?}/{orderByDate?}', [BOGStatementController::class, 'statement']);

    // All Anta Statements
    Route::get('/anta-transactions', [TransactionController::class, 'index']);

    // All Gorgia Transactions
    Route::get('/gorgia-transactions', [TransactionController::class, 'index']);

    // Live Statement
});

// BOG Statement Migration
Route::get('/bog/migrate-all-statements', [BOGStatementController::class, 'migrateAllStatementsByMonth']);
Route::get('/bog/statement-by-month/{currency}/{startDate}/{endDate}/{includeToday?}/{orderByDate?}', [BOGStatementController::class, 'statementByMonthJob']);

// TBC Sync Today's Transactions
Route::get('/tbc/sync-today', [TBCStatementController::class, 'syncTodayTransactions']);
// TBC Sync Today's Transactions
Route::get('/tbc/sync-today', [TBCStatementController::class, 'syncTodayTransactions']);

Route::get('/gorgia/tbc/todayactivities', [TBCStatementController::class, 'todayActivities']);
Route::get('/bog/todayactivities', [BOGStatementController::class, 'todayActivities']);

Route::get('/live/today-activities', [LiveStatementController::class, 'todayActivities']);


// Jobs
Route::get('/run-gorgia-bog-job', function () {
    \App\Jobs\Gorgia\GorgiaBogJob::dispatch();
    return response()->json(['status' => 'GorgiaBogJob dispatched']);
});

Route::get('/run-anta-bog-job', function () {
    \App\Jobs\Anta\AntaBogJob::dispatch();
    return response()->json(['status' => 'AntaBogJob dispatched']);
});
