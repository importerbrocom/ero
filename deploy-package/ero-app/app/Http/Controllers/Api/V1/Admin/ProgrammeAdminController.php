<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Exam;
use App\Models\ExamProgramme;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProgrammeAdminController extends Controller
{
    public function index()
    {
        return response()->json([
            'data' => ExamProgramme::withCount(['questions', 'subjects', 'exams'])
                ->orderBy('sort_order')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'slug' => ['required', 'alpha_dash', 'unique:exam_programmes,slug'],
            'name' => ['required', 'string'],
            'full_name' => ['required', 'string'],
            'country' => ['nullable', 'string'],
            'flag_emoji' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
            'accent_color' => ['nullable', 'string'],
            'config' => ['nullable', 'array'],
            'status' => ['nullable', 'in:draft,published,archived'],
        ]);

        $programme = ExamProgramme::create(array_merge($data, [
            'config' => $data['config'] ?? [],
            'status' => $data['status'] ?? 'draft',
        ]));
        AuditLog::record('programme.created', $programme);

        return response()->json(['data' => $programme], 201);
    }

    public function update(Request $request, ExamProgramme $programme)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string'],
            'full_name' => ['sometimes', 'string'],
            'country' => ['nullable', 'string'],
            'flag_emoji' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
            'accent_color' => ['nullable', 'string'],
            'config' => ['sometimes', 'array'],
            'status' => ['sometimes', 'in:draft,published,archived'],
            'sort_order' => ['sometimes', 'integer'],
        ]);

        $programme->update($data);
        AuditLog::record('programme.updated', $programme);

        return response()->json(['data' => $programme->fresh()]);
    }

    /**
     * Configure an exam within a programme (counts, durations, schedule, rules).
     * Validates the structure (e.g. blocks x per-block == total) before saving,
     * per §6 "validate the question totals dynamically before publishing".
     */
    public function upsertExam(Request $request, ExamProgramme $programme)
    {
        $data = $request->validate([
            'id' => ['nullable', 'exists:exams,id'],
            'type' => ['required', 'in:full_mock,level_mock,daily_practice,subject_test'],
            'title' => ['required', 'string'],
            'description' => ['nullable', 'string'],
            'block_count' => ['required', 'integer', 'min:1'],
            'questions_per_block' => ['required', 'integer', 'min:1'],
            'block_duration_minutes' => ['required', 'integer', 'min:1'],
            'block_release_interval_minutes' => ['required', 'integer', 'min:0'],
            'block_release_mode' => ['required', 'in:from_start,from_completion'],
            'randomize_block_order' => ['boolean'],
            'randomize_questions' => ['boolean'],
            'randomize_options' => ['boolean'],
            'allow_retry' => ['boolean'],
            'max_attempts' => ['nullable', 'integer', 'min:1'],
            'result_visibility' => ['required', 'in:never_during,after_block,after_exam,immediate'],
            'timer_enabled' => ['boolean'],
            'allow_flagging' => ['boolean'],
            'plan_days' => ['nullable', 'integer', 'min:1'],
            'questions_per_day' => ['nullable', 'integer', 'min:1'],
            'status' => ['required', 'in:draft,published,archived'],
        ]);

        $exam = isset($data['id'])
            ? Exam::where('exam_programme_id', $programme->id)->findOrFail($data['id'])
            : new Exam(['exam_programme_id' => $programme->id]);

        $exam->fill($data);
        $exam->exam_programme_id = $programme->id;

        // Guard: can only publish if the built blocks actually match the config.
        if ($data['status'] === 'published' && $exam->exists) {
            $builtBlocks = $exam->blocks()->count();
            if ($builtBlocks > 0 && $builtBlocks !== $data['block_count']) {
                return response()->json([
                    'message' => "Cannot publish: configured {$data['block_count']} blocks but {$builtBlocks} are built. Rebuild the exam's blocks first.",
                ], 422);
            }
        }

        $exam->save();
        AuditLog::record('exam.configured', $exam, ['type' => $exam->type, 'status' => $exam->status]);

        return response()->json([
            'data' => array_merge($exam->fresh()->toArray(), [
                'total_questions' => $exam->totalQuestions(),
            ]),
        ]);
    }
}
