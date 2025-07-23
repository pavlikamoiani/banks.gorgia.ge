<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
	public function up()
	{
		Schema::create('banks', function (Blueprint $table) {
			$table->id();
			$table->string('name')->unique();
			$table->timestamps();
		});

		DB::table('banks')->insert([
			['name' => 'Gorgia', 'created_at' => now(), 'updated_at' => now()],
			['name' => 'Anta', 'created_at' => now(), 'updated_at' => now()],
		]);
	}

	public function down()
	{
		Schema::dropIfExists('banks');
	}
};
