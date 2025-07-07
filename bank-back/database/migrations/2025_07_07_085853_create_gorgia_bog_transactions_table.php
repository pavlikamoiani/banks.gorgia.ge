<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('gorgia_bog_transaction', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('bog_id')->nullable();
            $table->bigInteger('doc_key')->nullable();
            $table->string('doc_no')->nullable();
            $table->dateTime('transaction_date')->nullable();
            $table->dateTime('value_date')->nullable();
            $table->string('entry_type')->nullable();
            $table->text('entry_comment')->nullable();
            $table->text('entry_comment_en')->nullable();
            $table->string('nomination')->nullable();
            $table->decimal('credit', 20, 2)->nullable();
            $table->decimal('debit', 20, 2)->nullable();
            $table->decimal('amount', 20, 2)->nullable();
            $table->decimal('amount_base', 20, 2)->nullable();
            $table->string('payer_name')->nullable();
            $table->string('payer_inn')->nullable();
            $table->string('sender_name')->nullable();
            $table->string('sender_inn')->nullable();
            $table->string('sender_account_number')->nullable();
            $table->string('sender_bank_code')->nullable();
            $table->string('sender_bank_name')->nullable();
            $table->string('beneficiary_name')->nullable();
            $table->string('beneficiary_inn')->nullable();
            $table->string('beneficiary_account_number')->nullable();
            $table->string('beneficiary_bank_code')->nullable();
            $table->string('beneficiary_bank_name')->nullable();
            $table->json('raw')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('gorgia_bog_transaction');
    }
};
