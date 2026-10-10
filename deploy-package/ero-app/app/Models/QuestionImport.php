<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuestionImport extends Model
{
    protected $fillable = [
        'exam_programme_id', 'created_by', 'filename', 'status',
        'total_rows', 'valid_rows', 'error_rows', 'errors', 'preview',
    ];

    protected $casts = [
        'errors' => 'array',
        'preview' => 'array',
    ];

    public function programme(): BelongsTo
    {
        return $this->belongsTo(ExamProgramme::class, 'exam_programme_id');
    }
}
