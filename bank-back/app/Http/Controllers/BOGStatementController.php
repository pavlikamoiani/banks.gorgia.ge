<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\BOG\BOGService;

class BOGStatementController extends Controller
{
    // public function index(Request $request, BOGService $bog)
    // {
    //     $account = $request->input('account', env('BOG_ACCOUNT'));
    //     $dateFrom = $request->input('dateFrom', now()->subMonth()->format('Y-m-d'));
    //     $dateTo = $request->input('dateTo', now()->format('Y-m-d'));

    //     $data = $bog->getTransactions($account, $dateFrom, $dateTo);

    //     return response()->json($data);
    // }

    public function todayActivities(Request $request, BOGService $bog)
    {
        $account = $request->input('account', env('BOG_ACCOUNT'));
        $currency = $request->input('currency', env('BOG_CURRENCY', 'GEL'));

        $data = $bog->getTodayActivities($account, $currency);

        return response()->json($data);
    }
}
