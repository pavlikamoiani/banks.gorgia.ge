<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * The application's command schedule.
     *
     * @param  \Illuminate\Console\Scheduling\Schedule  $schedule
     * @return void
     */
    protected function schedule(Schedule $schedule)
    {
        $schedule->job(new \App\Jobs\UpdateYesterdayData)->dailyAt('04:00');

        $schedule->job(new \App\Jobs\Gorgia\BogJob)->hourly()->at('00');
        // $schedule->job(new \App\Jobs\Gorgia\TbcJob)->hourly()->at('15');
        // $schedule->job(new \App\Jobs\Anta\BogJob)->hourly()->at('30');
        // $schedule->job(new \App\Jobs\Anta\TbcJob)->hourly()->at('45');
    }

    /**
     * Register the commands for the application.
     *
     * @return void
     */
    protected function commands()
    {
        $this->load(__DIR__ . '/Commands');

        require base_path('routes/console.php');
    }

    /**
     * The Artisan commands provided by your application.
     *
     * @var array
     */
    protected $commands = [
        \App\Console\Commands\BogMigrateJob::class,
        \App\Console\Commands\ImportTBCTransactions::class,
    ];
}
