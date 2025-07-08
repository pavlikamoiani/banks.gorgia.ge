<?php

use App\Http\Controllers\ContragentController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BOGStatementController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use \App\Models\User;
use \App\Models\GorgiaBogTransaction;

Route::post('/login', [AuthController::class, 'login']);

// BOG Statements
Route::get('/bog/todayactivities', [BOGStatementController::class, 'todayActivities']);
Route::get('/bog/statement/{accountNumber}/{currency}/{startDate}/{endDate}/{includeToday?}/{orderByDate?}', [BOGStatementController::class, 'statement']);
Route::get('/gorgia-bog-transactions', function () {
    return GorgiaBogTransaction::orderBy('transaction_date', 'desc')->get();
});


// Users
Route::get('/users', function () {
    return User::orderBy('created_at', 'desc')->get();
});
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});


Route::middleware('auth:sanctum')->group(function () {
    Route::get('/contragents', [ContragentController::class, 'index']);
    Route::post('/contragents', [ContragentController::class, 'store']);
    Route::middleware('auth:sanctum')->post('/logout', [AuthController::class, 'logout']);
    Route::post('/users', [AuthController::class, 'store']);
    Route::put('/users/{id}', [AuthController::class, 'update']);
    Route::delete('/users/{id}', [AuthController::class, 'destroy']);
});


// BOG Statement Migration
Route::get('/bog/migrate-all-statements', [BOGStatementController::class, 'migrateAllStatementsByMonth']);
Route::get('/bog/statement-by-month/{currency}/{startDate}/{endDate}/{includeToday?}/{orderByDate?}', [BOGStatementController::class, 'statementByMonthJob']);
