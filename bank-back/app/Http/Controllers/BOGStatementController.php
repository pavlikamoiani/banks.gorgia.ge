<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Repositories\BankOfGeorgia\BOGService;
use App\Models\GorgiaBogTransaction;
use App\Models\Contragent;
use Log;
use Carbon\Carbon;

class BOGStatementController extends Controller
{
    public function todayActivities(Request $request, BOGService $bog)
    {
        $account = $request->input('account', env('BOG_ACCOUNT'));
        $currency = $request->input('currency', env('BOG_CURRENCY', 'GEL'));

        $data = $bog->getTodayActivities($account, $currency);

        // CONTRAGENT LOGIC for todayActivities
        $activities = $data['activities'] ?? (is_array($data) ? $data : []);
        foreach ($activities as $activity) {
            if (
                isset($activity['Sender']['Name'], $activity['Sender']['Inn']) &&
                trim($activity['Sender']['Name']) !== '' &&
                trim($activity['Sender']['Inn']) !== ''
            ) {
                $inn = trim($activity['Sender']['Inn']);
                $name = trim($activity['Sender']['Name']);
                $existing = \App\Models\Contragent::where('identification_code', $inn)->get();
                $shouldInsert = true;
                foreach ($existing as $contragent) {
                    if (mb_strtolower(trim($contragent->name)) === mb_strtolower($name)) {
                        $shouldInsert = false;
                        break;
                    }
                }
                if ($shouldInsert) {
                    \App\Models\Contragent::create([
                        'name' => $name,
                        'identification_code' => $inn,
                    ]);
                }
            }
        }

        return response()->json($data);
    }

