<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ActivationCode extends Model
{
    protected $fillable = [
        'code', 'exam_programme_id', 'batch', 'multi_use',
        'max_redemptions', 'redemption_count', 'expires_at',
        'status', 'created_by',
    ];

    protected $casts = [
        'multi_use' => 'boolean',
        'expires_at' => 'datetime',
    ];

    public function programme(): BelongsTo
    {
        return $this->belongsTo(ExamProgramme::class, 'exam_programme_id');
    }

    public function redemptions(): HasMany
    {
        return $this->hasMany(ActivationCodeRedemption::class);
    }

    public function isRedeemable(): bool
    {
        if ($this->status !== 'active') {
            return false;
        }
        if ($this->expires_at && now()->greaterThan($this->expires_at)) {
            return false;
        }

        return $this->redemption_count < $this->max_redemptions;
    }
}
