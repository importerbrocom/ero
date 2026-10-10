<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProgrammeAccess extends Model
{
    protected $table = 'programme_access';

    protected $fillable = [
        'user_id', 'exam_programme_id', 'granted_via', 'expires_at',
    ];

    protected $casts = ['expires_at' => 'datetime'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function programme(): BelongsTo
    {
        return $this->belongsTo(ExamProgramme::class, 'exam_programme_id');
    }
}
