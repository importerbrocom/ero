<?php

namespace App\Services;

use App\Models\ExamProgramme;
use App\Models\Question;
use App\Models\QuestionImport;
use App\Models\QuestionOption;
use App\Models\Subject;
use App\Models\Topic;
use App\Imports\RawSheetImport;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Facades\Excel;

/**
 * CSV / XLSX question importer.
 *
 * Two-phase, as required by §6/§9:
 *   1) preview()  — parse + validate every row, return row-level errors and a
 *                   preview WITHOUT writing anything.
 *   2) commit()   — persist only valid rows inside a transaction.
 *
 * Expected columns (header row, case-insensitive):
 *   stem, option_a, option_b, option_c, option_d, [option_e, option_f...],
 *   correct, subject, [topic], [difficulty], [explanation], [image_url]
 *
 *   correct = the LETTER of the correct option (A/B/C/...). Internally this maps
 *   to the canonical QuestionOption.is_correct — never to a display position.
 */
class QuestionImporter
{
    private const REQUIRED = ['stem', 'option_a', 'option_b', 'correct', 'subject'];
    private const DIFFICULTIES = ['easy', 'medium', 'hard'];

    /** Parse + validate a file; store the preview on the import record. */
    public function preview(QuestionImport $import, string $path): QuestionImport
    {
        [$rows, $parseError] = $this->parse($path);

        if ($parseError) {
            $import->update([
                'status' => 'failed',
                'errors' => [['row' => 0, 'messages' => [$parseError]]],
            ]);
            return $import;
        }

        $errors = [];
        $preview = [];
        $valid = 0;

        foreach ($rows as $index => $row) {
            $rowNumber = $index + 2; // +1 for 0-index, +1 for header
            $messages = $this->validateRow($row);
            $parsed = $this->normaliseRow($row);

            if (empty($messages)) {
                $valid++;
            } else {
                $errors[] = ['row' => $rowNumber, 'messages' => $messages];
            }

            // Keep the preview reasonable in size.
            if (count($preview) < 50) {
                $preview[] = [
                    'row' => $rowNumber,
                    'valid' => empty($messages),
                    'stem' => Str::limit((string) ($parsed['stem'] ?? ''), 120),
                    'subject' => $parsed['subject'] ?? null,
                    'correct' => $parsed['correct'] ?? null,
                    'options' => $parsed['options'] ?? [],
                    'messages' => $messages,
                ];
            }
        }

        $import->update([
            'status' => 'previewed',
            'total_rows' => count($rows),
            'valid_rows' => $valid,
            'error_rows' => count($errors),
            'errors' => $errors,
            'preview' => $preview,
        ]);

        return $import;
    }

    /** Persist all valid rows. Invalid rows are skipped (reported in preview). */
    public function commit(QuestionImport $import, string $path, int $authorId): array
    {
        [$rows, $parseError] = $this->parse($path);
        if ($parseError) {
            $import->update(['status' => 'failed']);
            return ['imported' => 0, 'skipped' => 0, 'error' => $parseError];
        }

        $programme = ExamProgramme::findOrFail($import->exam_programme_id);
        $imported = 0;
        $skipped = 0;

        DB::transaction(function () use ($rows, $programme, $authorId, &$imported, &$skipped) {
            foreach ($rows as $row) {
                if (! empty($this->validateRow($row))) {
                    $skipped++;
                    continue;
                }

                $parsed = $this->normaliseRow($row);
                $subject = $this->resolveSubject($programme, $parsed['subject']);
                $topic = $parsed['topic']
                    ? $this->resolveTopic($subject, $parsed['topic'])
                    : null;

                $question = Question::create([
                    'exam_programme_id' => $programme->id,
                    'subject_id' => $subject->id,
                    'topic_id' => $topic?->id,
                    'author_id' => $authorId,
                    'stem' => $parsed['stem'],
                    'difficulty' => $parsed['difficulty'] ?? 'medium',
                    'explanation' => $parsed['explanation'] ?? null,
                    'image_url' => $parsed['image_url'] ?? null,
                    'status' => 'active',
                ]);

                $correctIndex = $this->letterToIndex($parsed['correct']);
                foreach ($parsed['options'] as $i => $text) {
                    QuestionOption::create([
                        'question_id' => $question->id,
                        'text' => $text,
                        'is_correct' => $i === $correctIndex,
                        'canonical_order' => $i,
                    ]);
                }
                $imported++;
            }
        });

        $import->update(['status' => 'committed', 'valid_rows' => $imported, 'error_rows' => $skipped]);

        return ['imported' => $imported, 'skipped' => $skipped];
    }

