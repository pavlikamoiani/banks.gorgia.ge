<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Repositories\TBCBank\TransactionRepository;
use Carbon\Carbon;

class ImportTBCTransactions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tbc:import-transactions 
        {--from= : Start date in Y-m-d format (default: today)} 
        {--to= : End date in Y-m-d format (default: today)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Import TBC transactions from the bank API with pagination (700 per page)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        set_time_limit(0);

        $from = $this->option('from') ? Carbon::parse($this->option('from'))->startOfDay() : Carbon::today()->startOfDay();
        $to = $this->option('to') ? Carbon::parse($this->option('to'))->endOfDay() : Carbon::today()->endOfDay();

        $this->info('Importing TBC transactions from ' . $from->toDateTimeString() . ' to ' . $to->toDateTimeString());

        $repo = new TransactionRepository();
        $repo->setPeriod($from, $to);
        try {
            $repo->saveNewTransactions();
            $this->info('Import completed.');
        } catch (\Exception $e) {
            $this->error('Error: ' . $e->getMessage());
            return 1;
        }
        return 0;
    }
}
