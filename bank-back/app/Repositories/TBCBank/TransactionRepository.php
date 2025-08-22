<?php

namespace App\Repositories\TBCBank;

use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use App\Models\BankName;
use App\Models\Bank;

class TransactionRepository extends BaseRepository
{
    private $lastTimestamp;
    private $endTimestamp;
    private $soapActionHeader;

    /**
     * StatementRepository constructor.
     */
    public function __construct($bankNameId = 1)
    {
        parent::__construct($bankNameId);

        $this->soapActionHeader = 'SoapAction: "http://www.mygemini.com/schemas/mygemini/GetAccountMovements"';
    }

    public function transactionsByTimestamp($timestamp)
    {
        $minimumTimestamp = \DateTime::createFromFormat('Y-m-d H:i:s', '2019-05-06 00:00:00');
        if ($timestamp < $minimumTimestamp) {
            $timestamp = $minimumTimestamp;
        }

        $this->lastTimestamp = $timestamp->format('Y-m-d\\TH:i:s');
        $this->endTimestamp = Carbon::now()->format('Y-m-d\\T23:59:59');

        $this->saveNewTransactions();
    }

    public function setPeriod($from, $to)
    {
        $this->lastTimestamp = $from->format('Y-m-d\TH:i:s');
        $this->endTimestamp = $to->format('Y-m-d\T23:59:59');
    }

