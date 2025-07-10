<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Contragent;

class ContragentController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(Contragent::orderBy('created_at', 'desc')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'identification_code' => 'required|string|max:255',
        ]);
        $contragent = Contragent::create($validated);
        return response()->json($contragent, 201);
    }

    public function show($id)
    {
        $contragent = Contragent::find($id);
        if (!$contragent) {
            return response()->json(['message' => 'Contragent not found'], 404);
        }
        return response()->json($contragent);
    }

    public function update(Request $request, $id)
    {
        $contragent = Contragent::find($id);
        if (!$contragent) {
            return response()->json(['message' => 'Contragent not found'], 404);
        }
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'identification_code' => 'required|string|max:255',
        ]);
        $contragent->update($validated);
        return response()->json($contragent);
    }

    public function destroy($id)
    {
        $contragent = Contragent::find($id);
        if (!$contragent) {
            return response()->json(['message' => 'Contragent not found'], 404);
        }
        $contragent->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
