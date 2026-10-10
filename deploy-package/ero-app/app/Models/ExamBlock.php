<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class ExamBlock extends Model
{
    protected $fillable = ['exam_id', 'logical_number', 'label'];

    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }

    public function questions(): BelongsToMany
    {
        return $this->belongsToMany(Question::class, 'exam_block_questions')
            ->withPivot('canonical_position')
            ->withTimestamps()
            ->orderBy('exam_block_questions.canonical_position');
    }
}
