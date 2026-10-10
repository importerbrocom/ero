import { useEffect } from 'react'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from './store/auth'
import { AppShell } from './components/AppShell'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import ChooseExam from './pages/ChooseExam'
import ProgrammeDetail from './pages/ProgrammeDetail'
import ExamInstructions from './pages/ExamInstructions'
import ExamRunner from './pages/ExamRunner'
import Progress from './pages/Progress'
import Tests from './pages/Tests'
import DailyPractice from './pages/DailyPractice'
import PracticeDayRunner from './pages/PracticeDayRunner'
import { ProfilePage, SupportPage } from './pages/misc'
import { AdminShell } from './components/AdminShell'
import AdminOverview from './pages/admin/AdminOverview'
import AdminStudents from './pages/admin/AdminStudents'
import AdminQuestions from './pages/admin/AdminQuestions'
import AdminImport from './pages/admin/AdminImport'
import AdminProgrammes from './pages/admin/AdminProgrammes'
import AdminCodes from './pages/admin/AdminCodes'
import AdminAudit from './pages/admin/AdminAudit'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = useAuth((s) => s.user)
  const initialized = useAuth((s) => s.initialized)

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ero-bg text-ero-muted">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const user = useAuth((s) => s.user)
  const initialized = useAuth((s) => s.initialized)

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ero-bg text-ero-muted">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  // Client-side convenience only — the API enforces the real authorisation.
  if (user.role !== 'admin' && user.role !== 'super_admin') return <Navigate to="/app" replace />
  return <>{children}</>
}

export default function App() {
  const rehydrate = useAuth((s) => s.rehydrate)
  const user = useAuth((s) => s.user)

  useEffect(() => {
    rehydrate()
  }, [rehydrate])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/app" replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/app" replace /> : <Register />} />

        <Route
          path="/app"
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="exams" element={<ChooseExam />} />
          <Route path="programmes/:slug" element={<ProgrammeDetail />} />
          <Route path="exams/:examId/instructions" element={<ExamInstructions />} />
          <Route path="attempts/:attemptId" element={<ExamRunner />} />
          <Route path="exams/:examId/practice" element={<DailyPractice />} />
          <Route path="practice/:enrollmentId" element={<DailyPractice />} />
          <Route path="practice/:enrollmentId/day/:day" element={<PracticeDayRunner />} />
          <Route path="tests" element={<Tests />} />
          <Route path="progress" element={<Progress />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="support" element={<SupportPage />} />
        </Route>

        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminShell />
            </RequireAdmin>
          }
        >
          <Route index element={<AdminOverview />} />
          <Route path="students" element={<AdminStudents />} />
          <Route path="questions" element={<AdminQuestions />} />
          <Route path="import" element={<AdminImport />} />
          <Route path="programmes" element={<AdminProgrammes />} />
          <Route path="codes" element={<AdminCodes />} />
          <Route path="audit" element={<AdminAudit />} />
        </Route>

        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
