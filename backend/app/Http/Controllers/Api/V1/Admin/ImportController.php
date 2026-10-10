<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\QuestionImport;
use App\Services\QuestionImporter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ImportController extends Controller
{
    public function __construct(private QuestionImporter $importer)
    {
    }

    /** Upload a CSV/XLSX and get a validated preview WITHOUT committing. */
    public function preview(Request $request)
    {
        $data = $request->validate([
            'exam_programme_id' => ['required', 'exists:exam_programmes,id'],
            'file' => ['required', 'file', 'mimes:csv,txt,xlsx,xls', 'max:10240'],
        ]);

        // Store the upload so commit() can re-read exactly the same file.
        $path = $request->file('file')->store('imports');

        $import = QuestionImport::create([
            'exam_programme_id' => $data['exam_programme_id'],
            'created_by' => $request->user()->id,
            'filename' => $request->file('file')->getClientOriginalName(),
            'status' => 'pending',
        ]);

        $this->importer->preview($import, Storage::path($path));

        AuditLog::record('question_import.previewed', $import, ['filename' => $import->filename]);

        // stored_path is returned to the client (not persisted) and passed back
        // on commit so we re-read exactly the same uploaded file.
        return response()->json([
            'data' => array_merge($import->fresh()->toArray(), ['stored_path' => $path]),
        ]);
    }

    /** Commit a previously-previewed import (persists only valid rows). */
    public function commit(Request $request, QuestionImport $import)
    {
        $data = $request->validate([
            'stored_path' => ['required', 'string'],
        ]);

        abort_unless(Storage::exists($data['stored_path']), 422, 'Uploaded file is no longer available; please re-upload.');

        $result = $this->importer->commit($import, Storage::path($data['stored_path']), $request->user()->id);

        AuditLog::record('question_import.committed', $import, $result);

        // Clean up the temp upload.
        Storage::delete($data['stored_path']);

        return response()->json(['data' => $import->fresh(), 'result' => $result]);
    }

    public function index()
    {
        return response()->json([
            'data' => QuestionImport::with('programme:id,name')->latest()->limit(50)->get(),
        ]);
    }

    /** A downloadable CSV template so admins know the exact column format. */
    public function template()
    {
        $headers = 'stem,option_a,option_b,option_c,option_d,correct,subject,topic,difficulty,explanation,image_url';
        $example = '"A 25-year-old with fever and cavitary upper-lobe lesion. Cause?",'
            .'"Mycobacterium tuberculosis","Streptococcus pneumoniae","Klebsiella pneumoniae","Staphylococcus aureus",'
            .'A,"Internal Medicine","Infectious Disease",medium,"Classic reactivation TB.",';

        return response($headers."\n".$example, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="ero-question-template.csv"',
        ]);
    }
}
