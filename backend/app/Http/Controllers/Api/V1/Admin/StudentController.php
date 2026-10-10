<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\ExamProgramme;
use App\Models\User;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    public function index(Request $request)
    {
        $query = User::where('role', 'student')->withCount('attempts');

        if ($search = $request->query('search')) {
            $query->where(fn ($q) => $q
                ->where('name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%"));
        }
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $students = $query->latest()->paginate(20);

        return response()->json([
            'data' => $students->items(),
            'meta' => [
                'current_page' => $students->currentPage(),
                'last_page' => $students->lastPage(),
                'total' => $students->total(),
            ],
        ]);
    }

    public function show(User $student)
    {
        abort_unless($student->role === 'student', 404);

        $student->load([
            'programmeAccess.programme:id,name,slug',
            'attempts' => fn ($q) => $q->latest()->limit(20)->with('exam:id,title'),
        ]);

        return response()->json(['data' => $student]);
    }

    /** Suspend / reactivate a student. */
    public function updateStatus(Request $request, User $student)
    {
        abort_unless($student->role === 'student', 404);
        $data = $request->validate(['status' => ['required', 'in:active,suspended']]);

        $student->update(['status' => $data['status']]);
        AuditLog::record('student.status_changed', $student, ['status' => $data['status']]);

        return response()->json(['data' => $student]);
    }

    /** Grant / revoke programme access from the admin side. */
    public function assignProgramme(Request $request, User $student)
    {
        abort_unless($student->role === 'student', 404);
        $data = $request->validate([
            'exam_programme_id' => ['required', 'exists:exam_programmes,id'],
            'action' => ['required', 'in:grant,revoke'],
        ]);

        if ($data['action'] === 'grant') {
            $student->programmeAccess()->updateOrCreate(
                ['exam_programme_id' => $data['exam_programme_id']],
                ['granted_via' => 'admin'],
            );
            AuditLog::record('student.programme_granted', $student, $data);
        } else {
            $student->programmeAccess()->where('exam_programme_id', $data['exam_programme_id'])->delete();
            AuditLog::record('student.programme_revoked', $student, $data);
        }

        return response()->json(['message' => 'Updated.']);
    }
}
