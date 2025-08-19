<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Contragent extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'bank_id',
        'identification_code',
        'company',
        'visible_for_roles',
    ];

    public function bank()
    {
        return $this->belongsTo(BankName::class, 'bank_id');
    }

    public static function findOrCreateByInnAndName($inn, $name, $bankId)
    {
        $existing = self::where('identification_code', $inn)
            ->where('bank_id', $bankId)
            ->get();
        foreach ($existing as $contragent) {
            if (mb_strtolower(trim($contragent->name)) === mb_strtolower(trim($name))) {
                return $contragent;
            }
        }
        return self::create([
            'name' => $name,
            'identification_code' => $inn,
            'bank_id' => $bankId,
        ]);
    }
}
