<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateTbcPasswordsTable extends Migration
{
    public function up()
    {
        Schema::create('tbc_passwords', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('bank_name_id')->nullable();
            $table->string('password');
            $table->timestamps();

            $table->foreign('bank_name_id')->references('id')->on('bank_names')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('tbc_passwords');
    }
}
