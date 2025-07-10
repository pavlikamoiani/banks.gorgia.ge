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
            $table->string('password');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('tbc_passwords');
    }
}
