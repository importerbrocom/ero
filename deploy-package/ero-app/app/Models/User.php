<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    public const ROLE_STUDENT = 'student';
    public const ROLE_ADMIN = 'admin';
    public const ROLE_SUPER_ADMIN = 'super_admin';

    protected $fillable = [
        'name', 'email', 'password', 'role',
        'phone', 'country', 'avatar_url', 'status',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    // ---- Role helpers (authorisation is enforced server-side) ----

    public function isStudent(): bool
    {
        return $this->role === self::ROLE_STUDENT;
    }

    public function isAdmin(): bool
    {
        return in_array($this->role, [self::ROLE_ADMIN, self::ROLE_SUPER_ADMIN], true);
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === self::ROLE_SUPER_ADMIN;
    }

    public function hasRole(string ...$roles): bool
    {
        // super_admin implicitly satisfies admin checks.
        if ($this->isSuperAdmin()) {
            return true;
        }

        return in_array($this->role, $roles, true);
    }

    // ---- Relationships ----

    public function attempts(): HasMany
    {
        return $this->hasMany(ExamAttempt::class);
    }

    public function programmeAccess(): HasMany
    {
        return $this->hasMany(ProgrammeAccess::class);
    }

    public function practiceEnrollments(): HasMany
    {
        return $this->hasMany(PracticeEnrollment::class);
    }

    public function canAccessProgramme(int $programmeId): bool
    {
        return $this->programmeAccess()
            ->where('exam_programme_id', $programmeId)
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->exists();
    }
}