    public function statement(
        $accountNumber,
        $currency,
        $startDate,
        $endDate,
        $includeToday = false,
        $orderByDate = false,
        Request $request,
        BOGService $bog
    ) {
        $includeToday = filter_var($includeToday, FILTER_VALIDATE_BOOLEAN);
        $orderByDate = filter_var($orderByDate, FILTER_VALIDATE_BOOLEAN);

        $accounts = [];
        if ($accountNumber === 'all') {
            $accounts = [
                env('BOG_ACCOUNT'),
                env('BOG_ACCOUNT_2')
            ];
        } else {
            $accounts = [$accountNumber];
        }

        $allResults = collect();

        foreach ($accounts as $acc) {
            try {
                $data = $bog->getStatement($acc, $currency, $startDate, $endDate, $includeToday, $orderByDate);
            } catch (\Exception $e) {
                Log::error('BOG API error', ['account' => $acc, 'message' => $e->getMessage()]);
                continue;
            }

            $activities = [];
            if (isset($data['activities']) && is_array($data['activities'])) {
                $activities = $data['activities'];
            } elseif (isset($data['Records']) && is_array($data['Records'])) {
                foreach ($data['Records'] as $rec) {
                    $activities[] = [
                        'Id' => $rec['EntryId'] ?? null,
                        'DocKey' => $rec['DocumentKey'] ?? null,
                        'DocNo' => $rec['EntryDocumentNumber'] ?? null,
                        'PostDate' => $rec['EntryDate'] ?? null,
                        'ValueDate' => $rec['DocumentValueDate'] ?? null,
                        'EntryType' => $rec['EntryDepartment'] ?? null,
                        'EntryComment' => $rec['EntryComment'] ?? null,
                        'EntryCommentEn' => $rec['DocumentInformation'] ?? null,
                        'Nomination' => $rec['DocumentNomination'] ?? null,
                        'Credit' => $rec['EntryAmountCredit'] ?? null,
                        'Debit' => $rec['EntryAmountDebit'] ?? null,
                        'Amount' => $rec['EntryAmount'] ?? $rec['DocumentSourceAmount'] ?? null,
                        'AmountBase' => $rec['EntryAmountBase'] ?? null,
                        'PayerName' => $rec['DocumentPayerName'] ?? null,
                        'PayerInn' => $rec['DocumentPayerInn'] ?? null,
                        'Sender' => [
                            'Name' => $rec['SenderDetails']['Name'] ?? null,
                            'Inn' => $rec['SenderDetails']['Inn'] ?? null,
                            'AccountNumber' => $rec['SenderDetails']['AccountNumber'] ?? null,
                            'BankCode' => $rec['SenderDetails']['BankCode'] ?? null,
                            'BankName' => $rec['SenderDetails']['BankName'] ?? null,
                        ],
                        'Beneficiary' => [
                            'Name' => $rec['BeneficiaryDetails']['Name'] ?? null,
                            'Inn' => $rec['BeneficiaryDetails']['Inn'] ?? null,
                            'AccountNumber' => $rec['BeneficiaryDetails']['AccountNumber'] ?? null,
                            'BankCode' => $rec['BeneficiaryDetails']['BankCode'] ?? null,
                            'BankName' => $rec['BeneficiaryDetails']['BankName'] ?? null,
                        ],
                        'syncDate' => $rec['DocumentReceiveDate'] ?? null,
                    ];
                }
            } else {
                $activities = $data ?? [];
            }

            // CONTRAGENT LOGIC
            foreach ($activities as $activity) {
                if (
                    isset($activity['Sender']['Name'], $activity['Sender']['Inn']) &&
                    trim($activity['Sender']['Name']) !== '' &&
                    trim($activity['Sender']['Inn']) !== ''
                ) {
                    $inn = trim($activity['Sender']['Inn']);
                    $name = trim($activity['Sender']['Name']);
                    $existing = Contragent::where('identification_code', $inn)->get();
                    $shouldInsert = true;
                    foreach ($existing as $contragent) {
                        if (mb_strtolower(trim($contragent->name)) === mb_strtolower($name)) {
                            $shouldInsert = false;
                            break;
                        }
                    }
                    if ($shouldInsert) {
                        Contragent::create([
                            'name' => $name,
                            'identification_code' => $inn,
                        ]);
                    }
                }
            }

            Log::info('BOG activities', [
                'account' => $acc,
                'activities' => $activities,
                'count' => count($activities)
            ]);

            $bog->saveStatementToDb($activities);

            $statements = GorgiaBogTransaction::whereDate('transaction_date', '>=', $startDate)
                ->whereDate('transaction_date', '<=', $endDate)
                ->where(function ($q) use ($acc) {
                    $q->where('sender_account_number', $acc)
                        ->orWhere('beneficiary_account_number', $acc);
                })
                ->orderBy('transaction_date', $orderByDate ? 'asc' : 'desc')
                ->get();

            $result = $statements->map(function ($item) {
                return [
                    'id' => $item->id,
                    'contragent' => $item->sender_name ?: ($item->beneficiary_name ?: '-'),
                    'bank' => $item->sender_bank_name ?: ($item->beneficiary_bank_name ?: '-'),
                    'amount' => $item->amount ?? 0,
                    'transferDate' => $item->transaction_date ? $item->transaction_date->format('Y-m-d') : '-',
                    'purpose' => $item->entry_comment ?? '-',
                    'syncDate' => $item->created_at ? $item->created_at->format('Y-m-d H:i:s') : '-',
                ];
            });

            $allResults = $allResults->merge($result);
        }

        Log::info('BOG statements for frontend', ['result' => $allResults]);

        return response()->json(['data' => $allResults->values()]);
    }

