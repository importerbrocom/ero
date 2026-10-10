import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  BarChart3,
  User,
  LogOut,
  LifeBuoy,
  Bell,
  ClipboardList,
} from 'lucide-react'
import { clsx } from 'clsx'
import { EroLogo } from './EroLogo'
import { useAuth } from '../store/auth'

const nav = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/exams', label: 'Exams', icon: BookOpen },
  { to: '/app/tests', label: 'Tests', icon: ClipboardList },
  { to: '/app/progress', label: 'Progress', icon: BarChart3 },
  { to: '/app/profile', label: 'Profile', icon: User },
]

export function AppShell() {
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)
  const navigate = useNavigate()

  const doLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-ero-bg md:flex">
      {/* Desktop sidebar (screenshot 9) */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-ero-border bg-ero-bg-2 md:flex">
        <div className="px-5 py-6">
          <EroLogo size="sm" />
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
                  isActive
                    ? 'bg-ero-primary text-white'
                    : 'text-ero-muted hover:bg-white/5 hover:text-ero-text',
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
          <NavLink
            to="/app/support"
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                isActive ? 'bg-ero-primary text-white' : 'text-ero-muted hover:bg-white/5 hover:text-ero-text',
              )
            }
          >
            <LifeBuoy className="h-5 w-5" />
            Help &amp; Support
          </NavLink>
        </nav>
        <div className="border-t border-ero-border p-3">
          <button
            onClick={doLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-ero-danger hover:bg-ero-danger/10"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-h-screen flex-1 flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b border-ero-border bg-ero-bg-2/60 px-4 py-3 backdrop-blur md:px-8">
          <div className="md:hidden">
            <EroLogo size="sm" showTagline={false} />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button className="relative rounded-full p-2 text-ero-muted hover:bg-white/5">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-ero-danger" />
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-ero-primary-400 to-ero-accent text-sm font-bold">
                {user?.name?.[0] ?? 'U'}
              </div>
              <div className="hidden text-sm sm:block">
                <div className="font-semibold leading-tight">{user?.name}</div>
                <div className="text-xs capitalize text-ero-muted">{user?.role?.replace('_', ' ')}</div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 pb-24 md:px-8 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom tab bar (screenshots 1,2,4) */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-ero-border bg-ero-bg-2/95 backdrop-blur md:hidden">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              clsx(
                'flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium',
                isActive ? 'text-ero-primary-400' : 'text-ero-muted',
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
