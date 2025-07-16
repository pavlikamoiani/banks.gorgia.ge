<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Controllers\TBCStatementController;
use App\Repositories\BankOfGeorgia\BOGService;
use App\Models\Transaction;
use App\Models\Bank;
use App\Models\Contragent;

class LiveStatementController extends Controller
{
    public function todayActivities(Request $request)
    {
        $tbcController = new TBCStatementController();
        $bogService = new BOGService();

        $tbcResponse = $tbcController->todayActivities($request);
        $tbcData = $tbcResponse->getData(true);
        $tbcRows = [];
        foreach (($tbcData['activities'] ?? []) as $item) {
            $bankName = $item['Sender']['BankName'] ?? 'TBC Bank';

            if ($bankName === 'TBC Bank') {
                $bankName = 'TBC Bank';
            }

            $contragent = $item['Sender']['Name'] ?? '-';
            if (strpos($contragent, 'Wallet/domestic/') === 0) {
                $contragent = substr($contragent, strlen('Wallet/domestic/'));
            }
            $contragentInn = $item['Sender']['Inn'] ?? null;
            // Новый блок: добавлять только если оба значения валидны
            if ($contragent !== '-' && !empty($contragent) && !empty($contragentInn)) {
                $existingContragent = Contragent::where('identification_code', $contragentInn)->first();
                if (!$existingContragent) {
                    $contragentData = [
                        'name' => $contragent,
                        'hidden_for_roles' => [],
                        'identification_code' => $contragentInn
                    ];
                    Contragent::create($contragentData);
                }
            }

            $syncDate = $item['PostDate'] ?? '-';
            if ($syncDate !== '-' && strlen($syncDate) >= 10) {
                $syncDate = substr($syncDate, 0, 10);
            }

            $tbcRows[] = [
                'id' => 'tbc-' . ($item['id'] ?? uniqid()),
                'bankType' => 'TBC',
                'contragent' => $contragent,
                'contragentInn' => $contragentInn,
                'bank' => $bankName,
                'amount' => $item['Amount'] ?? 0,
                'transferDate' => isset($item['PostDate']) ? substr($item['PostDate'], 0, 10) : '-',
                'purpose' => $item['EntryComment'] ?? '-',
                'syncDate' => $syncDate,
            ];
        }

        $account = $request->input('account', env('BOG_ACCOUNT'));
        $currency = $request->input('currency', env('BOG_CURRENCY', 'GEL'));
        $bogData = $bogService->getTodayActivities($account, $currency);
        $bogRows = [];
        $bogBankId = Bank::where('bank_code', 'BOG')->first()->id ?? 2;
        foreach (($bogData['activities'] ?? (is_array($bogData) ? $bogData : [])) as $item) {
            $syncDate = $item['PostDate'] ?? '-';
            if ($syncDate !== '-' && strlen($syncDate) >= 10) {
                $syncDate = substr($syncDate, 0, 10);
            }

            $bogRows[] = [
                'id' => 'bog-' . ($item['Id'] ?? uniqid()),
                'bankType' => 'BOG',
                'contragent' => $item['Sender']['Name'] ?? '-',
                'contragentInn' => $item['Sender']['Inn'] ?? null,
                'bank' => $item['Sender']['BankName'] ?? 'BOG Bank',
                'amount' => $item['Amount'] ?? 0,
                'transferDate' => isset($item['PostDate']) ? substr($item['PostDate'], 0, 10) : '-',
                'purpose' => $item['EntryComment'] ?? '-',
                'syncDate' => $syncDate,
            ];

            $bankStatementId = $item['Id'] ?? $item['DocKey'] ?? null;
            if (!$bankStatementId) continue;

            $contragentName = $item['Sender']['Name'] ?? null;
            $contragentInn = $item['Sender']['Inn'] ?? null;
            // Новый блок: добавлять только если оба значения валидны
            if (!empty($contragentName) && $contragentName !== '-' && !empty($contragentInn)) {
                $existingContragent = Contragent::where('identification_code', $contragentInn)->first();
                if (!$existingContragent) {
                    $contragentData = [
                        'name' => $contragentName,
                        'hidden_for_roles' => [],
                        'identification_code' => $contragentInn
                    ];
                    Contragent::create($contragentData);
                }
            }

            $exists = Transaction::where('bank_statement_id', $bankStatementId)
                ->where('bank_id', $bogBankId)
                ->exists();
            if (!$exists) {
                Transaction::create([
                    'contragent_id' => $item['Sender']['Inn'] ?? null,
                    'bank_id' => $bogBankId,
                    'bank_statement_id' => $bankStatementId,
                    'amount' => $item['Amount'] ?? null,
                    'transaction_date' => $item['PostDate'] ?? null,
                    'reflection_date' => $item['ValueDate'] ?? null,
                    'sender_name' => $item['Sender']['Name'] ?? null,
                    'description' => $item['EntryComment'] ?? $item['EntryCommentEn'] ?? null,
                    'status_code' => $item['EntryType'] ?? null,
                ]);
            }
        }

        $all = array_merge($tbcRows, $bogRows);

        $contragent = $request->input('contragent');
        $bank = $request->input('bank');
        $amount = $request->input('amount');
        $transferDate = $request->input('transferDate');
        $purpose = $request->input('purpose');
        $startDate = $request->input('startDate');
        $endDate = $request->input('endDate');

        $filtered = array_filter($all, function ($row) use ($contragent, $bank, $amount, $transferDate, $purpose, $startDate, $endDate) {
            if ($contragent && stripos($row['contragent'], $contragent) === false) return false;
            if ($bank && $row['bank'] !== $bank) return false;
            if ($amount && stripos((string)$row['amount'], (string)$amount) === false) return false;
            if ($transferDate && strpos($row['transferDate'], $transferDate) === false) return false;
            if ($purpose && stripos($row['purpose'], $purpose) === false) return false;
            if ($startDate && $row['transferDate'] !== '-' && $row['transferDate'] < $startDate) return false;
            if ($endDate && $row['transferDate'] !== '-' && $row['transferDate'] > $endDate) return false;
            return true;
        });

        usort($filtered, function ($a, $b) {
            return strcmp(($b['transferDate'] ?? ''), ($a['transferDate'] ?? ''));
        });

        return response()->json(['data' => array_values($filtered)]);
    }
}
