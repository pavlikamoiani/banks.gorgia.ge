<?php

namespace App\Jobs\Gorgia;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Carbon\Carbon;
use App\Repositories\TBCBank\TransactionRepository;
use App\Models\Transaction;
use App\Models\Contragent;

class GorgiaTbcJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle()
    {
        $bankNameId = 1;
        $repository = new TransactionRepository($bankNameId);
        $from = Carbon::today();
        $to = Carbon::today()->endOfDay();
        $repository->setPeriod($from, $to);

        $response = $repository->getTransactionsResponse(0, 700);
        $responseObj = $repository->responseAsObject($response);

        $movements = $responseObj->Body->GetAccountMovementsResponseIo->accountMovement ?? [];
        if (!is_array($movements) && !is_null($movements)) {
            $movements = [$movements];
        }

        foreach ($movements as $transactionData) {
            $transactionDate = date('Y-m-d H:i:s', strtotime($transactionData->documentDate));
            $reflectionDate = date('Y-m-d H:i:s', strtotime($transactionData->valueDate));
            $exists = Transaction::where([
                ['bank_statement_id', $transactionData->movementId],
                ['bank_id', 1],
                ['bank_type', 1],
                ['amount', $transactionData->amount->amount],
                ['transaction_date', $transactionDate],
                ['reflection_date', $reflectionDate],
                ['status_code', $transactionData->statusCode],
                ['description', $transactionData->description],
            ])->exists();

            if ($exists) {
                continue;
            }
            if (
                isset($transactionData->partnerTaxCode, $transactionData->partnerName) &&
                trim($transactionData->partnerTaxCode) !== '' &&
                trim($transactionData->partnerName) !== ''
            ) {
                Contragent::findOrCreateByInnAndName(
                    trim($transactionData->partnerTaxCode),
                    trim($transactionData->partnerName),
                    1
                );
            }
            $transaction = new Transaction();
            $transaction->contragent_id = $transactionData->partnerTaxCode ?? $transactionData->taxpayerCode ?? null;
            $transaction->bank_id = 1;
            $transaction->bank_type = 1;
            $transaction->bank_statement_id = $transactionData->movementId;
            $transaction->amount = $transactionData->amount->amount;
            $transaction->transaction_date = $transactionDate;
            $transaction->reflection_date = $reflectionDate;
            $transaction->status_code = $transactionData->statusCode;
            $transaction->description = $transactionData->description;
            $transaction->sender_name = $transactionData->partnerName ?? null;
            $transaction->save();
        }
    }
}
