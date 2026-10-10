<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PracticeEnrollment extends Model
{
    protected $fillable = [
        'user_id', 'exam_id', 'current_day', 'streak',
        'best_streak', 'last_completed_date',
    ];

    protected $casts = ['last_completed_date' => 'date'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }

    public function days(): HasMany
    {
        return $this->hasMany(PracticeDay::class)->orderBy('day_number');
    }
}
