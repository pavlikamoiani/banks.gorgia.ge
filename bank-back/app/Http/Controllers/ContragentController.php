<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Contragent;
use \PhpOffice\PhpSpreadsheet\IOFactory;

class ContragentController extends Controller
{
    public function index(Request $request)
    {
        $bank = $request->input('bank');
        $user = $request->user();
        $role = $user ? $user->role : null;

        $page = (int) $request->query('page', 1);
        $pageSize = (int) $request->query('pageSize', 25);
        $offset = ($page - 1) * $pageSize;

        $name = $request->query('name');
        $identification_code = $request->query('identification_code');

        $query = Contragent::query();

        if ($bank === 'anta') {
            $query->where('bank_id', 2);
        } elseif ($bank === 'gorgia') {
            $query->where('bank_id', 1);
        }

        if ($name) {
            $query->where('name', 'like', '%' . $name . '%');
        }
        if ($identification_code) {
            $query->where('identification_code', 'like', '%' . $identification_code . '%');
        }

        if ($role && $role !== 'super_admin') {
            $roleSettings = json_decode(optional(\App\Models\Setting::where('key', 'payment_type_visibility')->first())->value, true) ?? [];
            $userVisiblePaymentTypes = $roleSettings[$role] ?? [];
            if (!in_array('enrollments', $userVisiblePaymentTypes)) {
                $query->whereJsonContains('visible_for_roles', $role);
            } else {
                $query->where('name', 'not like', '%შპს გორგია%');
            }
        }

        $total = $query->count();

        $contragents = $query->orderBy('created_at', 'desc')
            ->limit($pageSize)
            ->offset($offset)
            ->get();

        return response()->json([
            'data' => $contragents,
            'pagination' => [
                'total' => $total,
                'page' => $page,
                'pageSize' => $pageSize,
                'totalPages' => ceil($total / $pageSize)
            ]
        ]);
    }

    public function getAllIds(Request $request)
    {
        $bank = $request->input('bank');
        $user = $request->user();
        $role = $user ? $user->role : null;

        $name = $request->query('name');
        $identification_code = $request->query('identification_code');

        $query = Contragent::query()->select('id');

        if ($bank === 'anta') {
            $query->where('bank_id', 2);
        } elseif ($bank === 'gorgia') {
            $query->where('bank_id', 1);
        }

        if ($name) {
            $query->where('name', 'like', '%' . $name . '%');
        }
        if ($identification_code) {
            $query->where('identification_code', 'like', '%' . $identification_code . '%');
        }

        if ($role && $role !== 'super_admin') {
            $query->whereJsonContains('visible_for_roles', $role);
        }

        $ids = $query->pluck('id')->toArray();
        return response()->json($ids);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $bankId = $user && $user->bank === 'anta' ? 2 : 1;

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'identification_code' => 'required|string|max:255',
            'visible_for_roles' => 'nullable|array'
        ]);
        $validated['bank_id'] = $bankId;
        if (!isset($validated['visible_for_roles'])) {
            $validated['visible_for_roles'] = [];
        }

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
            'name' => 'sometimes|string|max:255',
            'identification_code' => 'sometimes|string|max:255',
            'visible_for_roles' => 'nullable|array'
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

    public function batchUpdateRoles(Request $request)
    {
        $input = $request->only(['ids', 'visible_for_roles']);
        $input['ids'] = array_values(is_array($input['ids']) ? $input['ids'] : []);
        $input['visible_for_roles'] = array_values(is_array($input['visible_for_roles']) ? $input['visible_for_roles'] : []);

        $validated = validator($input, [
            'ids' => 'required|array',
            'visible_for_roles' => 'nullable|array'
        ])->validate();

        $existingContragents = Contragent::whereIn('id', $validated['ids'])->get();
        $existingIds = $existingContragents->pluck('id')->toArray();
        $missingIds = array_diff($validated['ids'], $existingIds);

        if (empty($existingIds)) {
            return response()->json(['message' => 'Contragent not found'], 404);
        }

        foreach ($existingContragents as $contragent) {
            $contragent->visible_for_roles = $validated['visible_for_roles'];
            $contragent->save();
        }

        return response()->json([
            'message' => 'Updated',
            'updated_ids' => $existingIds,
            'missing_ids' => array_values($missingIds)
        ]);
    }

    public function uploadExcel(Request $request)
    {
        ini_set('max_execution_time', 0);
        ini_set('memory_limit', '1024M');

        if (!$request->hasFile('file')) {
            return response()->json(['message' => 'No file uploaded'], 400);
        }

        $added = [];
        $errors = [];
        $user = $request->user();
        $bankId = $user && $user->bank === 'anta' ? 2 : 1;

        try {
            $file = $request->file('file');
            $spreadsheet = IOFactory::load($file->getPathname());
            $sheet = $spreadsheet->getActiveSheet();
            $rows = $sheet->toArray();

            foreach ($rows as $row) {
                if (!isset($row[0]) || !isset($row[2])) {
                    $errors[] = ['row' => $row, 'error' => 'Not enough columns'];
                    continue;
                }
                $name = trim($row[0]);
                $identification_code = trim($row[2]);

                if ($name === '' || $identification_code === '' || mb_strtolower($name) === 'პარტნიორი') {
                    continue;
                }

                $exists = Contragent::where('name', $name)
                    ->where('identification_code', $identification_code)
                    ->where('bank_id', $bankId)
                    ->exists();

                if ($exists) {
                    $errors[] = ['row' => $row, 'error' => 'Duplicate contragent'];
                    continue;
                }

                try {
                    $contragent = Contragent::create([
                        'name' => $name,
                        'identification_code' => $identification_code,
                        'bank_id' => $bankId,
                        'visible_for_roles' => [],
                    ]);
                    $added[] = $contragent->id;
                } catch (\Exception $e) {
                    $errors[] = ['row' => $row, 'error' => $e->getMessage()];
                }
            }
        } catch (\Exception $e) {
            return response()->json([
                'added' => [],
                'errors' => [['row' => [], 'error' => 'Excel parsing error: ' . $e->getMessage()]]
            ], 400);
        }

        return response()->json([
            'added' => $added,
            'errors' => $errors
        ]);
    }
}
