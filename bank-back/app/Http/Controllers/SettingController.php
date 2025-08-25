<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    /**
     * Update payment type visibility settings
     */
    public function updatePaymentTypeVisibility(Request $request)
    {
        $validated = $request->validate([
            'role_payment_types' => 'required|array'
        ]);

        $setting = Setting::updateOrCreate(
            ['key' => 'payment_type_visibility'],
            ['value' => json_encode($validated['role_payment_types'])]
        );

        return response()->json([
            'message' => 'Payment type visibility settings updated successfully',
            'data' => $setting
        ]);
    }

    /**
     * Get payment type visibility settings
     */
    public function getPaymentTypeVisibility()
    {
        $setting = Setting::where('key', 'payment_type_visibility')->first();
        $value = $setting ? json_decode($setting->value, true) : [];

        return response()->json($value);
    }
}
