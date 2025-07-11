<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('gorgia_transactions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('contragent_id')->nullable();
            $table->unsignedBigInteger('bank_id')->nullable();
            $table->string('bank_statement_id')->nullable();
            $table->decimal('amount', 20, 2)->nullable();
            $table->timestamp('transaction_date')->nullable();
            $table->timestamp('reflection_date')->nullable();
            $table->string('description')->nullable();
            $table->string('status_code')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('gorgia_transactions');
    }
};
