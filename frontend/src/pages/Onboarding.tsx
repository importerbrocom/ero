import { Link, useNavigate } from 'react-router-dom'
import { Mail, ClipboardList, BarChart3, BookOpen, TrendingUp, ChevronRight, Apple } from 'lucide-react'
import { EroLogo } from '../components/EroLogo'

/**
 * Onboarding / splash screen (reference screenshot 7).
 * Dark globe + doctor atmosphere, headline, six exam country tiles, four feature
 * icons, Sign In / Google / Apple actions, Create Account, "By Amarizz" tagline.
 */
const EXAM_TILES = [
  { flag: '🇮🇳', name: 'FMGE', region: 'India' },
  { flag: '🇺🇸', name: 'USMLE', region: 'United States' },
  { flag: '🇬🇧', name: 'PLAB', region: 'United Kingdom' },
  { flag: '🇦🇺', name: 'AMC', region: 'Australia' },
  { flag: '🇷🇺', name: 'Russian', region: 'Language Exam' },
  { flag: '🇻🇳', name: 'Vietnamese', region: 'Exam' },
]

const FEATURES = [
  { icon: ClipboardList, label: 'Daily Practice', grad: 'ero-grad-primary' },
  { icon: BarChart3, label: 'Mock Tests', grad: 'ero-grad-purple' },
  { icon: BookOpen, label: 'Previous Papers', grad: 'ero-grad-success' },
  { icon: TrendingUp, label: 'Track Progress', grad: 'ero-grad-amber' },
]

export default function Onboarding() {
  const navigate = useNavigate()

  return (
    <div className="relative min-h-screen overflow-hidden bg-ero-bg">
      {/* Atmospheric globe glow (right side), matching the reference mood */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-[-20%] top-[-10%] h-[70vh] w-[70vh] rounded-full bg-ero-primary/20 blur-[120px]" />
        <div className="absolute left-[-10%] bottom-[-10%] h-[50vh] w-[50vh] rounded-full bg-ero-accent/15 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col px-5 py-8">
        {/* Skip */}
        <div className="flex justify-end">
          <Link to="/login" className="flex items-center gap-1 text-sm text-ero-muted hover:text-ero-text">
            Skip <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Brand + headline */}
        <div className="mt-6">
          <EroLogo size="lg" />
          <h1 className="mt-6 text-3xl font-extrabold leading-tight text-white md:text-4xl">
            Global Exams.
            <br />
            <span className="text-ero-primary-400">Greater</span> Opportunities.
          </h1>
          <p className="mt-2 text-ero-muted">
            Your complete platform for medical exam preparation.
          </p>
        </div>

        {/* Exam country tiles */}
        <div className="mt-6 grid grid-cols-3 gap-2.5">
          {EXAM_TILES.map((t) => (
            <div
              key={t.name}
              className="flex flex-col items-center gap-1 rounded-xl border border-ero-border bg-ero-card/80 px-2 py-3 text-center"
            >
              <span className="text-2xl leading-none">{t.flag}</span>
              <span className="text-sm font-bold text-white">{t.name}</span>
              <span className="text-[10px] text-ero-faint">{t.region}</span>
            </div>
          ))}
        </div>

        {/* Feature icons */}
        <div className="mt-6 grid grid-cols-4 gap-3">
          {FEATURES.map((f) => (
            <div key={f.label} className="flex flex-col items-center gap-1.5 text-center">
              <span className={`${f.grad} flex h-12 w-12 items-center justify-center rounded-full text-white`}>
                <f.icon className="h-5 w-5" />
              </span>
              <span className="text-[11px] leading-tight text-ero-muted">{f.label}</span>
            </div>
          ))}
        </div>

        {/* Auth actions */}
        <div className="mt-8 space-y-3">
          <button
            onClick={() => navigate('/login')}
            className="ero-grad-primary ero-glow-primary flex w-full items-center justify-between rounded-xl px-5 py-4 font-semibold text-white"
          >
            <span className="flex items-center gap-2">
              <Mail className="h-5 w-5" /> Sign In with Email
            </span>
            <ChevronRight className="h-5 w-5" />
          </button>

          <button
            disabled
            className="flex w-full items-center justify-between rounded-xl border border-ero-border bg-ero-card px-5 py-4 font-semibold text-ero-text opacity-80"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm font-bold text-[#4285F4]">G</span>
              Continue with Google
            </span>
            <ChevronRight className="h-5 w-5 text-ero-faint" />
          </button>

          <button
            disabled
            className="flex w-full items-center justify-between rounded-xl border border-ero-border bg-ero-card px-5 py-4 font-semibold text-ero-text opacity-80"
          >
            <span className="flex items-center gap-3">
              <Apple className="h-5 w-5" fill="currentColor" />
              Continue with Apple
            </span>
            <ChevronRight className="h-5 w-5 text-ero-faint" />
          </button>
        </div>

        <p className="mt-5 text-center text-sm text-ero-muted">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-ero-primary-400">
            Create Account
          </Link>
        </p>

        <div className="mt-auto pt-8 text-center">
          <p className="text-ero-muted">
            By <span className="font-semibold text-ero-text">Amarizz</span>
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-ero-faint">
            "Better Doctors, Brighter Futures."
          </p>
        </div>
      </div>
    </div>
  )
}
