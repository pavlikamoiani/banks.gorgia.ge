<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Contragent extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'identification_code',
        'company',
        'hidden_for_roles',
    ];

    protected $casts = [
        'hidden_for_roles' => 'array',
    ];
}
