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
import { ProfilePage, ProgressPage, SupportPage, TestsPage } from './pages/misc'

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
          <Route path="tests" element={<TestsPage />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="support" element={<SupportPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
