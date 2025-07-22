<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BankName extends Model
{
	protected $table = 'bank_names';
	protected $fillable = ['name'];

	public function transactions()
	{
		return $this->hasMany(Transaction::class, 'bank_name_id');
	}
}
