<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\BOG\BOGService;
use App\Models\GorgiaBogTransaction;
use Carbon\Carbon;
use Log;

class BogMigrateJob extends Command
{
    protected $signature = 'bog:migrate {--account=} {--start=2019-01-01} {--end=} {--currency=GEL}';
    protected $description = 'Миграция выписок BOG по месяцам для одного или двух счетов';

    public function handle(BOGService $bog)
    {
        $start = Carbon::parse($this->option('start'))->startOfMonth();
        $end = $this->option('end') ? Carbon::parse($this->option('end'))->endOfMonth() : Carbon::now()->endOfMonth();
        $currency = $this->option('currency');

        $accounts = [];
        if ($this->option('account')) {
            $accounts[] = $this->option('account');
        } else {
            $accounts = [
                env('BOG_ACCOUNT'),
                env('BOG_ACCOUNT_2')
            ];
        }

        $this->info("Миграция с {$start->toDateString()} по {$end->toDateString()} для счетов:");
        foreach ($accounts as $acc) {
            $this->info("  - $acc");
        }

        foreach ($accounts as $account) {
            $current = $start->copy();
            while ($current->lessThanOrEqualTo($end)) {
                $monthStart = $current->copy()->startOfMonth()->format('Y-m-d');
                $monthEnd = $current->copy()->endOfMonth()->format('Y-m-d');
                $this->info("[$account] $monthStart - $monthEnd ...");
                try {
                    $data = $bog->getStatement($account, $currency, $monthStart, $monthEnd, false, false);
                } catch (\Exception $e) {
                    $this->error("Ошибка для $account $monthStart: " . $e->getMessage());
                    Log::error("BOG MIGRATION ERROR for $account $monthStart - $monthEnd: " . $e->getMessage());
                    $current->addMonth();
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
                $this->info("  -> Вставлено: $inserted, пропущено (дубликаты): $skipped");
                $current->addMonth();
            }
        }

        $this->info("Миграция завершена!");
    }
}
