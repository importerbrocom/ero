<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PracticeDay extends Model
{
    protected $fillable = [
        'practice_enrollment_id', 'day_number', 'exam_block_id',
        'question_ids', 'option_orders', 'responses', 'status',
        'correct_count', 'answered_count', 'accuracy', 'completed_at',
    ];

    protected $casts = [
        'question_ids' => 'array',
        'option_orders' => 'array',
        'responses' => 'array',
        'accuracy' => 'decimal:2',
        'completed_at' => 'datetime',
    ];

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(PracticeEnrollment::class, 'practice_enrollment_id');
    }
}
