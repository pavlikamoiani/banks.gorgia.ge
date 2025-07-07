<?php

namespace App\Services\BOG;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class BOGService
{
    public function getToken()
    {
        // Кэшируем токен на 50 минут
        return Cache::remember('bog_token', 3000, function () {
            $response = Http::asForm()->post(env('BOG_AUTH_URL'), [
                'grant_type' => 'client_credentials',
                'client_id' => env('BOG_CLIENT_ID'),
                'client_secret' => env('BOG_CLIENT_SECRET'),
            ]);
            return $response->json('access_token');
        });
    }

    public function getTodayActivities($account, $currency)
    {
        $token = $this->getToken();
        \Log::info('BOG token', ['token' => $token]);
        $response = Http::withToken($token)
            ->get(env('BOG_BASE_URL') . "/documents/todayactivities/$account/$currency");
        \Log::info('BOG API status', ['status' => $response->status()]);
        \Log::info('BOG API raw response', ['body' => $response->body()]);
        return $response->json();
    }
}
