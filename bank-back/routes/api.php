<?php

use App\Http\Controllers\ContragentController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BOGStatementController;
use App\Http\Controllers\TBCStatementController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use \App\Models\User;
use \App\Models\GorgiaBogTransaction;
use \App\Models\Transaction;
use App\Http\Controllers\TbcPasswordController;

Route::post('/login', [AuthController::class, 'login']);

// BOG Gorgia Statements
Route::get('/gorgia/bog/todayactivities', [BOGStatementController::class, 'todayActivities']);
Route::get('/bog/statement/{accountNumber}/{currency}/{startDate}/{endDate}/{includeToday?}/{orderByDate?}', [BOGStatementController::class, 'statement']);
Route::get('/gorgia-bog-transactions', function () {
    return GorgiaBogTransaction::orderBy('transaction_date', 'desc')->get();
});

// BOG Anta Statements
Route::get('/anta/bog/todayactivities', [BOGStatementController::class, 'todayActivities']);
Route::get('/anta-bog-transactions', function () {
    return GorgiaBogTransaction::orderBy('transaction_date', 'desc')->get();
});

// TBC Gorgia Statements
Route::get('/gorgia/tbc/todayactivities', [TBCStatementController::class, 'todayActivities']);
Route::get('/gorgia-tbc-transactions', function () {
    return Transaction::orderBy('transaction_date', 'desc')->get();
});

// TBC Anta Statements
Route::get('/anta/tbc/todayactivities', [TBCStatementController::class, 'todayActivities']);
Route::get('/anta-tbc-transactions', function () {
    return Transaction::orderBy('transaction_date', 'desc')->get();
});

// TBC Sync Today's Transactions
Route::get('/tbc/sync-today', [TBCStatementController::class, 'syncTodayTransactions']);

// Users
Route::get('/users', function () {
    return User::orderBy('created_at', 'desc')->get();
});
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});


Route::middleware('auth:sanctum')->group(function () {
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
});


// BOG Statement Migration
Route::get('/bog/migrate-all-statements', [BOGStatementController::class, 'migrateAllStatementsByMonth']);
Route::get('/bog/statement-by-month/{currency}/{startDate}/{endDate}/{includeToday?}/{orderByDate?}', [BOGStatementController::class, 'statementByMonthJob']);
