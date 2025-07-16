<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Repositories\TBCBank\TransactionRepository;

class TBCStatementController extends Controller
{
    public function todayActivities(Request $request)
    {

        set_time_limit(600);

        $company = $request->path() === 'api/gorgia/tbc/todayactivities' ? 'gorgia' : 'anta';

        $today = Carbon::now()->format('Y-m-d');

        try {
            Log::info("Starting TBC transaction sync for today: {$today}");
            $repository = new TransactionRepository();
            $repository->transactionsByTimestamp(Carbon::today()->startOfDay());
            Log::info("TBC transaction sync completed");
        } catch (\Exception $e) {
            Log::error('Error syncing TBC transactions: ' . $e->getMessage());
        }

        $transactions = Transaction::whereDate('transaction_date', $today)
            ->orderBy('transaction_date', 'desc')
            ->get();

        Log::info('TBC today transactions count: ' . $transactions->count());

        $formattedTransactions = $transactions->map(function ($transaction) {
            return [
                'id' => $transaction->id,
                'Sender' => [
                    'Name' => $transaction->sender_name,
                    'BankName' => 'TBC Bank',
                    'Inn' => $transaction->contragent ? $transaction->contragent->identification_code : ($transaction->contragent_id ?? null),
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
