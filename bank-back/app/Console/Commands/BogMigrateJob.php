<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Repositories\BankOfGeorgia\BOGService;
use App\Models\Contragent;
use App\Models\Transaction;
use App\Models\Bank;
use Carbon\Carbon;
use Log;

class BogMigrateJob extends Command
{
    protected $signature = 'bog:migrate {--account=} {--start=2025-07-01} {--end=} {--currency=GEL}';
    protected $description = 'Миграция выписок BOG по месяцам для одного или двух счетов';

    public function handle(BOGService $bog)
    {
        $start = Carbon::parse($this->option('start'))->startOfDay();
        $end = $this->option('end') ? Carbon::parse($this->option('end'))->endOfDay() : Carbon::now()->endOfDay();
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


        $maxRetries = 3;
        $retryDelay = 2; // секунд

        foreach ($accounts as $account) {
            $current = $start->copy();
            while ($current->lessThanOrEqualTo($end)) {
                $dayStart = $current->copy()->startOfDay()->format('Y-m-d');
                $dayEnd = $current->copy()->endOfDay()->format('Y-m-d');
                $this->info("[$account] $dayStart ...");

                $allActivities = [];
                $statementId = null;
                $orderByDate = false;

                $retries = 0;
                $success = false;
                while ($retries < $maxRetries && !$success) {
                    try {
                        $data = $bog->getStatement($account, $currency, $dayStart, $dayEnd, false, $orderByDate);
                        $success = true;
                    } catch (\Exception $e) {
                        $retries++;
                        $this->error("Ошибка для $account $dayStart (попытка $retries): " . $e->getMessage());
                        Log::error("BOG MIGRATION ERROR for $account $dayStart (try $retries): " . $e->getMessage());
                        if ($retries < $maxRetries) {
                            sleep($retryDelay);
                        }
                    }
                }
                if (!$success) {
                    $this->error("Не удалось получить выписку для $account $dayStart после $maxRetries попыток.");
                    $current->addDay();
                    sleep(1);
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
                            'PostDate' => $rec['EntryDate'] ?? null,
                        ];
                    }
                } else {
                    $activities = $data ?? [];
                }
                $allActivities = array_merge($allActivities, $activities);

                $statementId = $data['Id'] ?? $data['id'] ?? null;

                $page = 2;
                while ($statementId && count($activities) === 1000) {
                    try {
                        $pagedData = $bog->getStatementPage($account, $currency, $statementId, $page, $orderByDate);
                    } catch (\Exception $e) {
                        $this->error("Ошибка (страница $page) для $account $dayStart: " . $e->getMessage());
                        Log::error("BOG MIGRATION ERROR (page $page) for $account $dayStart: " . $e->getMessage());
                        break;
                    }

                    $activities = [];
                    if (isset($pagedData['activities']) && is_array($pagedData['activities'])) {
                        $activities = $pagedData['activities'];
                    } elseif (isset($pagedData['Records']) && is_array($pagedData['Records'])) {
                        foreach ($pagedData['Records'] as $rec) {
                            $activities[] = [
                                'Id' => $rec['EntryId'] ?? null,
                                'DocKey' => $rec['DocumentKey'] ?? null,
                                'DocNo' => $rec['EntryDocumentNumber'] ?? null,
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
                                'PostDate' => $rec['EntryDate'] ?? null,
                            ];
                        }
                    } else {
                        $activities = $pagedData ?? [];
                    }
                    $allActivities = array_merge($allActivities, $activities);
                    $page++;
                }

                $inserted = 0;
                $skipped = 0;
                foreach ($allActivities as $activity) {
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

                    $bogBankId = Bank::where('bank_code', 'BOG')->first()->id ?? null;
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

                    Transaction::create([
                        'contragent_id' => $activity['Sender']['Inn'] ?? null,
                        'bank_id' => $bogBankId,
                        'bank_statement_id' => $bankStatementId,
                        'amount' => $activity['Amount'] ?? null,
                        'transaction_date' => $activity['PostDate'] ?? null,
                        'reflection_date' => $activity['ValueDate'] ?? null,
                        'sender_name' => $activity['Sender']['Name'] ?? null,
                        'description' => $activity['EntryComment'] ?? $activity['EntryCommentEn'] ?? null,
                        'status_code' => $activity['EntryType'] ?? null,
                    ]);
                    $inserted++;
                }
                $this->info("  -> Вставлено: $inserted, пропущено (дубликаты): $skipped");
                $current->addDay();
                sleep(1);
            }
        }

        $this->info("Миграция завершена!");
    }
}
