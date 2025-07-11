<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Repositories\BankOfGeorgia\BOGService;
use App\Models\GorgiaBogTransaction;
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
        $currency = env('BOG_CURRENCY', 'GEL');
        $accounts = [
            env('BOG_ACCOUNT'),
            env('BOG_ACCOUNT_2')
        ];

        $yesterday = Carbon::yesterday()->format('Y-m-d');

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

                $exists = GorgiaBogTransaction::where(function ($q) use ($activity) {
                    if (!empty($activity['Id'])) $q->orWhere('bog_id', $activity['Id']);
                    if (!empty($activity['DocKey'])) $q->orWhere('doc_key', $activity['DocKey']);
                    if (!empty($activity['DocNo'])) $q->orWhere('doc_no', $activity['DocNo']);
                })->exists();

                if ($exists) {
                    $skipped++;
                    continue;
                }

                GorgiaBogTransaction::create([
                    'bog_id' => $activity['Id'] ?? null,
                    'doc_key' => $activity['DocKey'] ?? null,
                    'doc_no' => $activity['DocNo'] ?? null,
                    'transaction_date' => $activity['PostDate'] ?? null,
                    'value_date' => $activity['ValueDate'] ?? null,
                    'entry_type' => $activity['EntryType'] ?? null,
                    'entry_comment' => $activity['EntryComment'] ?? null,
                    'entry_comment_en' => $activity['EntryCommentEn'] ?? null,
                    'nomination' => $activity['Nomination'] ?? null,
                    'credit' => $activity['Credit'] ?? null,
                    'debit' => $activity['Debit'] ?? null,
                    'amount' => $activity['Amount'] ?? null,
                    'amount_base' => $activity['AmountBase'] ?? null,
                    'payer_name' => $activity['PayerName'] ?? null,
                    'payer_inn' => $activity['PayerInn'] ?? null,
                    'sender_name' => $activity['Sender']['Name'] ?? null,
                    'sender_inn' => $activity['Sender']['Inn'] ?? null,
                    'sender_account_number' => $activity['Sender']['AccountNumber'] ?? null,
                    'sender_bank_code' => $activity['Sender']['BankCode'] ?? null,
                    'sender_bank_name' => $activity['Sender']['BankName'] ?? null,
                    'beneficiary_name' => $activity['Beneficiary']['Name'] ?? null,
                    'beneficiary_inn' => $activity['Beneficiary']['Inn'] ?? null,
                    'beneficiary_account_number' => $activity['Beneficiary']['AccountNumber'] ?? null,
                    'beneficiary_bank_code' => $activity['Beneficiary']['BankCode'] ?? null,
                    'beneficiary_bank_name' => $activity['Beneficiary']['BankName'] ?? null,
                    'raw' => $activity,
                ]);
                $inserted++;
            }
            Log::info("UpdateYesterdayData: $account $yesterday - inserted: $inserted, skipped: $skipped");
        }
    }
}
