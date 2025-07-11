<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Bank;

class BankSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        Bank::updateOrCreate(
            ['name' => 'BOG'],
            ['auth_token' => null, 'bank_code' => 'BOG']
        );
        Bank::updateOrCreate(
            ['name' => 'TBC'],
            ['auth_token' => null, 'bank_code' => 'TBC']
        );
    }
}
