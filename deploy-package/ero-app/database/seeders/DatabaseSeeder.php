<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Demo accounts for each role (passwords: "password").
        User::updateOrCreate(['email' => 'super@ero.test'], [
            'name' => 'ERO Super Admin',
            'password' => 'password',
            'role' => User::ROLE_SUPER_ADMIN,
            'email_verified_at' => now(),
            'country' => 'India',
        ]);

        User::updateOrCreate(['email' => 'admin@ero.test'], [
            'name' => 'ERO Admin',
            'password' => 'password',
            'role' => User::ROLE_ADMIN,
            'email_verified_at' => now(),
            'country' => 'India',
        ]);

        User::updateOrCreate(['email' => 'student@ero.test'], [
            'name' => 'Jazz',
            'password' => 'password',
            'role' => User::ROLE_STUDENT,
            'email_verified_at' => now(),
            'country' => 'India',
        ]);

        $this->call([
            ProgrammeSeeder::class,
        ]);
    }
}
