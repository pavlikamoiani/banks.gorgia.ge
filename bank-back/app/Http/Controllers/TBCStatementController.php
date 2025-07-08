<?php

namespace App\Http\Controllers;

use App\Services\TBC\TBCService;
use Illuminate\Http\Request;

class TBCStatementController extends Controller
{
    protected $service;

    public function __construct(TBCService $service)
    {
        $this->service = $service;
    }

    public function index(Request $request)
    {
        $account = $request->input('account');
        $currency = $request->input('currency', 'GEL');
        $from = $request->input('from');
        $to = $request->input('to');
        $page = $request->input('page', 0);
        $size = $request->input('size', 700);
        if (!$account || !$from || !$to) {
            return response()->json(['error' => 'account, from, to required'], 400);
        }
        $data = $this->service->getAccountMovements($account, $currency, $from, $to, $page, $size);
        return response()->json($data);
    }
}
