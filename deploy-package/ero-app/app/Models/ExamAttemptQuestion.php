<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamAttemptQuestion extends Model
{
    protected $fillable = [
        'exam_attempt_block_id', 'question_id', 'display_position',
        'option_order', 'selected_option_id', 'is_flagged',
        'is_correct', 'answered_at',
    ];

    protected $casts = [
        'option_order' => 'array',
        'is_flagged' => 'boolean',
        'is_correct' => 'boolean',
        'answered_at' => 'datetime',
    ];

    public function attemptBlock(): BelongsTo
    {
        return $this->belongsTo(ExamAttemptBlock::class, 'exam_attempt_block_id');
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }
}
