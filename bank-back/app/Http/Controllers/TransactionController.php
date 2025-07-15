<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Transaction;
use App\Models\Bank;
use GuzzleHttp\Promise\Create;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        $bankCode = $request->query('bank_code');
        $query = Transaction::query()->whereBetween('transaction_date', [now()->subDays(7), now()]);

        if ($bankCode) {
            $bankId = Bank::where('bank_code', $bankCode)->first()->id ?? null;
            if ($bankId) {
                $query->where('bank_id', $bankId);
            }
        } else if ($request->filled('bank')) {
            $bankName = $request->query('bank');
            $bankCodeMap = [
                'TBC Bank' => 'TBC',
                'Bank of Georgia' => 'BOG',
            ];
            $bankCodeFromName = $bankCodeMap[$bankName] ?? null;
            if ($bankCodeFromName) {
                $bank = Bank::where('bank_code', $bankCodeFromName)->first();
            } else {
                $bank = Bank::where('name', $bankName)->orWhere('bank_code', $bankName)->first();
            }
            if ($bank) {
                $query->where('bank_id', $bank->id);
            }
        }

        if ($request->filled('contragent')) {
            $query->where('sender_name', 'like', '%' . $request->query('contragent') . '%');
        }

        if ($request->filled('amount')) {
            $amount = $request->query('amount');
            $query->where('amount', 'like', '%' . $amount . '%');
        }

        if ($request->filled('transferDate')) {
            $query->whereDate('transaction_date', $request->query('transferDate'));
        }

        if ($request->filled('purpose')) {
            $query->where('description', 'like', '%' . $request->query('purpose') . '%');
        }

        if ($request->filled('startDate')) {
            $query->whereDate('transaction_date', '>=', $request->query('startDate'));
        }
        if ($request->filled('endDate')) {
            $query->whereDate('transaction_date', '<=', $request->query('endDate'));
        }

        return $query->orderBy('transaction_date', 'desc')->get();
    }
}
