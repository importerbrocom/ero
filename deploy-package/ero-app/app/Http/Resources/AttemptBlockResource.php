<?php

namespace App\Http\Resources;

use App\Models\ExamAttemptBlock;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AttemptBlockResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var ExamAttemptBlock $b */
        $b = $this->resource;

        return [
            'id' => $b->id,
            'display_position' => $b->display_position,
            'logical_number' => $b->block->logical_number,
            'status' => $b->status,
            'available_at' => $b->available_at?->toIso8601String(),
            'started_at' => $b->started_at?->toIso8601String(),
            'deadline_at' => $b->deadline_at?->toIso8601String(),
            'submitted_at' => $b->submitted_at?->toIso8601String(),
            'auto_submitted' => $b->auto_submitted,
            // Server-authoritative remaining seconds (client renders, server enforces).
            'seconds_remaining' => $b->deadline_at && $b->status === ExamAttemptBlock::STATUS_IN_PROGRESS
                ? max(0, now()->diffInSeconds($b->deadline_at, false))
                : null,
            'seconds_until_available' => $b->available_at && $b->status === ExamAttemptBlock::STATUS_LOCKED
                ? max(0, now()->diffInSeconds($b->available_at, false))
                : null,
            'answered_count' => $b->answered_count,
            'question_count' => $b->questions()->count(),
            'server_time' => now()->toIso8601String(),
        ];
    }
}
