<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Contragent;

class ContragentController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $contragents = Contragent::orderBy('created_at', 'desc')->get();

        if ($user && $user->role !== 'super_admin') {
            $contragents = $contragents->filter(function ($contragent) use ($user) {
                $hidden = $contragent->hidden_for_roles ?? [];
                return !in_array($user->role, $hidden);
            })->values();
        }

        return response()->json($contragents);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'identification_code' => 'required|string|max:255',
            'hidden_for_roles' => 'nullable|array',
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
            'hidden_for_roles' => 'nullable|array',
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
