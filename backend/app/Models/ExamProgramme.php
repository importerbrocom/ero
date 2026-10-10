<?php

namespace App\Models;

use App\Support\ProgrammeConfig;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ExamProgramme extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'slug', 'name', 'full_name', 'country', 'flag_emoji',
        'description', 'accent_color', 'cover_image_url', 'config',
        'status', 'sort_order',
    ];

    protected $casts = [
        'config' => 'array',
    ];

    public function subjects(): HasMany
    {
        return $this->hasMany(Subject::class)->orderBy('sort_order');
    }

    public function questions(): HasMany
    {
        return $this->hasMany(Question::class);
    }

    public function exams(): HasMany
    {
        return $this->hasMany(Exam::class);
    }

    public function configuration(): ProgrammeConfig
    {
        return ProgrammeConfig::fromArray($this->config);
    }
}
