<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Question;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class QuestionController extends Controller
{
    public function index(Request $request)
    {
        $query = Question::with(['subject:id,name', 'topic:id,name'])
            ->withCount('options');

        if ($pid = $request->query('programme_id')) {
            $query->where('exam_programme_id', $pid);
        }
        if ($sid = $request->query('subject_id')) {
            $query->where('subject_id', $sid);
        }
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($search = $request->query('search')) {
            $query->where('stem', 'like', "%{$search}%");
        }

        $questions = $query->latest()->paginate(20);

        return response()->json([
            'data' => $questions->items(),
            'meta' => [
                'current_page' => $questions->currentPage(),
                'last_page' => $questions->lastPage(),
                'total' => $questions->total(),
            ],
        ]);
    }

    public function show(Question $question)
    {
        $question->load('options', 'subject:id,name', 'topic:id,name', 'programme:id,name');
        return response()->json(['data' => $question]);
    }

    public function store(Request $request)
    {
        $data = $this->validatePayload($request);

        $question = DB::transaction(function () use ($data, $request) {
            $q = Question::create([
                'exam_programme_id' => $data['exam_programme_id'],
                'subject_id' => $data['subject_id'] ?? null,
                'topic_id' => $data['topic_id'] ?? null,
                'author_id' => $request->user()->id,
                'stem' => $data['stem'],
                'difficulty' => $data['difficulty'] ?? 'medium',
                'explanation' => $data['explanation'] ?? null,
                'key_points' => $data['key_points'] ?? null,
                'high_yield_fact' => $data['high_yield_fact'] ?? null,
                'image_url' => $data['image_url'] ?? null,
                'status' => $data['status'] ?? 'draft',
            ]);
            $this->syncOptions($q, $data['options'], $data['correct_index']);
            return $q;
        });

        AuditLog::record('question.created', $question);

        return response()->json(['data' => $question->load('options')], 201);
    }

    public function update(Request $request, Question $question)
    {
        $data = $this->validatePayload($request);

        DB::transaction(function () use ($question, $data) {
            $question->update([
                'exam_programme_id' => $data['exam_programme_id'],
                'subject_id' => $data['subject_id'] ?? null,
                'topic_id' => $data['topic_id'] ?? null,
                'stem' => $data['stem'],
                'difficulty' => $data['difficulty'] ?? 'medium',
                'explanation' => $data['explanation'] ?? null,
                'key_points' => $data['key_points'] ?? null,
                'high_yield_fact' => $data['high_yield_fact'] ?? null,
                'image_url' => $data['image_url'] ?? null,
                'status' => $data['status'] ?? $question->status,
                'version' => $question->version + 1,
            ]);
            $question->options()->delete();
            $this->syncOptions($question, $data['options'], $data['correct_index']);
        });

        AuditLog::record('question.updated', $question, ['version' => $question->version]);

        return response()->json(['data' => $question->fresh('options')]);
    }

    /** Archive (soft) a question. */
    public function archive(Question $question)
    {
        $question->update(['status' => 'archived']);
        AuditLog::record('question.archived', $question);
        return response()->json(['message' => 'Archived.']);
    }

    private function validatePayload(Request $request): array
    {
        return $request->validate([
            'exam_programme_id' => ['required', 'exists:exam_programmes,id'],
            'subject_id' => ['nullable', 'exists:subjects,id'],
            'topic_id' => ['nullable', 'exists:topics,id'],
            'stem' => ['required', 'string'],
            'difficulty' => ['nullable', 'in:easy,medium,hard'],
            'explanation' => ['nullable', 'string'],
            'key_points' => ['nullable', 'array'],
            'high_yield_fact' => ['nullable', 'string'],
            'image_url' => ['nullable', 'string'],
            'status' => ['nullable', 'in:draft,active,archived'],
            'options' => ['required', 'array', 'min:2'],
            'options.*' => ['required', 'string'],
            'correct_index' => ['required', 'integer', 'min:0'],
        ]);
    }

    private function syncOptions(Question $question, array $options, int $correctIndex): void
    {
        abort_if($correctIndex >= count($options), 422, 'correct_index is out of range for the given options.');

        foreach (array_values($options) as $i => $text) {
            $question->options()->create([
                'text' => $text,
                'is_correct' => $i === $correctIndex,
                'canonical_order' => $i,
            ]);
        }
    }
}
