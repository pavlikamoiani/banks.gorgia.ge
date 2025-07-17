<?php

namespace App\Repositories\BankOfGeorgia;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use App\Models\Transaction;
use App\Models\Bank;

class BOGService
{
    public function getToken()
    {
        return Cache::remember('bog_token', 3000, function () {
            $response = Http::asForm()->post(env('GORGIA_BOG_AUTH_URL'), [
                'grant_type' => 'client_credentials',
                'client_id' => env('GORGIA_BOG_CLIENT_ID'),
                'client_secret' => env('GORGIA_BOG_CLIENT_SECRET'),
            ]);

            if (!$response->ok()) {
                \Log::error('Failed to retrieve BOG token', ['response' => $response->body()]);
                throw new \Exception('Failed to retrieve BOG token');
            }

            return $response->json('access_token');
        });
    }

    public function getTodayActivities($account, $currency)
    {
        set_time_limit(600);
        $token = $this->getToken();
        \Log::info('BOG token', ['token' => $token]);

        if (empty($account) || empty($currency)) {
            \Log::error('BOG getTodayActivities: account or currency is empty', [
                'account' => $account,
                'currency' => $currency
            ]);
            throw new \Exception('Account or currency is empty');
        }

        $url = env('GORGIA_BOG_BASE_URL') . "/documents/todayactivities/$account/$currency";
        \Log::info('BOG todayActivities URL', ['url' => $url]);

        $maxRetries = 3;
        $retryDelay = 2;

        $attempt = 0;
        do {
            $response = Http::withToken($token)
                ->timeout(30)
                ->get($url);

            \Log::info('BOG API status', ['status' => $response->status()]);
            \Log::info('BOG API raw response', ['body' => $response->body()]);

            if ($response->status() === 401) {
                \Log::error('Gorgia BOG token unauthorized, clearing cache and retrying');
                Cache::forget('bog_token');
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
            \Log::error('Failed to retrieve today\'s Gorgia BOG transactions', [
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

            $bank = Bank::where('bank_code', 'BOG')->first();
            $bankId = $bank ? $bank->id : null;

            $exists = Transaction::where('bank_statement_id', $item['Id'] ?? $item['DocKey'] ?? null)
                ->where('bank_id', $bankId)
                ->exists();

            if (!$exists) {
                $transaction = new Transaction();
                $transaction->bank_statement_id = $item['Id'] ?? $item['DocKey'] ?? null;
                $transaction->bank_id = $bankId;
                $transaction->contragent_id = $sender['Inn'] ?? null;
                $transaction->amount = $item['Amount'] ?? null;
                $transaction->transaction_date = $transactionDate;
                $transaction->reflection_date = $valueDate;
                $transaction->sender_name = $sender['Name'] ?? null;
                $transaction->description = $item['EntryComment'] ?? $item['EntryCommentEn'] ?? null;
                $transaction->status_code = $item['EntryType'] ?? null;
                $transaction->save();

                \Log::info('Saved BOG transaction', [
                    'id' => $transaction->id,
                    'bank_statement_id' => $transaction->bank_statement_id,
                    'transaction_date' => $transaction->transaction_date
                ]);
            }
        }
    }

    public function getStatement($accountNumber, $currency, $startDate, $endDate, $includeToday = false, $orderByDate = false)
    {
        $token = $this->getToken();

        $url = sprintf(
            "%s/statement/%s/%s/%s/%s/%s/%s",
            env('GORGIA_BOG_BASE_URL'),
            $accountNumber,
            $currency,
            $startDate,
            $endDate,
            $includeToday ? 'true' : 'false',
            $orderByDate ? 'true' : 'false'
        );

        \Log::info('BOG statement URL', ['url' => $url]);

        $response = Http::timeout(30)
            ->withToken($token)
            ->get($url);

        \Log::info('BOG statement status', ['status' => $response->status()]);
        \Log::info('BOG statement response', ['body' => $response->body()]);

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
            env('GORGIA_BOG_BASE_URL'),
            $accountNumber,
            $currency,
            $statementId,
            $page,
            $orderByDate ? 'true' : 'false'
        );

        \Log::info('BOG statement page URL', ['url' => $url]);

        $response = Http::timeout(30)
            ->withToken($token)
            ->get($url);

        \Log::info('BOG statement page status', ['status' => $response->status()]);
        \Log::info('BOG statement page response', ['body' => $response->body()]);

        if (!$response->ok()) {
            \Log::error('Failed to retrieve BOG statement page', ['response' => $response->body()]);
            throw new \Exception('Error retrieving statement page');
        }

        return $response->json();
    }
}
