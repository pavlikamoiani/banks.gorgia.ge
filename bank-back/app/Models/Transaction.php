<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    protected $table = 'transactions';
    protected $fillable = [
        'contragent_id',
        'bank_id',
        'bank_statement_id',
        'amount',
        'transaction_date',
        'reflection_date',
        'sender_name',
        'description',
        'status_code',
        'bank_name_id'
    ];

    protected $dates = [
        'transaction_date',
        'reflection_date',
        'created_at',
        'updated_at'
    ];

    public function bankName()
    {
        return $this->belongsTo(\App\Models\BankName::class, 'bank_name_id');
    }
}
