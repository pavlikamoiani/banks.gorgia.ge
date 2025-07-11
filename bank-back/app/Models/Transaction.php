<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    protected $table = 'gorgia_transactions';
    protected $fillable = [
        'contragent_id',
        'bank_id',
        'bank_statement_id',
        'amount',
        'transaction_date',
        'reflection_date',
        'description',
        'status_code'
    ];

    protected $dates = [
        'transaction_date',
        'reflection_date',
        'created_at',
        'updated_at'
    ];
}
