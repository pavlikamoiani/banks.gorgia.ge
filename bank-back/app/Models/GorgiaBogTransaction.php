<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GorgiaBogTransaction extends Model
{
    protected $table = 'gorgia_bog_transaction';

    protected $fillable = [
        'bog_id',
        'doc_key',
        'doc_no',
        'transaction_date',
        'value_date',
        'entry_type',
        'entry_comment',
        'entry_comment_en',
        'nomination',
        'credit',
        'debit',
        'amount',
        'amount_base',
        'payer_name',
        'payer_inn',
        'sender_name',
        'sender_inn',
        'sender_account_number',
        'sender_bank_code',
        'sender_bank_name',
        'beneficiary_name',
        'beneficiary_inn',
        'beneficiary_account_number',
        'beneficiary_bank_code',
        'beneficiary_bank_name',
        'raw',
    ];

    protected $casts = [
        'raw' => 'array',
        'transaction_date' => 'datetime',
        'value_date' => 'datetime',
    ];
}
