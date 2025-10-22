<?php

namespace App\Repositories\BankOfGeorgia;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use App\Models\Transaction;
use App\Models\Bank;
use App\Models\BankName;
use App\Models\Contragent;

class BOGService
{
    protected $bank;

    public function __construct($bank = 'gorgia')
    {
        $this->bank = $bank;
    }

    protected function getEnv($key)
    {
        $prefix = strtoupper($this->bank);
        return env("{$prefix}_BOG_{$key}");
    }

    public function getToken()
    {
        $cacheKey = $this->bank . '_bog_token';
        return \Cache::remember($cacheKey, 3000, function () {
            $response = \Http::asForm()->post($this->getEnv('AUTH_URL'), [
                'grant_type' => 'client_credentials',
                'client_id' => $this->getEnv('CLIENT_ID'),
                'client_secret' => $this->getEnv('CLIENT_SECRET'),
            ]);
            if (!$response->ok()) {
                \Log::error('Failed to retrieve BOG token', ['response' => $response->body()]);
                throw new \Exception('Failed to retrieve BOG token');
            }
            return $response->json('access_token');
        });
    }

    public function getTodayActivities($account = null, $currency = null)
    {
        set_time_limit(600);
        $token = $this->getToken();

        $account = $account ?: $this->getEnv('ACCOUNT');
        $currency = $currency ?: $this->getEnv('CURRENCY', 'GEL');

        if (empty($account) || empty($currency)) {
            \Log::error('BOG getTodayActivities: account or currency is empty', [
                'account' => $account,
                'currency' => $currency
            ]);
            throw new \Exception('Account or currency is empty');
        }

        $url = $this->getEnv('BASE_URL') . "/documents/todayactivities/$account/$currency";

        $maxRetries = 3;
        $retryDelay = 2;
        $attempt = 0;
        do {
            $response = \Http::withToken($token)
                ->timeout(30)
                ->get($url);

            if ($response->status() === 401) {
                \Log::error('BOG token unauthorized, clearing cache and retrying');
                \Cache::forget($this->bank . '_bog_token');
                $token = $this->getToken();
                $attempt++;
                sleep($retryDelay);
                continue;
            }

            if ($response->status() === 503) {
                \Log::error('BOG API Service Unavailable (503), retrying', [
                    'attempt' => $attempt + 1,
                    'url' => $url,
                    'body' => $response->body()
                ]);
                $attempt++;
                sleep($retryDelay);
                continue;
            }

            break;
        } while ($attempt < $maxRetries);

        if (!$response->ok()) {
            \Log::error('Failed to retrieve today\'s BOG transactions', [
                'url' => $url,
                'status' => $response->status(),
                'body' => $response->body(),
                'account' => $account,
                'currency' => $currency
            ]);
            throw new \Exception(
                "Error requesting today's transactions. Status: " . $response->status() .
                    ". Body: " . $response->body()
            );
        }

        return $response->json();
    }

    public function saveStatementToDb($activities)
    {
        $bankName = $this->bank === 'anta' ? 'Anta' : 'Gorgia';
        $bankModel = \App\Models\BankName::where('name', $bankName)->first();
        $bankId = $bankModel ? $bankModel->id : null;

        foreach ($activities as $item) {
            $sender = $item['Sender'] ?? [];
            $beneficiary = $item['Beneficiary'] ?? [];

            if (
                isset($sender['Name'], $sender['Inn']) &&
                trim($sender['Name']) !== '' &&
                trim($sender['Inn']) !== ''
            ) {
                $inn = trim($sender['Inn']);
                $name = trim($sender['Name']);
                $existing = \App\Models\Contragent::where('identification_code', $inn)->get();
                $shouldInsert = true;
                foreach ($existing as $contragent) {
                    if (mb_strtolower(trim($contragent->name)) === mb_strtolower($name)) {
                        $shouldInsert = false;
                        break;
                    }
                }
                if ($shouldInsert) {
                    \App\Models\Contragent::create([
                        'name' => $name,
                        'identification_code' => $inn,
                    ]);
                }
            }

            $transactionDate = isset($item['PostDate']) ? date('Y-m-d H:i:s', strtotime($item['PostDate'])) : null;
            $valueDate = isset($item['ValueDate']) ? date('Y-m-d H:i:s', strtotime($item['ValueDate'])) : null;

            // Use bank_type for TBC/BOG, but bank_id for Gorgia/Anta
            $bogBank = \App\Models\Bank::where('bank_code', 'BOG')->first();
            $bogBankTypeId = $bogBank ? $bogBank->id : null;

            $exists = \App\Models\Transaction::where('bank_statement_id', $item['Id'] ?? $item['DocKey'] ?? null)
                ->where('bank_id', $bankId)
                ->exists();

            if (!$exists) {
                $transaction = new \App\Models\Transaction();
                $transaction->bank_statement_id = $item['Id'] ?? $item['DocKey'] ?? null;
                $transaction->bank_id = $bankId; // 1 for Gorgia, 2 for Anta
                $transaction->bank_type = $bogBankTypeId;
                $transaction->contragent_id = $sender['Inn'] ?? null;
                $transaction->amount = $item['Amount'] ?? null;
                $transaction->transaction_date = $transactionDate;
                $transaction->reflection_date = $valueDate;
                $transaction->sender_name = $sender['Name'] ?? null;
                $transaction->description = $item['EntryComment'] ?? $item['EntryCommentEn'] ?? null;
                $transaction->status_code = $item['EntryType'] ?? null;
                $transaction->save();
            }
        }
    }

    public function getStatement($accountNumber, $currency, $startDate, $endDate, $includeToday = false, $orderByDate = false)
    {
        $token = $this->getToken();

        $url = sprintf(
            "%s/statement/%s/%s/%s/%s/%s/%s",
            $this->getEnv('BASE_URL'),
            $accountNumber,
            $currency,
            $startDate,
            $endDate,
            $includeToday ? 'true' : 'false',
            $orderByDate ? 'true' : 'false'
        );

        $response = \Http::timeout(30)
            ->withToken($token)
            ->get($url);

        if (!$response->ok()) {
            \Log::error('Failed to retrieve BOG statement', ['response' => $response->body()]);
            throw new \Exception('Error retrieving statement');
        }

        return $response->json();
    }

    public function getStatementPage($accountNumber, $currency, $statementId, $page, $orderByDate = false)
    {
        $token = $this->getToken();

        $url = sprintf(
            "%s/statement/%s/%s/%s/%d/%s",
            $this->getEnv('BASE_URL'),
            $accountNumber,
            $currency,
            $statementId,
            $page,
            $orderByDate ? 'true' : 'false'
        );


        $response = \Http::timeout(30)
            ->withToken($token)
            ->get($url);

        if (!$response->ok()) {
            \Log::error('Failed to retrieve BOG statement page', ['response' => $response->body()]);
            throw new \Exception('Error retrieving statement page');
        }

        return $response->json();
    }
}
