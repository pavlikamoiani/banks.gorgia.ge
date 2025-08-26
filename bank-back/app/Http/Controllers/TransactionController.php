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

        $page = (int) $request->query('page', 1);
        $pageSize = (int) $request->query('pageSize', 25);
        $offset = ($page - 1) * $pageSize;

        if (!$request->filled('startDate') && !$request->filled('endDate')) {
            $query = Transaction::query();
        } else {
            $query = Transaction::query();
        }

        $route = $request->route() ? $request->route()->uri() : '';
        if (strpos($route, 'anta-transactions') !== false || ($user && $user->bank === 'anta')) {
            $query->where('bank_id', 2);
        } elseif (strpos($route, 'gorgia-transactions') !== false || ($user && $user->bank === 'gorgia')) {
            $query->where('bank_id', 1);
        }

        $isTbc = false;

        if ($bankCode) {
            $bank = Bank::where('bank_code', $bankCode)->first();
            if ($bank) {
                $query->where('bank_type', $bank->id);
                $isTbc = ($bankCode === 'TBC');
            }
        } elseif ($request->filled('bank')) {
            $bankCodeMap = [
                'TBC Bank' => 'TBC',
                'Bank of Georgia' => 'BOG',
                'სს "თბს ბანკი"' => 'TBC',
                'სს "საქართველოს ბანკი"' => 'BOG',
            ];
            $bankCodeFromName = $bankCodeMap[$bankName] ?? null;
            if ($bankCodeFromName === 'TBC' || $bankName === 'TBC') {
                $bank = Bank::where('bank_code', 'TBC')->first();
                if ($bank) {
                    $query->where('bank_type', $bank->id);
                    $isTbc = true;
                }
            } else {
                $bank = Bank::where('bank_code', $bankCodeFromName)->first();
                if (!$bank && $bankName) {
                    $bank = Bank::where('name', $bankName)->orWhere('bank_code', $bankName)->first();
                }
                if ($bank) {
                    $query->where('bank_type', $bank->id);
                }
            }
        }

        if (!$bankCode && !$request->filled('bank')) {
            $tbcBank = Bank::where('bank_code', 'TBC')->first();
            if ($tbcBank) {
                $query->where(function ($q) use ($tbcBank) {
                    $q->where('bank_type', '!=', $tbcBank->id)
                        ->orWhere(function ($subQ) use ($tbcBank) {
                            $subQ->where('bank_type', $tbcBank->id)->where('status_code', 3);
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
            $query->where('amount', $amount);
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

        if ($request->query('installmentOnly') === 'true') {
            $query->where(function ($q) {
                $q->where('description', 'like', '%განვსაქონლის%')
                    ->orWhere('description', 'like', '%განაწილება%');
            });
        }

        if ($request->query('transfersOnly') === 'true') {
            $query->where('sender_name', 'like', '%შპს გორგია%');
        }

        if ($user && $user->role !== 'super_admin') {
            $visibleContragents = \App\Models\Contragent::whereJsonContains('visible_for_roles', $user->role)
                ->pluck('identification_code')->toArray();

            $roleSettings = json_decode(optional(\App\Models\Setting::where('key', 'payment_type_visibility')->first())->value, true) ?? [];
            $userVisiblePaymentTypes = $roleSettings[$user->role] ?? [];

            $query->where(function ($q) use ($visibleContragents, $userVisiblePaymentTypes) {
                $q->whereIn('contragent_id', $visibleContragents);

                if (in_array('terminal', $userVisiblePaymentTypes)) {
                    $q->orWhere(function ($sq) {
                        $sq->where(function ($innerQ) {
                            $innerQ->where('sender_name', 'like', '%TBCBank_ის%')
                                ->orWhere('sender_name', 'like', '%Wallet/domestic/%')
                                ->orWhereNull('sender_name')
                                ->orWhere('sender_name', '');
                        });
                    });
                }

                if (in_array('enrollments', $userVisiblePaymentTypes)) {
                    $q->orWhere(function ($sq) {
                        $sq->where(function ($innerQ) {
                            $innerQ->where(function ($notTerminalQ) {
                                $notTerminalQ
                                    ->where(function ($subQ) {
                                        $subQ->where('sender_name', 'not like', '%TBCBank_ის%')
                                            ->where('sender_name', 'not like', '%Wallet/domestic/%')
                                            ->whereRaw('(sender_name IS NOT NULL AND sender_name != "")')
                                            ->where('sender_name', 'not like', '%შპს გორგია%');
                                    });
                            });
                        });
                    });
                }
            });

            $query->where('description', 'not like', '%თვის ხელფასი%');
        }

        $total = $query->count();

        $sortKey = $request->query('sortKey');
        $sortDirection = $request->query('sortDirection', 'desc');

        if ($sortKey) {
            $sortMap = [
                'contragent' => 'sender_name',
                'bank' => 'bank_type',
                'amount' => 'amount',
                'transferDate' => 'transaction_date',
                'purpose' => 'description',
                'syncDate' => 'created_at'
            ];
            $dbSortKey = $sortMap[$sortKey] ?? $sortKey;
            $query->orderBy($dbSortKey, $sortDirection);
        } else {
            $query->orderBy('transaction_date', 'desc');
        }

        $results = $query
            ->limit($pageSize)
            ->offset($offset)
            ->get();

        $data = $results->map(function ($item) {
            $arr = $item->toArray();
            $arr['bank_name'] = $item->bank_name ?? null;
            if (isset($arr['transaction_date'])) {
                $arr['transaction_date'] = date('Y-m-d H:i:s', strtotime($arr['transaction_date']));
            }
            if (isset($arr['created_at'])) {
                $arr['created_at'] = date('Y-m-d H:i:s', strtotime($arr['created_at']));
            }
            return $arr;
        });

        return response()->json([
            'data' => $data,
            'pagination' => [
                'total' => $total,
                'page' => $page,
                'pageSize' => $pageSize,
                'totalPages' => ceil($total / $pageSize)
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
