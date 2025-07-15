<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Transaction;
use App\Models\Bank;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        $bankCode = $request->query('bank_code');
        $query = Transaction::query();

        if ($bankCode) {
            $bankId = Bank::where('bank_code', $bankCode)->first()->id ?? null;
            if ($bankId) {
                $query->where('bank_id', $bankId);
            }
        }

        return $query->orderBy('transaction_date', 'desc')->get();
    }
}
