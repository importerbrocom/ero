<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Question extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'exam_programme_id', 'subject_id', 'topic_id', 'author_id',
        'stem', 'difficulty', 'explanation', 'key_points',
        'high_yield_fact', 'image_url', 'tags', 'status', 'version',
    ];

    protected $casts = [
        'key_points' => 'array',
        'tags' => 'array',
    ];

    public function programme(): BelongsTo
    {
        return $this->belongsTo(ExamProgramme::class, 'exam_programme_id');
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function topic(): BelongsTo
    {
        return $this->belongsTo(Topic::class);
    }

    public function options(): HasMany
    {
        return $this->hasMany(QuestionOption::class)->orderBy('canonical_order');
    }

    public function correctOption(): ?QuestionOption
    {
        return $this->options->firstWhere('is_correct', true);
    }
}
