public function run()
{
    \App\Models\User::create([
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => bcrypt('password'),
        'role' => 'admin',
        'department_id' => 1,
    ]);
}
