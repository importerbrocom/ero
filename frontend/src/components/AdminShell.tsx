import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  FileQuestion,
  Upload,
  BookMarked,
  KeyRound,
  ScrollText,
  Settings,
  LogOut,
} from 'lucide-react'
import { clsx } from 'clsx'
import { EroLogo } from './EroLogo'
import { useAuth } from '../store/auth'

const nav = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/students', label: 'Students', icon: Users },
  { to: '/admin/questions', label: 'Question Bank', icon: FileQuestion },
  { to: '/admin/import', label: 'Import Questions', icon: Upload },
  { to: '/admin/programmes', label: 'Programmes', icon: BookMarked },
  { to: '/admin/codes', label: 'Activation Codes', icon: KeyRound },
  { to: '/admin/audit', label: 'Audit Logs', icon: ScrollText },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

export function AdminShell() {
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-ero-bg md:flex">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-ero-border bg-ero-bg-2 md:flex">
        <div className="px-5 py-6">
          <EroLogo size="sm" showTagline={false} />
          <span className="mt-1 block text-xs font-semibold uppercase tracking-widest text-ero-accent">
            Admin Console
          </span>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                  isActive ? 'bg-ero-primary text-white' : 'text-ero-muted hover:bg-white/5 hover:text-ero-text',
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="space-y-1 border-t border-ero-border p-3">
          <NavLink to="/app" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-ero-muted hover:bg-white/5">
            ← Student view
          </NavLink>
          <button
            onClick={async () => {
              await logout()
              navigate('/login')
            }}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-ero-danger hover:bg-ero-danger/10"
          >
            <LogOut className="h-5 w-5" /> Sign Out
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-ero-border bg-ero-bg-2/60 px-4 py-3 backdrop-blur md:px-8">
          <div className="md:hidden">
            <EroLogo size="sm" showTagline={false} />
          </div>
          <div className="ml-auto flex items-center gap-2 text-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-ero-accent to-ero-primary-400 text-sm font-bold">
              {user?.name?.[0] ?? 'A'}
            </div>
            <div className="hidden sm:block">
              <div className="font-semibold leading-tight">{user?.name}</div>
              <div className="text-xs capitalize text-ero-muted">{user?.role?.replace('_', ' ')}</div>
            </div>
          </div>
        </header>

        {/* Mobile admin nav */}
        <nav className="flex gap-1 overflow-x-auto border-b border-ero-border bg-ero-bg-2 px-2 py-2 md:hidden">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                clsx(
                  'whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold',
                  isActive ? 'bg-ero-primary text-white' : 'text-ero-muted',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <main className="flex-1 px-4 py-6 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
