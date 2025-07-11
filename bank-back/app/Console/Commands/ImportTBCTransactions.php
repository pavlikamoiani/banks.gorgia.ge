<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Repositories\TBCBank\TransactionRepository;

class ImportTBCTransactions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tbc:import-transactions {--date= : Start date in Y-m-d H:i:s format}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Import TBC transactions from the bank API';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $date = $this->option('date') ?? now()->subDay()->format('Y-m-d H:i:s');
        $timestamp = \DateTime::createFromFormat('Y-m-d H:i:s', $date);
        if (!$timestamp) {
            $this->error('Invalid date format. Use Y-m-d H:i:s');
            return 1;
        }
        $repo = new TransactionRepository();
        $this->info('Starting import for date: ' . $date);
        try {
            $repo->transactionsByTimestamp($timestamp);
            $this->info('Import completed.');
        } catch (\Exception $e) {
            $this->error('Error: ' . $e->getMessage());
            return 1;
        }
        return 0;
    }
}
