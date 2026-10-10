<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Exam extends Model
{
    use SoftDeletes;

    public const TYPE_FULL_MOCK = 'full_mock';
    public const TYPE_LEVEL_MOCK = 'level_mock';
    public const TYPE_DAILY_PRACTICE = 'daily_practice';
    public const TYPE_SUBJECT_TEST = 'subject_test';

    protected $fillable = [
        'exam_programme_id', 'type', 'title', 'description',
        'block_count', 'questions_per_block', 'block_duration_minutes',
        'block_release_interval_minutes', 'block_release_mode',
        'randomize_block_order', 'randomize_questions', 'randomize_options',
        'allow_retry', 'max_attempts', 'result_visibility', 'timer_enabled',
        'allow_flagging', 'require_unique_questions',
        'plan_days', 'questions_per_day', 'status',
    ];

    protected $casts = [
        'randomize_block_order' => 'boolean',
        'randomize_questions' => 'boolean',
        'randomize_options' => 'boolean',
        'allow_retry' => 'boolean',
        'timer_enabled' => 'boolean',
        'allow_flagging' => 'boolean',
        'require_unique_questions' => 'boolean',
    ];

    public function programme(): BelongsTo
    {
        return $this->belongsTo(ExamProgramme::class, 'exam_programme_id');
    }

    public function blocks(): HasMany
    {
        return $this->hasMany(ExamBlock::class)->orderBy('logical_number');
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(ExamAttempt::class);
    }

    public function totalQuestions(): int
    {
        return $this->block_count * $this->questions_per_block;
    }
}
