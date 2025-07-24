<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Repositories\BankOfGeorgia\BOGService;
use App\Models\Transaction;
use App\Models\Bank;
use App\Models\Contragent;
use Log;
use Carbon\Carbon;

class BOGStatementController extends Controller
{
    public function todayActivities(Request $request)
    {
        $user = $request->user();
        $bank = $user && $user->bank === 'anta' ? 'anta' : 'gorgia';
        $bog = new \App\Repositories\BankOfGeorgia\BOGService($bank);

        $account = $request->input('account', env(strtoupper($bank) . '_BOG_ACCOUNT'));
        $currency = $request->input('currency', env(strtoupper($bank) . '_BOG_CURRENCY', 'GEL'));

        $data = $bog->getTodayActivities($account, $currency);

        $activities = $data['activities'] ?? (is_array($data) ? $data : []);

        return response()->json(['data' => $activities]);
    }

    public function statement(
        $accountNumber,
        $currency,
        $startDate,
        $endDate,
        $includeToday = false,
        $orderByDate = false,
        Request $request
    ) {
        $user = $request->user();
        $bank = $user && $user->bank === 'anta' ? 'anta' : 'gorgia';
        $bog = new BOGService($bank);

        $includeToday = filter_var($includeToday, FILTER_VALIDATE_BOOLEAN);
        $orderByDate = filter_var($orderByDate, FILTER_VALIDATE_BOOLEAN);

        $accounts = [];
        if ($accountNumber === 'all') {
            $accounts = [
                env('GORGIA_BOG_ACCOUNT'),
                env('GORGIA_BOG_ACCOUNT_2')
            ];
        } else {
            $accounts = [$accountNumber];
        }

        $allResults = collect();
        $bogBankId = Bank::where('bank_code', 'BOG')->first()->id ?? null;

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

            $statements = Transaction::whereDate('transaction_date', '>=', $startDate)
                ->whereDate('transaction_date', '<=', $endDate)
                ->where('bank_type', $bogBankId)
                ->orderBy('transaction_date', $orderByDate ? 'asc' : 'desc')
                ->get();

            $result = $statements->map(function ($item) {
                return [
                    'id' => $item->id,
                    'contragent' => $item->sender_name ?: '-',
                    'bank' => 'Bank of Georgia',
                    'amount' => $item->amount ?? 0,
                    'transferDate' => $item->transaction_date ? $item->transaction_date->format('Y-m-d') : '-',
                    'purpose' => $item->description ?? '-',
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

        $currency = $request->input('currency', env('GORGIA_BOG_CURRENCY', 'GEL'));
        $startDateParam = $request->input('start', '2019-01-01');
        $start = Carbon::parse($startDateParam)->startOfMonth();
        $end = Carbon::now()->endOfMonth();

        $accounts = $request->has('account')
            ? [$request->input('account')]
            : [env('GORGIA_BOG_ACCOUNT'), env('GORGIA_BOG_ACCOUNT_2')];

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
                    $exists = Transaction::where(function ($q) use ($activity) {
                        if (!empty($activity['Id']))
                            $q->orWhere('bank_statement_id', $activity['Id']);
                        if (!empty($activity['DocKey']))
                            $q->orWhere('bank_statement_id', $activity['DocKey']);
                        if (!empty($activity['DocNo']))
                            $q->orWhere('bank_statement_id', $activity['DocNo']);
                    })->exists();

                    if ($exists) {
                        $skipped++;
                        continue;
                    }

                    Transaction::create([
                        'contragent_id' => $activity['Sender']['Inn'] ?? null,
                        'bank_type' => $bogBankId,
                        'bank_id' => $bankId,
                        'bank_statement_id' => $bankStatementId,
                        'amount' => $activity['Amount'] ?? null,
                        'transaction_date' => $activity['PostDate'] ?? null,
                        'reflection_date' => $activity['ValueDate'] ?? null,
                        'sender_name' => $activity['Sender']['Name'] ?? null,
                        'description' => $activity['EntryComment'] ?? $activity['EntryCommentEn'] ?? null,
                        'status_code' => $activity['EntryType'] ?? null,
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
            env('GORGIA_BOG_ACCOUNT'),
            env('GORGIA_BOG_ACCOUNT_2')
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

                $statements = Transaction::whereDate('transaction_date', '>=', $monthStart)
                    ->whereDate('transaction_date', '<=', $monthEnd)
                    ->where('bank_type', $bogBankId)
                    ->orderBy('transaction_date', $orderByDate ? 'asc' : 'desc')
                    ->get();

                $result = $statements->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'contragent' => $item->sender_name ?: '-',
                        'bank' => 'Bank of Georgia',
                        'amount' => $item->amount ?? 0,
                        'transferDate' => $item->transaction_date ? $item->transaction_date->format('Y-m-d') : '-',
                        'purpose' => $item->description ?? '-',
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
