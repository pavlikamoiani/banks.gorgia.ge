<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Repositories\BankOfGeorgia\BOGService;
use App\Models\Transaction;
use Illuminate\Support\Facades\Log;
use App\Models\Contragent;

class AntaBogCommand extends Command
{
    protected $signature = 'anta:bog';
    protected $description = 'Fetch and save Anta BOG transactions';

    public function handle()
    {
        $bog = new BOGService('anta');
        try {
            $account = env('ANTA_BOG_ACCOUNT');
            $currency = env('ANTA_BOG_CURRENCY', 'GEL');
            $data = $bog->getTodayActivities($account, $currency);
            $activities = $data['activities'] ?? (is_array($data) ? $data : []);
            foreach ($activities as $item) {
                $bankStatementId = $item['Id'] ?? $item['DocKey'] ?? null;
                if (!$bankStatementId) {
                    continue;
                }
                if (
                    isset($item['Sender']['Name'], $item['Sender']['Inn']) &&
                    trim($item['Sender']['Name']) !== '' &&
                    trim($item['Sender']['Inn']) !== ''
                ) {
                    Contragent::findOrCreateByInnAndName(
                        trim($item['Sender']['Inn']),
                        trim($item['Sender']['Name']),
                        2
                    );
                }
                $exists = Transaction::where('bank_statement_id', $bankStatementId)
                    ->where('bank_id', 2)
                    ->where('bank_type', 2)
                    ->exists();
                if ($exists) {
                    continue;
                }
                Transaction::create([
                    'bank_id' => 2,
                    'bank_type' => 2,
                    'contragent_id' => $item['Sender']['Inn'] ?? null,
                    'bank_statement_id' => $bankStatementId,
                    'amount' => $item['Amount'] ?? null,
                    'transaction_date' => isset($item['PostDate']) ? date('Y-m-d H:i:s', strtotime($item['PostDate'])) : null,
                    'reflection_date' => isset($item['ValueDate']) ? date('Y-m-d H:i:s', strtotime($item['ValueDate'])) : null,
                    'sender_name' => $item['Sender']['Name'] ?? null,
                    'description' => $item['EntryComment'] ?? $item['EntryCommentEn'] ?? null,
                    'status_code' => $item['EntryType'] ?? null,
                ]);
            }
            Log::info('BogCommand: Transactions saved for Anta.');
        } catch (\Exception $e) {
            Log::error('BogCommand error: ' . $e->getMessage());
        }
    }
}
