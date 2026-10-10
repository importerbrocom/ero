<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subject extends Model
{
    protected $fillable = [
        'exam_programme_id', 'name', 'slug', 'icon', 'color', 'sort_order',
    ];

    public function programme(): BelongsTo
    {
        return $this->belongsTo(ExamProgramme::class, 'exam_programme_id');
    }

    public function topics(): HasMany
    {
        return $this->hasMany(Topic::class);
    }

    public function questions(): HasMany
    {
        return $this->hasMany(Question::class);
    }
}
