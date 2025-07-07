<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\BOG\BOGService;
use App\Models\GorgiaBogTransaction;
use Log;

class BOGStatementController extends Controller
{
    public function todayActivities(Request $request, BOGService $bog)
    {
        $account = $request->input('account', env('BOG_ACCOUNT'));
        $currency = $request->input('currency', env('BOG_CURRENCY', 'GEL'));

        $data = $bog->getTodayActivities($account, $currency);

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

        try {
            $data = $bog->getStatement($accountNumber, $currency, $startDate, $endDate, $includeToday, $orderByDate);
        } catch (\Exception $e) {
            Log::error('BOG API error', ['message' => $e->getMessage()]);
            return response()->json(['error' => 'BOG API unavailable', 'details' => $e->getMessage()], 502);
        }

        // Универсальный парсер для разных структур ответа
        $activities = [];
        if (isset($data['activities']) && is_array($data['activities'])) {
            $activities = $data['activities'];
        } elseif (isset($data['Records']) && is_array($data['Records'])) {
            // Преобразуем структуру Records к ожидаемой структуре для сохранения
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

        Log::info('BOG activities', [
            'activities' => $activities,
            'count' => count($activities)
        ]);

        $bog->saveStatementToDb($activities);

        $statements = GorgiaBogTransaction::orderBy('transaction_date', $orderByDate ? 'asc' : 'desc')->get();

        Log::info('BogStatement count in DB', ['count' => $statements->count()]);

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

        Log::info('BOG statements for frontend', ['result' => $result]);

        return response()->json(['data' => $result]);
    }
}
