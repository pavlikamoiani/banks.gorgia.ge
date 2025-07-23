<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TbcPassword extends Model
{
    protected $fillable = ['password', 'bank_id'];

    public function bank()
    {
        return $this->belongsTo(BankName::class, 'bank_id');
    }
}
