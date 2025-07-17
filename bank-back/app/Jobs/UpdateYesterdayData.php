<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Repositories\BankOfGeorgia\BOGService;
use App\Models\Transaction;
use App\Models\Bank;
use App\Models\Contragent;
use Carbon\Carbon;
use Log;

class UpdateYesterdayData implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     *
     * @return void
     */
    public function __construct()
    {
        //
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        $bog = app(BOGService::class);
        $currency = env('GORGIA_BOG_CURRENCY', 'GEL');
        $accounts = [
            env('GORGIA_BOG_ACCOUNT'),
            env('GORGIA_BOG_ACCOUNT_2')
        ];

        $yesterday = Carbon::yesterday()->format('Y-m-d');
        $bogBankId = Bank::where('bank_code', 'BOG')->first()->id ?? null;

        foreach ($accounts as $account) {
            try {
                $data = $bog->getStatement($account, $currency, $yesterday, $yesterday, false, false);
            } catch (\Exception $e) {
                Log::error("UpdateYesterdayData: Ошибка получения выписки за $yesterday для $account: " . $e->getMessage());
                continue;
            }

            $activities = [];
            if (isset($data['activities']) && is_array($data['activities'])) {
                $activities = $data['activities'];
            } elseif (isset($data['Records']) && is_array($data['Records'])) {
                foreach ($data['Records'] as $rec) {
                    $activities[] = [
                        'Id' => $rec['EntryId'] ?? null,
                        'DocKey' => $rec['DocumentKey'] ?? null,
                        'DocNo' => $rec['EntryDocumentNumber'] ?? null,
                        'PostDate' => $rec['EntryDate'] ?? null,
                        'ValueDate' => $rec['DocumentValueDate'] ?? null,
                        'EntryType' => $rec['EntryDepartment'] ?? null,
                        'EntryComment' => $rec['EntryComment'] ?? null,
                        'EntryCommentEn' => $rec['DocumentInformation'] ?? null,
                        'Nomination' => $rec['DocumentNomination'] ?? null,
                        'Credit' => $rec['EntryAmountCredit'] ?? null,
                        'Debit' => $rec['EntryAmountDebit'] ?? null,
                        'Amount' => $rec['EntryAmount'] ?? $rec['DocumentSourceAmount'] ?? null,
                        'AmountBase' => $rec['EntryAmountBase'] ?? null,
                        'PayerName' => $rec['DocumentPayerName'] ?? null,
                        'PayerInn' => $rec['DocumentPayerInn'] ?? null,
                        'Sender' => [
                            'Name' => $rec['SenderDetails']['Name'] ?? null,
                            'Inn' => $rec['SenderDetails']['Inn'] ?? null,
                            'AccountNumber' => $rec['SenderDetails']['AccountNumber'] ?? null,
                            'BankCode' => $rec['SenderDetails']['BankCode'] ?? null,
                            'BankName' => $rec['SenderDetails']['BankName'] ?? null,
                        ],
                        'Beneficiary' => [
                            'Name' => $rec['BeneficiaryDetails']['Name'] ?? null,
                            'Inn' => $rec['BeneficiaryDetails']['Inn'] ?? null,
                            'AccountNumber' => $rec['BeneficiaryDetails']['AccountNumber'] ?? null,
                            'BankCode' => $rec['BeneficiaryDetails']['BankCode'] ?? null,
                            'BankName' => $rec['BeneficiaryDetails']['BankName'] ?? null,
                        ],
                        'syncDate' => $rec['DocumentReceiveDate'] ?? null,
                    ];
                }
            } else {
                $activities = $data ?? [];
            }

            $inserted = 0;
            $skipped = 0;
            foreach ($activities as $activity) {
                // CONTRAGENT LOGIC
                if (
                    isset($activity['Sender']['Name'], $activity['Sender']['Inn']) &&
                    trim($activity['Sender']['Name']) !== '' &&
                    trim($activity['Sender']['Inn']) !== ''
                ) {
                    $inn = trim($activity['Sender']['Inn']);
                    $name = trim($activity['Sender']['Name']);
                    $existing = Contragent::where('identification_code', $inn)->get();
                    $shouldInsert = true;
                    foreach ($existing as $contragent) {
                        if (mb_strtolower(trim($contragent->name)) === mb_strtolower($name)) {
                            $shouldInsert = false;
                            break;
                        }
                    }
                    if ($shouldInsert) {
                        Contragent::create([
                            'name' => $name,
                            'identification_code' => $inn,
                        ]);
                    }
                }

                $bankStatementId = $activity['Id'] ?? $activity['DocKey'] ?? null;

                if (!$bankStatementId) {
                    $skipped++;
                    continue;
                }

                $exists = Transaction::where('bank_statement_id', $bankStatementId)
                    ->where('bank_id', $bogBankId)
                    ->exists();

                if ($exists) {
                    $skipped++;
                    continue;
                }

                $transaction = new Transaction();
                $transaction->bank_statement_id = $bankStatementId;
                $transaction->bank_id = $bogBankId;
                $transaction->contragent_id = $activity['Sender']['Inn'] ?? null;
                $transaction->amount = $activity['Amount'] ?? null;
                $transaction->transaction_date = $activity['PostDate'] ?? null;
                $transaction->reflection_date = $activity['ValueDate'] ?? null;
                $transaction->sender_name = $activity['Sender']['Name'] ?? null;
                $transaction->description = $activity['EntryComment'] ?? $activity['EntryCommentEn'] ?? null;
                $transaction->status_code = $activity['EntryType'] ?? null;
                $transaction->save();

                $inserted++;
            }

            Log::info("UpdateYesterdayData: $account $yesterday - inserted: $inserted, skipped: $skipped");
        }
    }
}
