<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('bank_type', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('bank_code')->unique();
            $table->timestamps();
        });

        DB::table('bank_type')->insert([
            ['name' => 'TBC', 'bank_code' => 'TBC', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'BOG', 'bank_code' => 'BOG', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('bank_type');
    }
};
