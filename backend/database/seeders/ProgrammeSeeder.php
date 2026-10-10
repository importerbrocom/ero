<?php

namespace Database\Seeders;

use App\Models\Exam;
use App\Models\ExamBlock;
use App\Models\ExamProgramme;
use App\Models\Question;
use App\Models\QuestionOption;
use App\Models\Subject;
use App\Models\User;
use App\Support\ProgrammeConfig;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ProgrammeSeeder extends Seeder
{
    public function run(): void
    {
        $author = User::where('role', User::ROLE_ADMIN)->first();
        $student = User::where('role', User::ROLE_STUDENT)->first();

        $usmle = $this->seedUsmle($author);
        $fmge = $this->seedFmge($author);

        // Grant the demo student access to both programmes.
        foreach ([$usmle, $fmge] as $programme) {
            $student->programmeAccess()->updateOrCreate(
                ['exam_programme_id' => $programme->id],
                ['granted_via' => 'admin']
            );
        }
    }

    private function seedUsmle(User $author): ExamProgramme
    {
        $programme = ExamProgramme::updateOrCreate(['slug' => 'usmle'], [
            'name' => 'USMLE',
            'full_name' => 'United States Medical Licensing Examination',
            'country' => 'United States',
            'flag_emoji' => '🇺🇸',
            'description' => 'United States Medical Licensing Exam preparation.',
            'accent_color' => '#B91C1C',
            'config' => ProgrammeConfig::usmleDefaults(),
            'status' => 'published',
            'sort_order' => 2,
        ]);

        $subjects = $this->seedSubjects($programme, [
            ['Internal Medicine', 'stethoscope', '#EF4444'],
            ['Surgery', 'scalpel', '#14B8A6'],
            ['Pediatrics', 'baby', '#3B82F6'],
            ['Pharmacology', 'pill', '#F59E0B'],
            ['Pathology', 'microscope', '#A855F7'],
        ]);

        // Build the 14x20=280 full mock from configuration (nothing hard-coded in app code).
        $cfg = $programme->config['full_mock'];

        $exam = Exam::updateOrCreate(
            ['exam_programme_id' => $programme->id, 'type' => Exam::TYPE_FULL_MOCK],
            [
                'title' => 'USMLE Full Mock Examination',
                'description' => '14 blocks × 20 questions = 280 questions. 30-minute active timer per block.',
                'block_count' => $cfg['blocks'],
                'questions_per_block' => $cfg['questions_per_block'],
                'block_duration_minutes' => $cfg['block_duration_minutes'],
                'block_release_interval_minutes' => $cfg['block_release_interval_minutes'],
                'block_release_mode' => $cfg['block_release_mode'],
                'randomize_block_order' => $cfg['randomize_block_order'],
                'randomize_questions' => $cfg['randomize_questions'],
                'randomize_options' => $cfg['randomize_options'],
                'result_visibility' => $cfg['result_visibility'],
                'allow_retry' => true,
                'require_unique_questions' => true,
                'status' => 'published',
            ]
        );

        // Only generate the full 280-question structure once.
        if ($exam->blocks()->count() === 0) {
            for ($b = 1; $b <= $cfg['blocks']; $b++) {
                $block = ExamBlock::create([
                    'exam_id' => $exam->id,
                    'logical_number' => $b,
                    'label' => "Block {$b}",
                ]);

                $questionIds = [];
                for ($q = 1; $q <= $cfg['questions_per_block']; $q++) {
                    $question = $this->makeQuestion(
                        $programme, $subjects->random(), $author,
                        "USMLE Block {$b} Q{$q}"
                    );
                    $questionIds[$question->id] = ['canonical_position' => $q];
                }
                $block->questions()->attach($questionIds);
            }
        }

        return $programme;
    }

    private function seedFmge(User $author): ExamProgramme
    {
        $programme = ExamProgramme::updateOrCreate(['slug' => 'fmge'], [
            'name' => 'FMGE',
            'full_name' => 'Foreign Medical Graduate Examination',
            'country' => 'India',
            'flag_emoji' => '🇮🇳',
            'description' => 'Foreign Medical Graduate Examination preparation.',
            'accent_color' => '#2563EB',
            'config' => ProgrammeConfig::fmgeDefaults(),
            'status' => 'published',
            'sort_order' => 1,
        ]);

        $subjects = $this->seedSubjects($programme, [
            ['Anatomy', 'heart', '#EF4444'],
            ['Physiology', 'activity', '#3B82F6'],
            ['Biochemistry', 'flask-conical', '#10B981'],
            ['Pathology', 'microscope', '#A855F7'],
            ['Pharmacology', 'pill', '#F59E0B'],
            ['Microbiology', 'bug', '#8B5CF6'],
            ['Medicine', 'user', '#06B6D4'],
            ['Surgery', 'scalpel', '#14B8A6'],
            ['Community Medicine', 'users', '#F97316'],
        ]);

        $author = User::where('role', User::ROLE_ADMIN)->first();

        // Seed an active question bank for daily practice + level mocks.
        // (A demo-sized bank; real content is added by admins via CSV/XLSX import.)
        $bankTarget = 300;
        $have = $programme->questions()->count();
        for ($i = $have + 1; $i <= $bankTarget; $i++) {
            $this->makeQuestion($programme, $subjects->random(), $author, "FMGE Bank Q{$i}");
        }

        // Daily-practice plan: 14 days × 10 questions (configurable; §6).
        Exam::updateOrCreate(
            ['exam_programme_id' => $programme->id, 'type' => Exam::TYPE_DAILY_PRACTICE],
            [
                'title' => 'FMGE Daily Practice',
                'description' => '10 questions every day. Build your streak and track accuracy.',
                'block_count' => 1,
                'questions_per_block' => 10,
                'block_duration_minutes' => 15,
                'block_release_interval_minutes' => 0,
                'plan_days' => 14,
                'questions_per_day' => 10,
                'timer_enabled' => false,
                'allow_retry' => true,
                'result_visibility' => 'immediate', // practice reveals explanations
                'randomize_options' => true,
                'status' => 'published',
            ]
        );

        $this->seedFmgeLevelMocks($programme, $author);

        return $programme;
    }

    /**
     * §6 — six level mocks. The real size is 300 questions (configurable); the
     * seed builds a demo-sized 50-question mock per level so all six are
     * playable without generating 1,800 rows. Admins resize/populate via import.
     */
    private function seedFmgeLevelMocks(ExamProgramme $programme, User $author): void
    {
        $config = $programme->configuration();
        $levels = (int) $config->get('levels', 6);
        $durationPerLevel = (int) $config->get('level_mock_duration_minutes', 180);
        $demoSize = 50;

        $bank = $programme->questions()->where('status', 'active')->pluck('id')->all();

        for ($lvl = 1; $lvl <= $levels; $lvl++) {
            $exam = Exam::updateOrCreate(
                ['exam_programme_id' => $programme->id, 'type' => Exam::TYPE_LEVEL_MOCK, 'level' => $lvl],
                [
                    'title' => "FMGE Level {$lvl} Mock",
                    'description' => "Full-length level {$lvl} mock. Pass to unlock the next level.",
                    'block_count' => 1,
                    'questions_per_block' => $demoSize,
                    'block_duration_minutes' => $durationPerLevel,
                    'block_release_interval_minutes' => 0,
                    'randomize_questions' => true,
                    'randomize_options' => true,
                    'allow_retry' => true,
                    'result_visibility' => 'after_exam',
                    'status' => 'published',
                ]
            );

            if ($exam->blocks()->count() === 0 && count($bank) >= $demoSize) {
                $block = ExamBlock::create([
                    'exam_id' => $exam->id,
                    'logical_number' => 1,
                    'label' => "Level {$lvl}",
                ]);
                // Draw a distinct 50-question slice per level where the bank allows.
                $offset = (($lvl - 1) * $demoSize) % max(1, count($bank) - $demoSize + 1);
                $slice = array_slice($bank, $offset, $demoSize);
                $attach = [];
                foreach ($slice as $pos => $qid) {
                    $attach[$qid] = ['canonical_position' => $pos + 1];
                }
                $block->questions()->attach($attach);
            }
        }
    }

    private function seedSubjects(ExamProgramme $programme, array $defs)
    {
        $subjects = collect();
        foreach ($defs as $i => [$name, $icon, $color]) {
            $subjects->push(Subject::updateOrCreate(
                ['exam_programme_id' => $programme->id, 'slug' => Str::slug($name)],
                ['name' => $name, 'icon' => $icon, 'color' => $color, 'sort_order' => $i]
            ));
        }

        return $subjects;
    }

    private function makeQuestion(ExamProgramme $programme, Subject $subject, User $author, string $tag): Question
    {
        $question = Question::create([
            'exam_programme_id' => $programme->id,
            'subject_id' => $subject->id,
            'author_id' => $author->id,
            'stem' => "A 25-year-old male presents with fever, weight loss and night sweats. Chest X-ray shows upper lobe infiltrates with cavitation. The most likely causative organism is? [{$tag}]",
            'difficulty' => ['easy', 'medium', 'hard'][random_int(0, 2)],
            'explanation' => 'Chronic fever, weight loss, night sweats and upper-lobe cavitary lesions are classic for pulmonary tuberculosis caused by Mycobacterium tuberculosis.',
            'key_points' => [
                'Pulmonary TB commonly presents with chronic cough, fever, weight loss and hemoptysis.',
                'Upper lobe predilection with cavitation is characteristic.',
                'Diagnosis confirmed by sputum AFB smear, culture or GeneXpert (CBNAAT).',
                'Treatment: first-line anti-tubercular therapy (HRZE).',
            ],
            'high_yield_fact' => 'Reactivation TB commonly affects the apical segments of upper lobes due to higher oxygen tension.',
            'status' => 'active',
        ]);

        $options = [
            ['Mycobacterium tuberculosis', true],
            ['Streptococcus pneumoniae', false],
            ['Klebsiella pneumoniae', false],
            ['Staphylococcus aureus', false],
        ];
        foreach ($options as $i => [$text, $correct]) {
            QuestionOption::create([
                'question_id' => $question->id,
                'text' => $text,
                'is_correct' => $correct,
                'canonical_order' => $i,
            ]);
        }

        return $question;
    }
}
