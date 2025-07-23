<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\TbcPassword;

class TbcPasswordController extends Controller
{
    public function info()
    {
        $latest = TbcPassword::orderBy('created_at', 'desc')->first();
        if (!$latest) {
            return response()->json(['password' => null, 'days_left' => null, 'created_at' => null]);
        }
        $created = $latest->created_at;
        $days = 90 - now()->diffInDays($created);
        return response()->json([
            'created_at' => $created,
            'days_left' => max(0, $days),
        ]);
    }

    public function update(Request $request)
    {
        $request->validate([
            'password' => 'required|string|min:6',
            'bank_name_id' => 'required|integer|in:1,2',
        ]);
        $pw = TbcPassword::create([
            'password' => $request->password,
            'bank_name_id' => $request->bank_name_id
        ]);
        return response()->json(['success' => true, 'created_at' => $pw->created_at]);
    }
}
