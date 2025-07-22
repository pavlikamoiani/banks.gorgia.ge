<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Controllers\TBCStatementController;
use App\Repositories\BankOfGeorgia\BOGService;
use App\Models\Transaction;
use App\Models\Bank;
use App\Models\Contragent;
use App\Models\BankName;

class LiveStatementController extends Controller
{
    public function todayActivities(Request $request)
    {
        $bank = $request->input('bank');
        if (!$bank) {
            $user = $request->user();
            $bank = $user && $user->bank === 'anta' ? 'anta' : 'gorgia';
        }
        $bogService = new BOGService($bank);

        $tbcController = new TBCStatementController();

        $tbcResponse = $tbcController->todayActivities($request);
        $tbcData = $tbcResponse->getData(true);
        $tbcRows = [];
        foreach (($tbcData['activities'] ?? []) as $item) {
            $bankName = $item['Sender']['BankName'] ?? 'TBC Bank';

            if ($bankName === 'TBC Bank') {
                $bankName = 'TBC Bank';
            }

            $contragent = $item['Sender']['Name'] ?? '-';
            if ($contragent === '-') {
                $contragent = 'ტერმინალით გადახდა';
            }
            if (strpos($contragent, 'Wallet/domestic/') === 0) {
                $contragent = substr($contragent, strlen('Wallet/domestic/'));
            }
            $contragentInn = $item['Sender']['Inn'] ?? null;
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

        $account = $request->input('account', env(strtoupper($bank) . '_BOG_ACCOUNT'));
        $currency = $request->input('currency', env(strtoupper($bank) . '_BOG_CURRENCY', 'GEL'));
        $bogData = $bogService->getTodayActivities($account, $currency);
        $bogRows = [];
        $bogBankId = Bank::where('bank_code', 'BOG')->first()->id ?? 2;
        foreach (($bogData['activities'] ?? (is_array($bogData) ? $bogData : [])) as $item) {
            $syncDate = $item['PostDate'] ?? '-';
            if ($syncDate !== '-' && strlen($syncDate) >= 10) {
                $syncDate = substr($syncDate, 0, 10);
            }

            $contragent = $item['Sender']['Name'] ?? '-';
            if ($contragent === '-') {
                $contragent = 'ტერმინალით გადახდა';
            }

            $bankName = 'Bank of Georgia';
            $bogRows[] = [
                'id' => 'bog-' . ($item['Id'] ?? uniqid()),
                'bankType' => 'BOG',
                'contragent' => $contragent,
                'contragentInn' => $item['Sender']['Inn'] ?? null,
                'bank' => $bankName,
                'amount' => $item['Amount'] ?? 0,
                'transferDate' => isset($item['PostDate']) ? substr($item['PostDate'], 0, 10) : '-',
                'purpose' => $item['EntryComment'] ?? '-',
                'syncDate' => $syncDate,
            ];

            $bankStatementId = $item['Id'] ?? $item['DocKey'] ?? null;
            if (!$bankStatementId)
                continue;

            $contragentName = $item['Sender']['Name'] ?? null;
            $contragentInn = $item['Sender']['Inn'] ?? null;
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
                    'bank_name_id' => BankName::where('name', ucfirst($bank))->first()?->id,
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
            if ($contragent && stripos($row['contragent'], $contragent) === false)
                return false;
            if ($bank && $row['bank'] !== $bank)
                return false;
            if ($amount && stripos((string) $row['amount'], (string) $amount) === false)
                return false;
            if ($transferDate && strpos($row['transferDate'], $transferDate) === false)
                return false;
            if ($purpose && stripos($row['purpose'], $purpose) === false)
                return false;
            if ($startDate && $row['transferDate'] !== '-' && $row['transferDate'] < $startDate)
                return false;
            if ($endDate && $row['transferDate'] !== '-' && $row['transferDate'] > $endDate)
                return false;
            return true;
        });

        $user = $request->user();
        if ($user && $user->role !== 'super_admin') {
            $hiddenContragents = Contragent::whereJsonContains('hidden_for_roles', $user->role)
                ->pluck('identification_code')->toArray();
            $filtered = array_filter($filtered, function ($row) use ($hiddenContragents) {
                return !in_array($row['contragentInn'], $hiddenContragents);
            });
        }

        usort($filtered, function ($a, $b) {
            return strcmp(($b['transferDate'] ?? ''), ($a['transferDate'] ?? ''));
        });

        return response()->json(['data' => array_values($filtered)]);
    }
}
