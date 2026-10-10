<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ExamProgramme;
use Illuminate\Http\Request;

class ProgrammeController extends Controller
{
    /** Public: list published programmes for the "Choose Your Exam" screen. */
    public function index(Request $request)
    {
        $user = $this->resolveOptionalUser($request);

        $programmes = ExamProgramme::where('status', 'published')
            ->withCount(['questions' => fn ($q) => $q->where('status', 'active')])
            ->orderBy('sort_order')
            ->get()
            ->map(fn ($p) => $this->card($p, $user));

        return response()->json(['data' => $programmes]);
    }

    public function show(Request $request, ExamProgramme $programme)
    {
        $user = $this->resolveOptionalUser($request);
        abort_unless($programme->status === 'published', 404);

        $programme->load(['subjects' => fn ($q) => $q->withCount([
            'questions' => fn ($qq) => $qq->where('status', 'active'),
        ])]);

        return response()->json([
            'data' => array_merge($this->card($programme, $user), [
                'config' => $programme->config,
                'subjects' => $programme->subjects->map(fn ($s) => [
                    'id' => $s->id,
                    'name' => $s->name,
                    'slug' => $s->slug,
                    'icon' => $s->icon,
                    'color' => $s->color,
                    'question_count' => $s->questions_count,
                ]),
                'exams' => $programme->exams()->where('status', 'published')->get()->map(fn ($e) => [
                    'id' => $e->id,
                    'type' => $e->type,
                    'title' => $e->title,
                    'description' => $e->description,
                    'block_count' => $e->block_count,
                    'questions_per_block' => $e->questions_per_block,
                    'total_questions' => $e->totalQuestions(),
                    'block_duration_minutes' => $e->block_duration_minutes,
                ]),
            ]),
        ]);
    }

    /**
     * These routes are public but personalise `has_access` when a valid bearer
     * token is present. Sanctum only auto-populates the user on guarded routes,
     * so resolve the token explicitly here.
     */
    private function resolveOptionalUser(Request $request)
    {
        return $request->user() ?? auth('sanctum')->user();
    }

    private function card(ExamProgramme $p, $user): array
    {
        return [
            'id' => $p->id,
            'slug' => $p->slug,
            'name' => $p->name,
            'full_name' => $p->full_name,
            'country' => $p->country,
            'flag_emoji' => $p->flag_emoji,
            'description' => $p->description,
            'accent_color' => $p->accent_color,
            'cover_image_url' => $p->cover_image_url,
            'question_count' => $p->questions_count ?? $p->questions()->where('status', 'active')->count(),
            'has_access' => $user ? $user->canAccessProgramme($p->id) : false,
        ];
    }
}
