<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\TBC\TBCService;

class TBCStatementController extends Controller
{
    public function statement(Request $request)
    {
        $from = $request->query('startDate', now()->subMonth()->format('Y-m-d\TH:i:s'));
        $to = $request->query('endDate', now()->format('Y-m-d\TH:i:s'));

        try {
            $service = new TBCService();
            $movements = $service->getAllAccountMovements($from, $to);

            // Привести к единому формату для фронта
            $data = array_map(function ($item) {
                return [
                    'contragent' => $item['ns2:partnerName'] ?? '-',
                    'bank' => $item['ns2:partnerBank'] ?? '-',
                    'amount' => ($item['ns2:amount']['ns2:amount'] ?? 0) . ' ₾',
                    'transferDate' => isset($item['ns2:transactionDate']) ? substr($item['ns2:transactionDate'], 0, 10) : (isset($item['ns2:valueDate']) ? substr($item['ns2:valueDate'], 0, 10) : '-'),
                    'purpose' => $item['ns2:description'] ?? '-',
                    'syncDate' => now()->format('Y-m-d H:i:s'),
                ];
            }, $movements);

            return response()->json($data);
        } catch (\Throwable $e) {
            \Log::error('TBCStatementController error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['error' => 'TBC statement fetch error', 'details' => $e->getMessage()], 500);
        }
    }
}
