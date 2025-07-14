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
            $tbcRows[] = [
                'id' => 'tbc-' . ($item['id'] ?? uniqid()),
                'bankType' => 'TBC',
                'contragent' => $item['Sender']['Name'] ?? '-',
                'bank' => $item['Sender']['BankName'] ?? 'TBC Bank',
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
                'bank' => $item['Sender']['BankName'] ?? '-',
                'amount' => $item['Amount'] ?? 0,
                'transferDate' => isset($item['PostDate']) ? substr($item['PostDate'], 0, 10) : '-',
                'purpose' => $item['EntryComment'] ?? '-',
                'syncDate' => $item['PostDate'] ?? '-',
            ];
        }

        $all = array_merge($tbcRows, $bogRows);
        usort($all, function ($a, $b) {
            return strcmp(($b['transferDate'] ?? ''), ($a['transferDate'] ?? ''));
        });

        return response()->json(['data' => $all]);
    }
}