    // ---- parsing & validation ----

    /** @return array{0: array<int,array<string,mixed>>, 1: ?string} */
    private function parse(string $path): array
    {
        try {
            $sheets = Excel::toArray(new RawSheetImport(), $path);
            $sheet = $sheets[0] ?? [];
            if (count($sheet) < 2) {
                return [[], 'File is empty or has no data rows below the header.'];
            }

            $headers = array_map(
                fn ($h) => Str::of((string) $h)->trim()->lower()->replace(' ', '_')->toString(),
                $sheet[0],
            );

            $rows = [];
            foreach (array_slice($sheet, 1) as $line) {
                // Skip fully-empty lines.
                if (count(array_filter($line, fn ($v) => $v !== null && $v !== '')) === 0) {
                    continue;
                }
                $assoc = [];
                foreach ($headers as $i => $key) {
                    if ($key !== '') {
                        $assoc[$key] = $line[$i] ?? null;
                    }
                }
                $rows[] = $assoc;
            }

            return [$rows, null];
        } catch (\Throwable $e) {
            return [[], 'Could not read the file: '.$e->getMessage()];
        }
    }

    private function validateRow(array $row): array
    {
        $messages = [];

        foreach (self::REQUIRED as $col) {
            if (blank($row[$col] ?? null)) {
                $messages[] = "Missing required column: {$col}.";
            }
        }

        $options = $this->extractOptions($row);
        if (count($options) < 2) {
            $messages[] = 'At least two answer options are required.';
        }

        $correct = Str::upper(trim((string) ($row['correct'] ?? '')));
        if ($correct === '') {
            $messages[] = 'Missing correct-answer letter.';
        } elseif (! ctype_alpha($correct) || strlen($correct) !== 1) {
            $messages[] = "Correct answer must be a single letter (e.g. A). Got '{$correct}'.";
        } else {
            $idx = $this->letterToIndex($correct);
            if ($idx < 0 || $idx >= count($options)) {
                $messages[] = "Correct letter '{$correct}' has no matching option.";
            }
        }

        $difficulty = Str::lower(trim((string) ($row['difficulty'] ?? 'medium')));
        if ($difficulty !== '' && ! in_array($difficulty, self::DIFFICULTIES, true)) {
            $messages[] = "Difficulty must be one of: ".implode(', ', self::DIFFICULTIES).".";
        }

        return $messages;
    }

    private function normaliseRow(array $row): array
    {
        return [
            'stem' => trim((string) ($row['stem'] ?? '')),
            'subject' => trim((string) ($row['subject'] ?? '')),
            'topic' => trim((string) ($row['topic'] ?? '')) ?: null,
            'difficulty' => Str::lower(trim((string) ($row['difficulty'] ?? 'medium'))) ?: 'medium',
            'explanation' => trim((string) ($row['explanation'] ?? '')) ?: null,
            'image_url' => trim((string) ($row['image_url'] ?? '')) ?: null,
            'correct' => Str::upper(trim((string) ($row['correct'] ?? ''))),
            'options' => $this->extractOptions($row),
        ];
    }

    /** Collect option_a, option_b, ... in order, dropping blanks at the end. */
    private function extractOptions(array $row): array
    {
        $options = [];
        foreach (range('a', 'z') as $letter) {
            $key = "option_{$letter}";
            if (array_key_exists($key, $row) && ! blank($row[$key])) {
                $options[] = trim((string) $row[$key]);
            }
        }
        return $options;
    }

    private function letterToIndex(string $letter): int
    {
        return ord(Str::upper($letter)) - ord('A');
    }

    private function resolveSubject(ExamProgramme $programme, string $name): Subject
    {
        return Subject::firstOrCreate(
            ['exam_programme_id' => $programme->id, 'slug' => Str::slug($name)],
            ['name' => $name],
        );
    }

    private function resolveTopic(Subject $subject, string $name): Topic
    {
        return Topic::firstOrCreate(
            ['subject_id' => $subject->id, 'slug' => Str::slug($name)],
            ['name' => $name],
        );
    }
}
