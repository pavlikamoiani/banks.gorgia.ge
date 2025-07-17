<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats()
    {
        $totalTransactions = Transaction::count();
        $totalAmount = Transaction::sum('amount');

        $topContragents = Transaction::select('sender_name as name', DB::raw('SUM(amount) as amount'))
            ->groupBy('sender_name')
            ->orderByDesc('amount')
            ->limit(5)
            ->get();

        $transactionsByDay = Transaction::select(DB::raw('DATE(transaction_date) as date'), DB::raw('COUNT(*) as count'))
            ->groupBy(DB::raw('DATE(transaction_date)'))
            ->orderBy('date', 'desc')
            ->limit(7)
            ->get();

        $transactionsByBank = Transaction::select('bank_id', DB::raw('COUNT(*) as count'))
            ->groupBy('bank_id')
            ->get()
            ->map(function ($item) {
                $bank = \App\Models\Bank::find($item->bank_id);
                return [
                    'bank' => $bank ? $bank->name : 'Unknown',
                    'count' => $item->count
                ];
            });

        $today = now()->toDateString();
        $todayTransactions = Transaction::whereDate('transaction_date', $today)->count();

        return response()->json([
            'totalTransactions' => $totalTransactions,
            'totalAmount' => $totalAmount,
            'topContragents' => $topContragents,
            'transactionsByDay' => $transactionsByDay,
            'transactionsByBank' => $transactionsByBank,
            'todayTransactions' => $todayTransactions,
        ]);
    }
}
