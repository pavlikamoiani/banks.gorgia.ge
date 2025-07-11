<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Repositories\TBCBank\TransactionRepository;

class TBCStatementController extends Controller
{
    public function todayActivities(Request $request)
    {
        $company = $request->path() === 'api/gorgia/tbc/todayactivities' ? 'gorgia' : 'anta';

        // Get today's date in Y-m-d format
        $today = Carbon::now()->format('Y-m-d');

        // Query transactions from today
        $transactions = Transaction::whereDate('transaction_date', $today)
            ->orderBy('transaction_date', 'desc')
            ->get();

        // Format the transactions to match the structure expected by the frontend
        $formattedTransactions = $transactions->map(function ($transaction) {
            return [
                'id' => $transaction->id,
                'Sender' => [
                    'Name' => $transaction->sender_name,
                    'BankName' => 'TBC Bank'
                ],
                'Amount' => $transaction->amount,
                'PostDate' => $transaction->transaction_date,
                'ValueDate' => $transaction->reflection_date,
                'EntryComment' => $transaction->description,
                'SourceBank' => 'TBC'
            ];
        });

        return response()->json(['activities' => $formattedTransactions]);
    }

    public function statement(Request $request)
    {
        // Additional method that could be implemented to get historical statements
        // Similar to BOGStatementController's statement method
        return response()->json(['message' => 'Not implemented yet']);
    }

    public function syncTodayTransactions()
    {
        try {
            $repository = new TransactionRepository();
            $repository->transactionsByTimestamp(Carbon::today());
            return response()->json(['status' => 'success', 'message' => 'Transactions synced successfully']);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }
}
