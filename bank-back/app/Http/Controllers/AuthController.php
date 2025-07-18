<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required'
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json(['message' => 'არასწორი ავტორიზაციის მონაცემები'], 401);
        }

        $user = Auth::user();
        $token = $user->createToken('authToken')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => [
                'email'         => $user->email,
                'role'          => $user->role,
                'department_id' => $user->department_id,
                'bank'          => $user->bank,
            ]
        ]);
    }

    public function logout(Request $request)
    {
        $token = $request->user()->currentAccessToken();
        if ($token) {
            $token->delete();
        }
        return response()->json(['message' => 'Logged out']);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => 'required|string',
            'bank' => 'required|string|in:gorgia,anta',
        ]);

        try {
            $user = \App\Models\User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => bcrypt($validated['password']),
                'role' => $validated['role'],
                'bank' => $validated['bank'],
            ]);
            return response()->json($user, 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'User creation failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => "required|email|unique:users,email,$id",
            'role' => 'required|string',
            'bank' => 'sometimes|required|string|in:gorgia,anta',
            'password' => 'nullable|string|min:6',
        ]);

        $user->name = $validated['name'];
        $user->email = $validated['email'];
        $user->role = $validated['role'];
        if (isset($validated['bank'])) {
            $user->bank = $validated['bank'];
        }
        if (!empty($validated['password'])) {
            $user->password = bcrypt($validated['password']);
        }
        $user->save();

        return response()->json($user);
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete();
        return response()->json(['message' => 'User deleted']);
    }

    public function index(Request $request)
    {
        $query = User::query();

        if ($request->has('name')) {
            $query->where('name', 'like', '%' . $request->query('name') . '%');
        }
        if ($request->has('email')) {
            $query->where('email', 'like', '%' . $request->query('email') . '%');
        }
        if ($request->has('role')) {
            $query->where('role', $request->query('role'));
        }
        if ($request->has('bank')) {
            $query->where('bank', $request->query('bank'));
        }

        $users = $query->orderBy('created_at', 'desc')->get();

        return response()->json($users);
    }
}
