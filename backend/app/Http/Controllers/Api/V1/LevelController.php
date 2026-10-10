<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\ExamProgramme;
use Illuminate\Http\Request;

/**
 * FMGE level ladder (§6): 6 levels, each with a 300-question level mock.
 *
 * A level unlocks once the previous level's mock has been completed with at
 * least the configured pass accuracy. Level 1 is always available (given
 * programme access). This endpoint reports each level's mock, the student's
 * best accuracy, completion and lock status — derived from their own attempts.
 */
class LevelController extends Controller
{
    public function index(Request $request, ExamProgramme $programme)
    {
        $user = $request->user();
        abort_unless($programme->status === 'published', 404);
        abort_unless($user->canAccessProgramme($programme->id), 403,
            'You do not have access to this programme.');

        $config = $programme->configuration();
        $levels = (int) $config->get('levels', 6);
        $passAccuracy = (float) $config->get('level_pass_accuracy', 50);

        // All published level-mock exams for this programme, keyed by level.
        $exams = Exam::where('exam_programme_id', $programme->id)
            ->where('type', Exam::TYPE_LEVEL_MOCK)
            ->where('status', 'published')
            ->get()
            ->keyBy('level');

        // The student's completed attempts for those exams, best accuracy per exam.
        $examIds = $exams->pluck('id');
        $bestByExam = ExamAttempt::where('user_id', $user->id)
            ->whereIn('exam_id', $examIds)
            ->where('status', 'completed')
            ->get()
            ->groupBy('exam_id')
            ->map(fn ($group) => (float) $group->max('accuracy'));

        $ladder = [];
        $previousPassed = true; // level 1 is unlocked by default
        for ($lvl = 1; $lvl <= $levels; $lvl++) {
            $exam = $exams->get($lvl);
            $best = $exam ? ($bestByExam->get($exam->id) ?? null) : null;
            $completed = $best !== null;
            $passed = $completed && $best >= $passAccuracy;
            $unlocked = $previousPassed;

            $ladder[] = [
                'level' => $lvl,
                'exam_id' => $exam?->id,
                'title' => $exam?->title ?? "Level {$lvl} Mock",
                'total_questions' => $exam?->totalQuestions(),
                'duration_minutes' => $exam?->block_duration_minutes,
                'status' => ! $exam ? 'coming_soon' : (! $unlocked ? 'locked' : ($completed ? 'completed' : 'available')),
                'best_accuracy' => $best,
                'passed' => $passed,
                'pass_accuracy' => $passAccuracy,
            ];

            // Next level unlocks only if THIS level exists and was passed.
            $previousPassed = $passed;
        }

        return response()->json([
            'data' => [
                'programme' => ['id' => $programme->id, 'name' => $programme->name, 'slug' => $programme->slug],
                'levels' => $levels,
                'pass_accuracy' => $passAccuracy,
                'ladder' => $ladder,
            ],
        ]);
    }
}
