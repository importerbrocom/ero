<?php

namespace App\Http\Resources;

use App\Models\QuestionOption;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Serialises a question as presented to a student during an attempt.
 *
 * SECURITY (§5.4): never emits is_correct / the answer key while review is not
 * permitted. Options are returned in the attempt's stored display order with
 * generated display letters (A, B, C, D) that carry no correctness meaning.
 */
class ExamQuestionResource extends JsonResource
{
    public function __construct($resource, protected bool $revealAnswers = false)
    {
        parent::__construct($resource);
    }

    public function toArray(Request $request): array
    {
        $aq = $this->resource; // ExamAttemptQuestion
        $question = $aq->question;

        // Order the canonical options by the attempt's stored option_order.
        $byId = $question->options->keyBy('id');
        $letters = range('A', 'Z');

        $options = [];
        foreach ($aq->option_order as $i => $optionId) {
            /** @var QuestionOption $opt */
            $opt = $byId[$optionId];
            $row = [
                'id' => $opt->id,
                'letter' => $letters[$i],
                'text' => $opt->text,
            ];
            if ($this->revealAnswers) {
                $row['is_correct'] = $opt->is_correct;
            }
            $options[] = $row;
        }

        $data = [
            'attempt_question_id' => $aq->id,
            'display_position' => $aq->display_position,
            'stem' => $question->stem,
            'image_url' => $question->image_url,
            'subject' => $question->subject?->name,
            'topic' => $question->topic?->name,
            'difficulty' => $question->difficulty,
            'options' => $options,
            'selected_option_id' => $aq->selected_option_id,
            'is_flagged' => $aq->is_flagged,
        ];

        if ($this->revealAnswers) {
            $data['is_correct'] = $aq->is_correct;
            $data['explanation'] = $question->explanation;
            $data['key_points'] = $question->key_points;
            $data['high_yield_fact'] = $question->high_yield_fact;
        }

        return $data;
    }
}
