<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\Request;
use App\Repositories\TBCBank\TransactionRepository;

class TBCStatementController extends Controller
{
    public function todayActivities(Request $request)
    {
        try {
            $bank = $request->input('bank', 'gorgia');
            $bankNameId = $bank === 'anta' ? 2 : 1;
            $repository = new TransactionRepository($bankNameId);
            $from = Carbon::today();
            $to = Carbon::today()->endOfDay();
            $repository->setPeriod($from, $to);

            $response = $repository->getTransactionsResponse(0, 700);
            $responseObj = $repository->responseAsObject($response);

            // Check for error in response
            if (!isset($responseObj->Body) || !isset($responseObj->Body->GetAccountMovementsResponseIo)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'TBC API response invalid or credentials incorrect',
                    'data' => []
                ], 500);
            }

            $movements = $responseObj->Body->GetAccountMovementsResponseIo->accountMovement ?? [];
            if (!is_array($movements) && !is_null($movements)) {
                $movements = [$movements];
            }

            if (empty($movements)) {
                return response()->json([
                    'status' => 'success',
                    'message' => 'No transactions found for given credentials or period',
                    'data' => []
                ]);
            }

            $mapped = collect($movements)->map(function ($item, $idx) {
                $partnerName = $item->partnerName ?? 'ტერმინალით გადახდა';

                if (strpos($partnerName, 'Wallet/domestic/') === 0) {
                    $partnerName = substr($partnerName, strlen('Wallet/domestic/'));
                } elseif (strpos($partnerName, 'TBCBank_ის') === 0) {
                    $partnerName = substr($partnerName, strlen('TBCBank_ის'));
                } elseif (strpos($partnerName, 'ECOM/POS') === 0) {
                    $partnerName = substr($partnerName, strlen('ECOM/POS'));
                }
                return [
                    'Id' => $item->movementId ?? ($item->documentNumber ?? $idx + 1),
                    'Sender' => [
                        'Name' => $partnerName,
                        'BankName' => 'სს "თბს ბანკი"',
                    ],
                    'Amount' => isset($item->amount->amount) ? $item->amount->amount : 0,
                    'PostDate' => isset($item->documentDate) ? substr($item->documentDate, 0, 10) : '-',
                    'EntryComment' => $item->description ?? '-',
                    'EntryCommentEn' => $item->description ?? '-',
                    'syncDate' => isset($item->valueDate) ? substr($item->valueDate, 0, 19) : '-',
                ];
            })->values();

            return response()->json([
                'status' => 'success',
                'data' => $mapped
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function statement(Request $request)
    {
        return response()->json(['message' => 'Not implemented yet']);
    }

    public function syncTodayTransactions()
    {
        try {
            $repository = new TransactionRepository();
            $repository->transactionsByTimestamp(Carbon::today());
            return response()->json(['status' => 'success', 'message' => 'Transactions synced successfully']);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }
}
