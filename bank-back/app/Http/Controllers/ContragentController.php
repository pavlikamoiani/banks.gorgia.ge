<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Contragent;

class ContragentController extends Controller
{
    public function index(Request $request)
    {
        $company = $request->query('company');
        $query = Contragent::query();
        if ($company) {
            $query->where('company', $company);
        }
        return response()->json($query->orderBy('created_at', 'desc')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'identification_code' => 'required|string|max:255',
            'company' => 'required|string|max:255',
        ]);
        $contragent = Contragent::create($validated);
        return response()->json($contragent, 201);
    }
}
