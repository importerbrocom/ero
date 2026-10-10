<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExamAttempt extends Model
{
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_EXPIRED = 'expired';
    public const STATUS_ABANDONED = 'abandoned';

    protected $fillable = [
        'user_id', 'exam_id', 'attempt_number', 'block_sequence', 'status',
        'started_at', 'completed_at', 'total_questions', 'answered_count',
        'correct_count', 'incorrect_count', 'accuracy',
        'subject_breakdown', 'topic_breakdown',
    ];

    protected $casts = [
        'block_sequence' => 'array',
        'subject_breakdown' => 'array',
        'topic_breakdown' => 'array',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'accuracy' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }

    public function attemptBlocks(): HasMany
    {
        return $this->hasMany(ExamAttemptBlock::class)->orderBy('display_position');
    }
}
