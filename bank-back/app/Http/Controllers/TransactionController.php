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
        $user = $request->user();

        $bankCode = $request->query('bank_code');
        $bankName = $request->query('bank');
        $page = (int) $request->query('page', 1);
        $pageSize = (int) $request->query('pageSize', 25);
        $offset = ($page - 1) * $pageSize;

        $query = Transaction::select([
            'id',
            'sender_name',
            'contragent_id',
            'bank_statement_id',
            'amount',
            'bank_type',
            'status_code',
            'description',
            'transaction_date',
            'created_at'
        ]);

        if ($bankCode) {
            $bank = Bank::select('id')->where('bank_code', $bankCode)->first();
            if ($bank) $query->where('bank_type', $bank->id);
        }

        if ($bankName) {
            $bank = Bank::select('id')->where('name', $bankName)->orWhere('bank_code', $bankName)->first();
            if ($bank) $query->where('bank_type', $bank->id);
        }

        if ($request->filled('startDate')) {
            $query->whereDate('transaction_date', '>=', $request->query('startDate'));
        }
        if ($request->filled('endDate')) {
            $query->whereDate('transaction_date', '<=', $request->query('endDate'));
        }

        if ($request->filled('amount')) {
            $query->where('amount', $request->query('amount'));
        }

        if ($request->filled('purpose')) {
            $query->where('description', 'like', '%' . $request->query('purpose') . '%');
        }

        if ($request->filled('contragent')) {
            $c = $request->query('contragent');
            $query->where(function ($q) use ($c) {
                $q->where('sender_name', 'like', "%$c%")
                    ->orWhere('contragent_id', 'like', "%$c%")
                    ->orWhere('bank_statement_id', 'like', "%$c%");
            });
        }

        $sortKey = $request->query('sortKey', 'transaction_date');
        $sortDir = $request->query('sortDirection', 'desc');
        $sortMap = [
            'contragent' => 'sender_name',
            'bank' => 'bank_type',
            'amount' => 'amount',
            'transferDate' => 'transaction_date',
            'purpose' => 'description',
            'syncDate' => 'created_at'
        ];
        $query->orderBy($sortMap[$sortKey] ?? 'transaction_date', $sortDir);

        $lastId = $request->query('lastId');
        if ($lastId) {
            $query->where('id', '>', $lastId);
        }

        $cacheKey = md5('transactions_count_' . serialize($request->all()));
        $total = cache()->remember($cacheKey, 60, function () use ($query) {
            try {
                return (clone $query)->count();
            } catch (\Throwable $e) {
                return 0;
            }
        });

        $results = $query->limit($pageSize)->get();

        $data = $results->map(function ($item) {
            return [
                'id' => $item->id,
                'sender_name' => $item->sender_name,
                'contragent_id' => $item->contragent_id,
                'bank_statement_id' => $item->bank_statement_id,
                'amount' => $item->amount,
                'bank_type' => $item->bank_type,
                'status_code' => $item->status_code,
                'description' => $item->description,
                'transaction_date' => optional($item->transaction_date)->format('Y-m-d H:i:s'),
                'created_at' => optional($item->created_at)->format('Y-m-d H:i:s'),
            ];
        });

        return response()->json([
            'data' => $data,
            'pagination' => [
                'total' => $total,
                'page' => $page,
                'pageSize' => $pageSize,
                'totalPages' => ceil($total / $pageSize),
                'lastId' => $data->last()->id ?? null
            ]
        ]);
    }


    public function todayActivities(Request $request)
    {
        try {
            $user = $request->user();
            $query = Transaction::query()->whereDate('transaction_date', now()->toDateString());

            $page = (int) $request->query('page', 1);
            $pageSize = (int) $request->query('pageSize', 25);
            $offset = ($page - 1) * $pageSize;

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

            if ($request->query('installmentOnly') === 'true') {
                $query->where(function ($q) {
                    $q->where('description', 'like', '%განვსაქონლის%')
                        ->orWhere('description', 'like', '%განაწილება%');
                });
            }

            if ($request->query('transfersOnly') === 'true') {
                $query->where('sender_name', 'like', '%შპს გორგია%');
            }

            $query->selectRaw("*, REPLACE(sender_name, 'Wallet/domestic/', '') as sender_name");

            if ($user && $user->role !== 'super_admin') {
                $visibleContragents = \App\Models\Contragent::whereJsonContains('visible_for_roles', $user->role)
                    ->pluck('identification_code')->toArray();

                $roleSettings = json_decode(optional(\App\Models\Setting::where('key', 'payment_type_visibility')->first())->value, true) ?? [];
                $userVisiblePaymentTypes = $roleSettings[$user->role] ?? [];

                $query->where(function ($q) use ($visibleContragents, $user, $userVisiblePaymentTypes) {
                    $q->whereIn('contragent_id', $visibleContragents);

                    if (in_array('terminal', $userVisiblePaymentTypes)) {
                        $q->orWhere(function ($sq) {
                            $sq->where(function ($innerQ) {
                                $innerQ->where('sender_name', 'like', '%TBCBank_ის%')
                                    ->orWhere('sender_name', 'like', '%Wallet/domestic/%')
                                    ->orWhere('sender_name', 'like', '%ECOM/POS%')
                                    ->orWhereNull('sender_name')
                                    ->orWhere('sender_name', '');
                            });
                        });
                    }
                });

                $query->where('description', 'not like', '%თვის ხელფასი%');
            }

            $total = $query->count();

            $data = $query->orderBy('transaction_date', 'desc')
                ->limit($pageSize)
                ->offset($offset)
                ->get();

            return response()->json([
                'data' => $data,
                'pagination' => [
                    'total' => $total,
                    'page' => $page,
                    'pageSize' => $pageSize,
                    'totalPages' => ceil($total / $pageSize)
                ]
            ]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
