<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Bank extends Model
{
    protected $fillable = ['name', 'auth_token', 'bank_code'];

    public function transactions()
    {
        return $this->hasMany(Transaction::class, 'bank_id');
    }
}
