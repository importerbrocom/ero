<?php

namespace App\Support;

/**
 * Typed accessor over the exam_programmes.config JSON blob.
 *
 * Exam structure (durations, block counts, question counts, schedules, retry &
 * visibility rules) is data-driven. Nothing here is hard-coded into controllers
 * or React components — the admin dashboard edits this configuration and the
 * engine reads it.
 */
class ProgrammeConfig
{
    public function __construct(protected array $data = [])
    {
    }

    public static function fromArray(?array $data): self
    {
        return new self($data ?? []);
    }

    public function get(string $key, mixed $default = null): mixed
    {
        return data_get($this->data, $key, $default);
    }

    public function toArray(): array
    {
        return $this->data;
    }

    /** Default FMGE programme configuration (6 levels × 300). */
    public static function fmgeDefaults(): array
    {
        return [
            'duration_months' => 6,
            'levels' => 6,
            'questions_per_level' => 300,
            'study_days_per_level' => 30,
            'questions_per_study_day' => 10,
            'level_mock_size' => 300,
            'level_mock_day' => 31,
            'activation_required' => true,
        ];
    }

    /** Default USMLE full-mock configuration (14 × 20 = 280). */
    public static function usmleDefaults(): array
    {
        return [
            'full_mock' => [
                'total_questions' => 280,
                'blocks' => 14,
                'questions_per_block' => 20,
                'block_duration_minutes' => 30,
                'block_release_interval_minutes' => 55,
                'block_release_mode' => 'from_start', // or from_completion
                'randomize_block_order' => true,
                'randomize_questions' => true,
                'randomize_options' => true,
                'result_visibility' => 'after_exam',
            ],
            'daily_practice' => [
                'plan_days' => 14,
                'questions_per_day' => 20,
                'timer_enabled' => false,
                'allow_retry' => true,
                'reveal_explanations' => true,
            ],
            'activation_required' => true,
        ];
    }
}