    public function saveNewTransactions()
    {
        $page = 0;
        $limit = 700;
        $totalSaved = 0;
        $totalSkipped = 0;

        do {
            $response = $this->getTransactionsResponse($page, $limit);
            Log::debug('TBC SOAP RAW RESPONSE (page loop): ' . substr($response, 0, 500) . '...');
            $responseAsObject = $this->responseAsObject($response);

            if (!isset($responseAsObject->Body)) {
                Log::error('TBC SOAP: Body property missing in response (page loop)', ['response' => substr(json_encode($responseAsObject), 0, 500)]);
                throw new \Exception('TBC SOAP: Body property missing in response (page loop). Check logs for details.');
            }

            $totalCount = $responseAsObject->Body->GetAccountMovementsResponseIo->result->totalCount ?? 0;
            Log::info("TBC transactions totalCount: {$totalCount}, page: {$page}");

            $movements = $responseAsObject->Body->GetAccountMovementsResponseIo->accountMovement;
            if (!is_array($movements) && !is_null($movements)) {
                $movements = [$movements];
            }

            if (empty($movements)) {
                Log::info("No movements found on page {$page}, stopping.");
                break;
            }

            try {
                foreach ($movements as $transaction) {
                    try {
                        if (property_exists($transaction, 'movementId') && !is_object($transaction->movementId)) {
                            $exists = Transaction::where('bank_statement_id', $transaction->movementId)->exists();

                            if (!$exists) {
                                $this->saveInLocalDB($transaction);
                                $totalSaved++;
                            } else {
                                $totalSkipped++;
                            }
                        }
                    } catch (\Exception $e) {
                        Log::error('Error saving transaction: ' . $e->getMessage());
                        Log::debug(json_encode($transaction, JSON_UNESCAPED_UNICODE));
                    }
                }
            } catch (\Exception $e) {
                Log::error("Error processing TBC transactions: " . $e->getMessage());
            }

            $page++;
        } while ($totalCount > ($page * $limit));

        Log::info("TBC transactions sync completed. Total saved: {$totalSaved}, Total skipped: {$totalSkipped}");
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
            ['contragent_id', $transactionData->partnerTaxCode ?? $transactionData->taxpayerCode] ?? null,
            ['bank_id', $bank ? $bank->id : null],
            ['amount', $transactionData->amount->amount],
            ['transaction_date', $transactionDate],
            ['reflection_date', $reflectionDate],
            ['status_code', $transactionData->statusCode],
            ['description', $transactionData->description],
        ])->exists();

        if ($exists) {
            return;
        }

        if (
            isset($transactionData->partnerTaxCode, $transactionData->partnerName) &&
            trim($transactionData->partnerTaxCode) !== '' &&
            trim($transactionData->partnerName) !== '' &&
            (strpos($transactionData->description, 'თვის ხელფასი') === false)
        ) {
            \App\Models\Contragent::findOrCreateByInnAndName(
                trim($transactionData->partnerTaxCode),
                trim($transactionData->partnerName),
                $bank ? $bank->id : null
            );
        }

        $transaction = new Transaction();
        $transaction->contragent_id = $transactionData->partnerTaxCode ?? $transactionData->taxpayerCode ?? null;
        $bank = Bank::where('bank_code', 'TBC')->first();
        $transaction->bank_id = $bank ? $bank->id : null;
        $transaction->bank_statement_id = $transactionData->movementId;
        $transaction->amount = $transactionData->amount->amount;
        $transaction->transaction_date = date('Y-m-d H:i:s', strtotime($transactionData->documentDate));
        $transaction->reflection_date = date('Y-m-d H:i:s', strtotime($transactionData->valueDate));
        $transaction->status_code = $transactionData->statusCode;
        $transaction->description = $transactionData->description;
        $transaction->sender_name = $transactionData->partnerName ?? null;
        $bankNameModel = BankName::where('name', 'Gorgia')->first();
        $transaction->bank_name_id = $bankNameModel ? $bankNameModel->id : null;
        $transaction->created_at = date('Y-m-d H:i:s', strtotime($transactionData->documentDate));
        $transaction->save();
    }

    public function responseAsObject($response)
    {
        return parent::responseAsObject($response);
    }


    public function getTransactionsResponse($page, $limit = 700)
    {
        $headers = $this->getHeaders();
        $headers[] = $this->soapActionHeader;

        $ch = curl_init();

        curl_setopt($ch, CURLOPT_URL, $this->baseUrl);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $this->getTransactionsByLastTimeBody($page, $limit));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

        $certPath = env('TBC_CERT_PEM_PATH', storage_path('app/certs/cert.pem'));
        $keyPath = env('TBC_CERT_KEY_PATH', storage_path('app/certs/key.pem'));
        $sslPass = env('TBC_CERT_PASS');

        curl_setopt($ch, CURLOPT_SSLCERT, $certPath);
        curl_setopt($ch, CURLOPT_SSLKEY, $keyPath);
        curl_setopt($ch, CURLOPT_SSLKEYPASSWD, $sslPass);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
        curl_setopt($ch, CURLOPT_SSLVERSION, CURL_SSLVERSION_TLSv1_2);

        $response = curl_exec($ch);

        if (curl_errno($ch)) {
            $errorMsg = curl_error($ch);
            $errorCode = curl_errno($ch);
            Log::error('cURL error: ' . $errorMsg);
            Log::error('cURL error code: ' . $errorCode);
            Log::error('cURL info: ' . json_encode(curl_getinfo($ch)));
            Log::error('Certificate path used: ' . $certPath);
            Log::error('Key path used: ' . $keyPath);
            Log::error('SSL password used: ' . $sslPass);

            // Log PEM block only, warn if "Bag Attributes" found
            if (file_exists($certPath)) {
                $certContent = file_get_contents($certPath);
                if (strpos($certContent, 'Bag Attributes') !== false) {
                    Log::warning('Certificate file contains Bag Attributes. Remove all lines before -----BEGIN CERTIFICATE----- for cURL compatibility.');
                }
                $pemStart = strpos($certContent, '-----BEGIN CERTIFICATE-----');
                $pemEnd = strpos($certContent, '-----END CERTIFICATE-----');
                if ($pemStart !== false && $pemEnd !== false) {
                    $pemBlock = substr($certContent, $pemStart, $pemEnd - $pemStart + strlen('-----END CERTIFICATE-----'));
                    Log::error('Certificate PEM block: ' . substr($pemBlock, 0, 200));
                }
            }
            if (file_exists($keyPath)) {
                $keyContent = file_get_contents($keyPath);
                if (strpos($keyContent, 'Bag Attributes') !== false) {
                    Log::warning('Key file contains Bag Attributes. Remove all lines before -----BEGIN PRIVATE KEY----- for cURL compatibility.');
                }
                $pemStart = strpos($keyContent, '-----BEGIN PRIVATE KEY-----');
                $pemEnd = strpos($keyContent, '-----END PRIVATE KEY-----');
                if ($pemStart !== false && $pemEnd !== false) {
                    $pemBlock = substr($keyContent, $pemStart, $pemEnd - $pemStart + strlen('-----END PRIVATE KEY-----'));
                    Log::error('Key PEM block: ' . substr($pemBlock, 0, 200));
                }
            }
            Log::error('BankNameId: ' . $this->bankNameId);
            Log::error('Endpoint URL: ' . $this->baseUrl);
        }
        curl_close($ch);

        Log::debug($this->getTransactionsByLastTimeBody($page, $limit));
        if (isset($errorMsg)) {
            Log::error($errorMsg);
        }
        Log::debug('TBC SOAP response: ' . substr($response, 0, 1000));

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
                        <myg:periodTo>' . $this->endTimestamp . '</myg:periodTo>
                      </myg:accountMovementFilterIo>
                    </myg:GetAccountMovementsRequestIo>
                  </soapenv:Body>
                </soapenv:Envelope>';
    }
}
