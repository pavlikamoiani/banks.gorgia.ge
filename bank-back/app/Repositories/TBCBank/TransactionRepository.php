<?php

namespace App\Repositories\TBCBank;

use App\Models\Bank;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TransactionRepository extends BaseRepository
{
    private $lastTimestamp;
    private $soapActionHeader;

    /**
     * StatementRepository constructor.
     */
    public function __construct()
    {
        parent::__construct();

        $this->soapActionHeader = 'SoapAction: "http://www.mygemini.com/schemas/mygemini/GetAccountMovements"';
    }

    public function transactionsByTimestamp($timestamp)
    {
        $minimumTimestamp = \DateTime::createFromFormat('Y-m-d H:i:s', '2019-05-06 00:00:00');
        if ($timestamp < $minimumTimestamp) {
            $timestamp = $minimumTimestamp;
        }

        $this->lastTimestamp = $timestamp->format('Y-m-d\\TH:i:s');

        $this->saveNewTransactions();
    }

    private function saveNewTransactions()
    {
        $page = 0;
        $limit = 700;

        $gorgiaTaxCode = '245621288';


        $response = $this->getTransactionsResponse($page, $limit);
        \Log::debug('TBC SOAP RAW RESPONSE: ' . $response);
        $responseAsObject = $this->responseAsObject($response);
        if (!isset($responseAsObject->Body)) {
            \Log::error('TBC SOAP: Body property missing in response', ['response' => $responseAsObject]);
            throw new \Exception('TBC SOAP: Body property missing in response. Check logs for details.');
        }
        $total = $responseAsObject->Body->GetAccountMovementsResponseIo->result->totalCount;

        while ($total >= ($page * $limit)) {
            $response = $this->getTransactionsResponse($page, $limit);
            \Log::debug('TBC SOAP RAW RESPONSE (page loop): ' . $response);
            $responseAsObject = $this->responseAsObject($response);
            if (!isset($responseAsObject->Body)) {
                \Log::error('TBC SOAP: Body property missing in response (page loop)', ['response' => $responseAsObject]);
                throw new \Exception('TBC SOAP: Body property missing in response (page loop). Check logs for details.');
            }
            try {
                foreach ($responseAsObject->Body->GetAccountMovementsResponseIo->accountMovement as $transaction) {

                    $taxPayerCheck = property_exists($transaction, 'taxpayerCode')
                        && !is_object($transaction->taxpayerCode)
                        && ($transaction->taxpayerCode != $gorgiaTaxCode || $transaction->operationCode == "TBCPA");

                    $partnerTaxCheck = property_exists($transaction, 'partnerTaxCode')
                        && !is_object($transaction->partnerTaxCode)
                        && ($transaction->partnerTaxCode != $gorgiaTaxCode || $transaction->operationCode == "TBCPA");

                    $posCheck = mb_strpos('ინკასირებული', $transaction->description) === false
                        && mb_strpos('ინკასაცია', $transaction->description) === false;

                    if ($taxPayerCheck && $partnerTaxCheck && $posCheck) {
                        try {
                            if (property_exists($transaction, 'movementId') && !is_object($transaction->movementId) && Transaction::where('bank_statement_id', $transaction->movementId)->count() == 0)
                                $this->saveInLocalDB($transaction);
                        } catch (\Exception $e) {
                            Log::error($e->getMessage());
                            Log::debug(json_encode($transaction, JSON_UNESCAPED_UNICODE));
                        }
                    }
                }
            } catch (Exeption $e) {
            }
            $page++;
        }
    }

    /**
     * @param $transactionData
     * @throws \Exception
     */
    private function saveInLocalDB($transactionData)
    {
        $transactionDate = date('Y-m-d H:i:s', strtotime($transactionData->documentDate));
        $reflectionDate = date('Y-m-d H:i:s', strtotime($transactionData->valueDate));
        $bank = \App\Models\Bank::where('bank_code', 'TBC')->first();

        $exists = Transaction::where([
            ['bank_statement_id', $transactionData->movementId],
            ['contragent_id', $transactionData->externalPaymentId ?? null],
            ['bank_id', $bank ? $bank->id : null],
            ['amount', $transactionData->amount->amount],
            ['transaction_date', $transactionDate],
            ['reflection_date', $reflectionDate],
            ['status_code', $transactionData->statusCode],
            ['description', $transactionData->description],
        ])->exists();

        if ($exists) {
            // Skip if all values are the same
            return;
        }

        $transaction = new Transaction();
        $transaction->contragent_id = $transactionData->externalPaymentId ?? null;
        $bank = \App\Models\Bank::where('bank_code', 'TBC')->first();
        $transaction->bank_id = $bank ? $bank->id : null;
        $transaction->bank_statement_id = $transactionData->movementId;
        $transaction->amount = $transactionData->amount->amount;
        $transaction->transaction_date = date('Y-m-d H:i:s', strtotime($transactionData->documentDate));
        $transaction->reflection_date = date('Y-m-d H:i:s', strtotime($transactionData->valueDate));
        $transaction->status_code = $transactionData->statusCode;
        $transaction->description = $transactionData->description;
        $transaction->sender_name = $transactionData->partnerName ?? null;
        $transaction->save();
    }

    private function getTransactionsResponse($page, $limit = 700)
    {
        $headers = $this->getHeaders();
        $headers[] = $this->soapActionHeader;

        $ch = curl_init();

        curl_setopt($ch, CURLOPT_URL, $this->baseUrl);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $this->getTransactionsByLastTimeBody($page, $limit));

        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $response = curl_exec($ch);

        if (curl_error($ch)) {
            $errorMsg = curl_error($ch);
        }
        curl_close($ch);

        Log::debug($this->getTransactionsByLastTimeBody($page, $limit));
        if (isset($errorMsg)) {
            Log::error($errorMsg);
        }

        return $response;
    }

    private function getTransactionsByLastTimeBody($page, $limit = 700)
    {
        return '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:myg="http://www.mygemini.com/schemas/mygemini" xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"> 
                  <soapenv:Header>
                  <wsse:Security>
                    ' . $this->getAuthenticationBody() . '
                  </wsse:Security>
                  </soapenv:Header>
                  <soapenv:Body>
                    <myg:GetAccountMovementsRequestIo>
                      <myg:accountMovementFilterIo>
                        <myg:pager>
                            <myg:pageIndex>' . $page . '</myg:pageIndex>
                            <myg:pageSize>' . $limit . '</myg:pageSize>
                        </myg:pager>
                        <myg:periodFrom>' . $this->lastTimestamp . '</myg:periodFrom>
                      </myg:accountMovementFilterIo>
                    </myg:GetAccountMovementsRequestIo>
                  </soapenv:Body>
                </soapenv:Envelope>';
    }
}