    public function migrateAllStatementsByMonth(Request $request, BOGService $bog)
    {
        set_time_limit(600);

        $currency = $request->input('currency', env('BOG_CURRENCY', 'GEL'));
        $startDateParam = $request->input('start', '2019-01-01');
        $start = Carbon::parse($startDateParam)->startOfMonth();
        $end = Carbon::now()->endOfMonth();

        $accounts = $request->has('account')
            ? [$request->input('account')]
            : [env('BOG_ACCOUNT'), env('BOG_ACCOUNT_2')];

        $allResults = [];
        $grandTotalInserted = 0;
        $grandTotalSkipped = 0;
        $lastSuccessMonth = [];

        foreach ($accounts as $account) {
            $current = $start->copy();
            $results = [];
            $totalInserted = 0;
            $totalSkipped = 0;
            $lastOkMonth = null;

            while ($current->lessThanOrEqualTo($end)) {
                $monthStart = $current->copy()->startOfMonth()->format('Y-m-d');
                $monthEnd = $current->copy()->endOfMonth()->format('Y-m-d');
                try {
                    $data = $bog->getStatement($account, $currency, $monthStart, $monthEnd, false, false);
                } catch (\Exception $e) {
                    Log::error("BOG MIGRATION ERROR for $account $monthStart - $monthEnd: " . $e->getMessage());
                    $results[] = [
                        'account' => $account,
                        'month' => $monthStart,
                        'status' => 'error',
                        'message' => $e->getMessage()
                    ];
                    $current->addMonth();
                    continue;
                }

                $activities = [];
                if (isset($data['activities']) && is_array($data['activities'])) {
                    $activities = $data['activities'];
                } elseif (isset($data['Records']) && is_array($data['Records'])) {
                    foreach ($data['Records'] as $rec) {
                        $activities[] = [
                            'Id' => $rec['EntryId'] ?? null,
                            'DocKey' => $rec['DocumentKey'] ?? null,
                            'DocNo' => $rec['EntryDocumentNumber'] ?? null,
                            'PostDate' => $rec['EntryDate'] ?? null,
                            'ValueDate' => $rec['DocumentValueDate'] ?? null,
                            'EntryType' => $rec['EntryDepartment'] ?? null,
                            'EntryComment' => $rec['EntryComment'] ?? null,
                            'EntryCommentEn' => $rec['DocumentInformation'] ?? null,
                            'Nomination' => $rec['DocumentNomination'] ?? null,
                            'Credit' => $rec['EntryAmountCredit'] ?? null,
                            'Debit' => $rec['EntryAmountDebit'] ?? null,
                            'Amount' => $rec['EntryAmount'] ?? $rec['DocumentSourceAmount'] ?? null,
                            'AmountBase' => $rec['EntryAmountBase'] ?? null,
                            'PayerName' => $rec['DocumentPayerName'] ?? null,
                            'PayerInn' => $rec['DocumentPayerInn'] ?? null,
                            'Sender' => [
                                'Name' => $rec['SenderDetails']['Name'] ?? null,
                                'Inn' => $rec['SenderDetails']['Inn'] ?? null,
                                'AccountNumber' => $rec['SenderDetails']['AccountNumber'] ?? null,
                                'BankCode' => $rec['SenderDetails']['BankCode'] ?? null,
                                'BankName' => $rec['SenderDetails']['BankName'] ?? null,
                            ],
                            'Beneficiary' => [
                                'Name' => $rec['BeneficiaryDetails']['Name'] ?? null,
                                'Inn' => $rec['BeneficiaryDetails']['Inn'] ?? null,
                                'AccountNumber' => $rec['BeneficiaryDetails']['AccountNumber'] ?? null,
                                'BankCode' => $rec['BeneficiaryDetails']['BankCode'] ?? null,
                                'BankName' => $rec['BeneficiaryDetails']['BankName'] ?? null,
                            ],
                            'syncDate' => $rec['DocumentReceiveDate'] ?? null,
                        ];
                    }
                } else {
                    $activities = $data ?? [];
                }

                $inserted = 0;
                $skipped = 0;

                foreach ($activities as $activity) {
                    $exists = GorgiaBogTransaction::where(function ($q) use ($activity) {
                        if (!empty($activity['Id'])) $q->orWhere('bog_id', $activity['Id']);
                        if (!empty($activity['DocKey'])) $q->orWhere('doc_key', $activity['DocKey']);
                        if (!empty($activity['DocNo'])) $q->orWhere('doc_no', $activity['DocNo']);
                    })->exists();

                    if ($exists) {
                        $skipped++;
                        continue;
                    }

                    GorgiaBogTransaction::create([
                        'bog_id' => $activity['Id'] ?? null,
                        'doc_key' => $activity['DocKey'] ?? null,
                        'doc_no' => $activity['DocNo'] ?? null,
                        'transaction_date' => $activity['PostDate'] ?? null,
                        'value_date' => $activity['ValueDate'] ?? null,
                        'entry_type' => $activity['EntryType'] ?? null,
                        'entry_comment' => $activity['EntryComment'] ?? null,
                        'entry_comment_en' => $activity['EntryCommentEn'] ?? null,
                        'nomination' => $activity['Nomination'] ?? null,
                        'credit' => $activity['Credit'] ?? null,
                        'debit' => $activity['Debit'] ?? null,
                        'amount' => $activity['Amount'] ?? null,
                        'amount_base' => $activity['AmountBase'] ?? null,
                        'payer_name' => $activity['PayerName'] ?? null,
                        'payer_inn' => $activity['PayerInn'] ?? null,
                        'sender_name' => $activity['Sender']['Name'] ?? null,
                        'sender_inn' => $activity['Sender']['Inn'] ?? null,
                        'sender_account_number' => $activity['Sender']['AccountNumber'] ?? null,
                        'sender_bank_code' => $activity['Sender']['BankCode'] ?? null,
                        'sender_bank_name' => $activity['Sender']['BankName'] ?? null,
                        'beneficiary_name' => $activity['Beneficiary']['Name'] ?? null,
                        'beneficiary_inn' => $activity['Beneficiary']['Inn'] ?? null,
                        'beneficiary_account_number' => $activity['Beneficiary']['AccountNumber'] ?? null,
                        'beneficiary_bank_code' => $activity['Beneficiary']['BankCode'] ?? null,
                        'beneficiary_bank_name' => $activity['Beneficiary']['BankName'] ?? null,
                        'raw' => $activity,
                    ]);
                    $inserted++;
                }

                if ($inserted > 0) {
                    $lastOkMonth = $monthStart;
                }

                $results[] = [
                    'account' => $account,
                    'month' => $monthStart,
                    'inserted' => $inserted,
                    'skipped' => $skipped,
                    'total' => count($activities),
                    'status' => 'ok',
                ];

                $totalInserted += $inserted;
                $totalSkipped += $skipped;
                $current->addMonth();
            }

            $allResults[] = [
                'account' => $account,
                'results' => $results,
                'totalInserted' => $totalInserted,
                'totalSkipped' => $totalSkipped,
            ];

            $grandTotalInserted += $totalInserted;
            $grandTotalSkipped += $totalSkipped;
            $lastSuccessMonth[$account] = $lastOkMonth;
        }

        return response()->json([
            'message' => 'Migration completed',
            'accounts' => $accounts,
            'results' => $allResults,
            'grandTotalInserted' => $grandTotalInserted,
            'grandTotalSkipped' => $grandTotalSkipped,
            'lastSuccessMonth' => $lastSuccessMonth,
        ]);
    }

