<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\TbcPassword;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;

class TbcPasswordController extends Controller
{
    // Get latest password info and days left
    public function info()
    {
        $latest = TbcPassword::orderBy('created_at', 'desc')->first();
        if (!$latest) {
            return response()->json(['password' => null, 'days_left' => null, 'created_at' => null]);
        }
        $created = $latest->created_at;
        $days = 30 - now()->diffInDays($created);
        return response()->json([
            'created_at' => $created,
            'days_left' => max(0, $days),
        ]);
    }

    // Update password (add new)
    public function update(Request $request)
    {
        $request->validate(['password' => 'required|string|min:6']);
        $pw = TbcPassword::create(['password' => $request->password]);

        // Update .env file
        $envPath = base_path('.env');
        $env = File::get($envPath);
        $env = preg_replace('/^TBC_PASSWORD=.*$/m', 'TBC_PASSWORD="' . addslashes($request->password) . '"', $env);
        File::put($envPath, $env);

        // Reload config cache
        Artisan::call('config:cache');

        return response()->json(['success' => true, 'created_at' => $pw->created_at]);
    }
}
