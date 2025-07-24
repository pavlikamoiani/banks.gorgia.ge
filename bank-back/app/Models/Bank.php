<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Bank extends Model
{
    protected $table = 'bank_type';
    protected $fillable = ['name', 'bank_code'];

    public function transactions()
    {
        return $this->hasMany(Transaction::class, 'bank_type');
    }
}
