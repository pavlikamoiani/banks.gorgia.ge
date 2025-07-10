<?php

namespace App\Services\BOG;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class BOGService
{
    public function getToken()
    {
        // Кэшируем токен на 50 минут (3000 секунд)
        return Cache::remember('bog_token', 3000, function () {
            $response = Http::asForm()->post(env('BOG_AUTH_URL'), [
                'grant_type' => 'client_credentials',
                'client_id' => env('BOG_CLIENT_ID'),
                'client_secret' => env('BOG_CLIENT_SECRET'),
            ]);

            if (!$response->ok()) {
                \Log::error('Ошибка получения токена BOG', ['response' => $response->body()]);
                throw new \Exception('Не удалось получить токен BOG');
            }

            return $response->json('access_token');
        });
    }

    public function getTodayActivities($account, $currency)
    {
        $token = $this->getToken();
        \Log::info('BOG token', ['token' => $token]);

        $response = Http::withToken($token)
            ->timeout(10)
            ->get(env('BOG_BASE_URL') . "/documents/todayactivities/$account/$currency");

        \Log::info('BOG API status', ['status' => $response->status()]);
        \Log::info('BOG API raw response', ['body' => $response->body()]);

        if (!$response->ok()) {
            \Log::error('Ошибка получения сегодняшних операций BOG', ['response' => $response->body()]);
            throw new \Exception('Ошибка при запросе сегодняшних операций');
        }

        return $response->json();
    }

    public function saveStatementToDb($activities)
    {
        foreach ($activities as $item) {
            $sender = $item['Sender'] ?? [];
            $beneficiary = $item['Beneficiary'] ?? [];

            // CONTRAGENT LOGIC
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

            $saved = \App\Models\GorgiaBogTransaction::updateOrCreate(
                [
                    'bog_id' => $item['Id'] ?? null,
                    'doc_key' => $item['DocKey'] ?? null,
                ],
                [
                    'doc_no' => $item['DocNo'] ?? null,
                    'transaction_date' => $transactionDate,
                    'value_date' => $valueDate,
                    'entry_type' => $item['EntryType'] ?? null,
                    'entry_comment' => $item['EntryComment'] ?? null,
                    'entry_comment_en' => $item['EntryCommentEn'] ?? null,
                    'nomination' => $item['Nomination'] ?? null,
                    'credit' => $item['Credit'] ?? null,
                    'debit' => $item['Debit'] ?? null,
                    'amount' => $item['Amount'] ?? null,
                    'amount_base' => $item['AmountBase'] ?? null,
                    'payer_name' => $item['PayerName'] ?? null,
                    'payer_inn' => $item['PayerInn'] ?? null,
                    'sender_name' => $sender['Name'] ?? null,
                    'sender_inn' => $sender['Inn'] ?? null,
                    'sender_account_number' => $sender['AccountNumber'] ?? null,
                    'sender_bank_code' => $sender['BankCode'] ?? null,
                    'sender_bank_name' => $sender['BankName'] ?? null,
                    'beneficiary_name' => $beneficiary['Name'] ?? null,
                    'beneficiary_inn' => $beneficiary['Inn'] ?? null,
                    'beneficiary_account_number' => $beneficiary['AccountNumber'] ?? null,
                    'beneficiary_bank_code' => $beneficiary['BankCode'] ?? null,
                    'beneficiary_bank_name' => $beneficiary['BankName'] ?? null,
                    'raw' => $item,
                ]
            );

            \Log::info('Saved statement', [
                'id' => $saved->id,
                'bog_id' => $saved->bog_id,
                'transaction_date' => $saved->transaction_date
            ]);
        }
    }

    public function getStatement($accountNumber, $currency, $startDate, $endDate, $includeToday = false, $orderByDate = false)
    {
        $token = $this->getToken();

        $url = sprintf(
            "%s/statement/%s/%s/%s/%s/%s/%s",
            env('BOG_BASE_URL'),
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
            \Log::error('Ошибка получения выписки BOG', ['response' => $response->body()]);
            throw new \Exception('Ошибка при получении выписки');
        }

        return $response->json();
    }

    public function getStatementPage($accountNumber, $currency, $statementId, $page, $orderByDate = false)
    {
        $token = $this->getToken();

        $url = sprintf(
            "%s/statement/%s/%s/%s/%d/%s",
            env('BOG_BASE_URL'),
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
            \Log::error('Ошибка получения страницы выписки BOG', ['response' => $response->body()]);
            throw new \Exception('Ошибка при получении страницы выписки');
        }

        return $response->json();
    }
}
