<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Controllers\TBCStatementController;
use App\Http\Controllers\BOGStatementController;
use App\Repositories\BankOfGeorgia\BOGService;
use Carbon\Carbon;

class LiveStatementController extends Controller
{
    public function todayActivities(Request $request)
    {
        $tbcController = new TBCStatementController();
        $bogController = new BOGStatementController();
        $bogService = new BOGService();

        $tbcResponse = $tbcController->todayActivities($request);
        $tbcData = $tbcResponse->getData(true);
        $tbcRows = [];
        foreach (($tbcData['activities'] ?? []) as $item) {
            $bankName = $item['Sender']['BankName'] ?? 'TBC Bank';

            if ($bankName === 'TBC Bank') {
                $bankName = 'სს "თიბისი ბანკი"';
            }
            $tbcRows[] = [
                'id' => 'tbc-' . ($item['id'] ?? uniqid()),
                'bankType' => 'TBC',
                'contragent' => $item['Sender']['Name'] ?? '-',
                'bank' => $bankName,
                'amount' => $item['Amount'] ?? 0,
                'transferDate' => isset($item['PostDate']) ? substr($item['PostDate'], 0, 10) : '-',
                'purpose' => $item['EntryComment'] ?? '-',
                'syncDate' => $item['PostDate'] ?? '-',
            ];
        }

        $account = $request->input('account', env('BOG_ACCOUNT'));
        $currency = $request->input('currency', env('BOG_CURRENCY', 'GEL'));
        $bogData = $bogService->getTodayActivities($account, $currency);
        $bogRows = [];
        foreach (($bogData['activities'] ?? (is_array($bogData) ? $bogData : [])) as $item) {
            $bogRows[] = [
                'id' => 'bog-' . ($item['Id'] ?? uniqid()),
                'bankType' => 'BOG',
                'contragent' => $item['Sender']['Name'] ?? '-',
                'bank' => $item['Sender']['BankName'] ?? 'სს "საქართველოს ბანკი"',
                'amount' => $item['Amount'] ?? 0,
                'transferDate' => isset($item['PostDate']) ? substr($item['PostDate'], 0, 10) : '-',
                'purpose' => $item['EntryComment'] ?? '-',
                'syncDate' => $item['PostDate'] ?? '-',
            ];
        }

        $all = array_merge($tbcRows, $bogRows);

        // Фильтрация по параметрам запроса
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