    public function statementByMonthJob(
        $currency,
        $startDate,
        $endDate,
        $includeToday = false,
        $orderByDate = false,
        Request $request,
        BOGService $bog
    ) {
        $includeToday = filter_var($includeToday, FILTER_VALIDATE_BOOLEAN);
        $orderByDate = filter_var($orderByDate, FILTER_VALIDATE_BOOLEAN);

        $accounts = [
            env('BOG_ACCOUNT'),
            env('BOG_ACCOUNT_2')
        ];

        $start = Carbon::parse($startDate)->startOfMonth();
        $end = Carbon::parse($endDate)->endOfMonth();

        $allResults = collect();
        $log = [];

        foreach ($accounts as $acc) {
            $current = $start->copy();
            while ($current->lessThanOrEqualTo($end)) {
                $monthStart = $current->copy()->startOfMonth()->format('Y-m-d');
                $monthEnd = $current->copy()->endOfMonth()->format('Y-m-d');
                try {
                    $data = $bog->getStatement($acc, $currency, $monthStart, $monthEnd, $includeToday, $orderByDate);
                } catch (\Exception $e) {
                    Log::error('BOG API error', ['account' => $acc, 'month' => $monthStart, 'message' => $e->getMessage()]);
                    $log[] = [
                        'account' => $acc,
                        'month' => $monthStart,
                        'status' => 'error',
                        'message' => $e->getMessage()
                    ];
                    $current->addMonth();
                    continue;
                }

                $activities = [];
                if (isset($data['activities']) && is_array($data['activities'])) {
                    $activities = $data['activities'];
                } elseif (isset($data['Records']) && is_array($data['Records'])) {
                    foreach ($data['Records'] as $rec) {
                        $activities[] = [
                            'Id' => $rec['EntryId'] ?? null,
                            'DocKey' => $rec['DocumentKey'] ?? null,
                            'DocNo' => $rec['EntryDocumentNumber'] ?? null,
                            'PostDate' => $rec['EntryDate'] ?? null,
                            'ValueDate' => $rec['DocumentValueDate'] ?? null,
                            'EntryType' => $rec['EntryDepartment'] ?? null,
                            'EntryComment' => $rec['EntryComment'] ?? null,
                            'EntryCommentEn' => $rec['DocumentInformation'] ?? null,
                            'Nomination' => $rec['DocumentNomination'] ?? null,
                            'Credit' => $rec['EntryAmountCredit'] ?? null,
                            'Debit' => $rec['EntryAmountDebit'] ?? null,
                            'Amount' => $rec['EntryAmount'] ?? $rec['DocumentSourceAmount'] ?? null,
                            'AmountBase' => $rec['EntryAmountBase'] ?? null,
                            'PayerName' => $rec['DocumentPayerName'] ?? null,
                            'PayerInn' => $rec['DocumentPayerInn'] ?? null,
                            'Sender' => [
                                'Name' => $rec['SenderDetails']['Name'] ?? null,
                                'Inn' => $rec['SenderDetails']['Inn'] ?? null,
                                'AccountNumber' => $rec['SenderDetails']['AccountNumber'] ?? null,
                                'BankCode' => $rec['SenderDetails']['BankCode'] ?? null,
                                'BankName' => $rec['SenderDetails']['BankName'] ?? null,
                            ],
                            'Beneficiary' => [
                                'Name' => $rec['BeneficiaryDetails']['Name'] ?? null,
                                'Inn' => $rec['BeneficiaryDetails']['Inn'] ?? null,
                                'AccountNumber' => $rec['BeneficiaryDetails']['AccountNumber'] ?? null,
                                'BankCode' => $rec['BeneficiaryDetails']['BankCode'] ?? null,
                                'BankName' => $rec['BeneficiaryDetails']['BankName'] ?? null,
                            ],
                            'syncDate' => $rec['DocumentReceiveDate'] ?? null,
                        ];
                    }
                } else {
                    $activities = $data ?? [];
                }

                $bog->saveStatementToDb($activities);

                $statements = GorgiaBogTransaction::whereDate('transaction_date', '>=', $monthStart)
                    ->whereDate('transaction_date', '<=', $monthEnd)
                    ->where(function ($q) use ($acc) {
                        $q->where('sender_account_number', $acc)
                            ->orWhere('beneficiary_account_number', $acc);
                    })
                    ->orderBy('transaction_date', $orderByDate ? 'asc' : 'desc')
                    ->get();

                $result = $statements->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'contragent' => $item->sender_name ?: ($item->beneficiary_name ?: '-'),
                        'bank' => $item->sender_bank_name ?: ($item->beneficiary_bank_name ?: '-'),
                        'amount' => $item->amount ?? 0,
                        'transferDate' => $item->transaction_date ? $item->transaction_date->format('Y-m-d') : '-',
                        'purpose' => $item->entry_comment ?? '-',
                        'syncDate' => $item->created_at ? $item->created_at->format('Y-m-d H:i:s') : '-',
                    ];
                });

                $allResults = $allResults->merge($result);

                $log[] = [
                    'account' => $acc,
                    'month' => $monthStart,
                    'inserted' => $result->count(),
                    'status' => 'ok'
                ];

                $current->addMonth();
            }
        }

        return response()->json([
            'message' => 'Statements by month completed',
            'log' => $log,
            'data' => $allResults->values()
        ]);
    }
}
