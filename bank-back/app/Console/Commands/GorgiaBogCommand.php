<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Repositories\BankOfGeorgia\BOGService;
use App\Models\Transaction;
use Illuminate\Support\Facades\Log;
use App\Models\Contragent;

class GorgiaBogCommand extends Command
{
    protected $signature = 'gorgia:bog';
    protected $description = 'Fetch and save Gorgia BOG transactions';

    public function handle()
    {
        Log::info('GorgiaBogCommand: handle started');

        $bog = new BOGService('gorgia');
        try {
            $accounts = [];
            $acc1 = env('GORGIA_BOG_ACCOUNT');
            $acc2 = env('GORGIA_BOG_ACCOUNT_2');
            if ($acc1) $accounts[] = $acc1;
            if ($acc2) $accounts[] = $acc2;
            $currency = env('GORGIA_BOG_CURRENCY', 'GEL');
            foreach ($accounts as $account) {
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
                            1
                        );
                    }
                    $exists = Transaction::where('bank_statement_id', $bankStatementId)
                        ->where('bank_id', 1)
                        ->where('bank_type', 2)
                        ->exists();
                    if ($exists) {
                        continue;
                    }
                    Transaction::create([
                        'bank_id' => 1,
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
            }
            Log::info('BogCommand: Transactions saved for Gorgia (all accounts).');
        } catch (\Exception $e) {
            Log::error('BogCommand error: ' . $e->getMessage());
        }
        $this->info('Gorgia BOG transactions processed.');
    }
}
