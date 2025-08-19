<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('contragents', function (Blueprint $table) {
            if (!Schema::hasColumn('contragents', 'visible_for_roles')) {
                $table->json('visible_for_roles')->nullable();
            }
        });
    }

    public function down()
    {
        Schema::table('contragents', function (Blueprint $table) {
            if (Schema::hasColumn('contragents', 'visible_for_roles')) {
                $table->dropColumn('visible_for_roles');
            }
        });
    }
};
