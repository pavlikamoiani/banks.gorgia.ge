<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Carbon\Carbon;
use App\Repositories\TBCBank\TransactionRepository;
use App\Models\Transaction;
use App\Models\Contragent;

class GorgiaTbcCommand extends Command
{
    protected $signature = 'gorgia:tbc';
    protected $description = 'Fetch and save Gorgia TBC transactions';

    public function handle()
    {
        $bankNameId = 1;
        $repository = new TransactionRepository($bankNameId);
        $from = Carbon::now()->startOfDay();
        $to = Carbon::now()->endOfDay();
        $repository->setPeriod($from, $to);

        $page = 0;
        $limit = 700;
        do {
            $response = $repository->getTransactionsResponse($page, $limit);
            $responseObj = $repository->responseAsObject($response);

            $movements = $responseObj->Body->GetAccountMovementsResponseIo->accountMovement ?? [];
            if (!is_array($movements) && !is_null($movements)) {
                $movements = [$movements];
            }

            $count = count($movements);
            if ($count === 0) {
                break;
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
                    trim($transactionData->partnerName) !== '' &&
                    (strpos($transactionData->description, 'თვის ხელფასი') === false)
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
                $transaction->created_at = date('Y-m-d H:i:s');
                $transaction->save();
            }

            $page++;
        } while ($count === $limit);

        \Log::info('Gorgia TBC transactions processed.');
    }
}
