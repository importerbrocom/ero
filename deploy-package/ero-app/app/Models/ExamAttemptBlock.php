<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExamAttemptBlock extends Model
{
    public const STATUS_LOCKED = 'locked';
    public const STATUS_AVAILABLE = 'available';
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_SUBMITTED = 'submitted';
    public const STATUS_EXPIRED = 'expired';

    protected $fillable = [
        'exam_attempt_id', 'exam_block_id', 'display_position',
        'available_at', 'started_at', 'deadline_at', 'submitted_at',
        'status', 'auto_submitted', 'correct_count', 'answered_count',
    ];

    protected $casts = [
        'available_at' => 'datetime',
        'started_at' => 'datetime',
        'deadline_at' => 'datetime',
        'submitted_at' => 'datetime',
        'auto_submitted' => 'boolean',
    ];

    public function attempt(): BelongsTo
    {
        return $this->belongsTo(ExamAttempt::class, 'exam_attempt_id');
    }

    public function block(): BelongsTo
    {
        return $this->belongsTo(ExamBlock::class, 'exam_block_id');
    }

    public function questions(): HasMany
    {
        return $this->hasMany(ExamAttemptQuestion::class)->orderBy('display_position');
    }

    /** Server-authoritative: is the block's deadline in the past? */
    public function isPastDeadline(): bool
    {
        return $this->deadline_at !== null && now()->greaterThan($this->deadline_at);
    }
}
