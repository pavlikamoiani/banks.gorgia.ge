<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Transaction;
use App\Models\Bank;
use App\Models\Contragent;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        set_time_limit(600);

        $user = $request->user();
        $bankCode = $request->query('bank_code');
        $bankName = $request->query('bank');
        if (!$request->filled('startDate') && !$request->filled('endDate')) {
            $query = Transaction::query()->whereBetween('transaction_date', [now()->subDays(7), now()]);
        } else {
            $query = Transaction::query();
        }

        $isTbc = false;

        if ($bankCode) {
            $bank = Bank::where('bank_code', $bankCode)->first();
            if ($bank) {
                $query->where('bank_id', $bank->id);
                $isTbc = ($bankCode === 'TBC');
            }
        } elseif ($request->filled('bank')) {
            $bankCodeMap = [
                'TBC Bank' => 'TBC',
                'Bank of Georgia' => 'BOG',
            ];
            $bankCodeFromName = $bankCodeMap[$bankName] ?? null;
            if ($bankCodeFromName === 'TBC' || $bankName === 'TBC') {
                $bank = Bank::where('bank_code', 'TBC')->first();
                if ($bank) {
                    $query->where('bank_id', $bank->id);
                    $isTbc = true;
                }
            } else {
                $bank = Bank::where('bank_code', $bankCodeFromName)->first();
                if (!$bank && $bankName) {
                    $bank = Bank::where('name', $bankName)->orWhere('bank_code', $bankName)->first();
                }
                if ($bank) {
                    $query->where('bank_id', $bank->id);
                }
            }
        }

        if (!$bankCode && !$request->filled('bank')) {
            $tbcBank = Bank::where('bank_code', 'TBC')->first();
            if ($tbcBank) {
                $query->where(function ($q) use ($tbcBank) {
                    $q->where('bank_id', '!=', $tbcBank->id)
                        ->orWhere(function ($subQ) use ($tbcBank) {
                            $subQ->where('bank_id', $tbcBank->id)->where('status_code', 3);
                        });
                });
            }
        } elseif ($isTbc) {
            $query->where('status_code', 3);
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

        $query->selectRaw("*, REPLACE(sender_name, 'Wallet/domestic/', '') as sender_name");

        $results = $query->orderBy('transaction_date', 'desc')->get();

        if ($user && $user->role !== 'super_admin') {
            $hiddenContragents = Contragent::whereJsonContains('hidden_for_roles', $user->role)
                ->pluck('identification_code')->toArray();
            $results = $results->filter(function ($item) use ($hiddenContragents) {
                return !in_array($item->contragent_id, $hiddenContragents);
            })->values();
        }

        return $results;
    }

    public function todayActivities(Request $request)
    {
        try {
            $user = $request->user();
            $query = Transaction::query()->whereDate('transaction_date', now()->toDateString());

            if ($request->filled('contragent')) {
                $query->where('sender_name', 'like', '%' . $request->query('contragent') . '%');
            }
            if ($request->filled('bank')) {
                $bank = Bank::where('name', $request->query('bank'))->orWhere('bank_code', $request->query('bank'))->first();
                if ($bank) {
                    $query->where('bank_id', $bank->id);
                }
            }
            if ($request->filled('amount')) {
                $query->where('amount', 'like', '%' . $request->query('amount') . '%');
            }
            if ($request->filled('transferDate')) {
                $query->whereDate('transaction_date', $request->query('transferDate'));
            }
            if ($request->filled('purpose')) {
                $query->where('description', 'like', '%' . $request->query('purpose') . '%');
            }

            $query->selectRaw("*, REPLACE(sender_name, 'Wallet/domestic/', '') as sender_name");

            $data = $query->orderBy('transaction_date', 'desc')->get();

            if ($user && $user->role !== 'super_admin') {
                $hiddenContragents = Contragent::whereJsonContains('hidden_for_roles', $user->role)
                    ->pluck('identification_code')->toArray();
                $data = $data->filter(function ($item) use ($hiddenContragents) {
                    return !in_array($item->contragent_id, $hiddenContragents);
                })->values();
            }

            return response()->json(['data' => $data]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
