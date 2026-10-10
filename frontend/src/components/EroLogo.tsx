import { GraduationCap } from 'lucide-react'

/**
 * ERO brand mark.
 *
 * NOTE: This is a REPLACEABLE placeholder logo per the brief — the official ERO
 * logo asset will be supplied separately. To swap it, drop the asset in
 * /public and point `logoSrc` at it (or set VITE_ERO_LOGO_URL). Until then we
 * render the wordmark seen in the screenshots: a blue graduation-cap + "ERO" +
 * tagline "Medical Learning Without Borders".
 */
const logoSrc = import.meta.env.VITE_ERO_LOGO_URL as string | undefined

export function EroLogo({
  size = 'md',
  showTagline = true,
}: {
  size?: 'sm' | 'md' | 'lg'
  showTagline?: boolean
}) {
  const dims = {
    sm: { icon: 20, title: 'text-lg', tag: 'text-[9px]' },
    md: { icon: 26, title: 'text-2xl', tag: 'text-[10px]' },
    lg: { icon: 40, title: 'text-4xl', tag: 'text-xs' },
  }[size]

  return (
    <div className="flex items-center gap-2.5 select-none">
      {logoSrc ? (
        <img src={logoSrc} alt="ERO" style={{ height: dims.icon * 1.4 }} />
      ) : (
        <div
          className="flex items-center justify-center rounded-xl bg-gradient-to-br from-ero-primary-400 to-ero-accent"
          style={{ width: dims.icon * 1.5, height: dims.icon * 1.5 }}
        >
          <GraduationCap size={dims.icon} className="text-white" />
        </div>
      )}
      <div className="leading-tight">
        <div className={`font-extrabold tracking-wide ${dims.title}`}>
          <span className="text-white">E</span>
          <span className="text-ero-primary-400">R</span>
          <span className="text-white">O</span>
        </div>
        {showTagline && (
          <div className={`font-medium uppercase tracking-[0.18em] text-ero-muted ${dims.tag}`}>
            Medical Learning Without Borders
          </div>
        )}
      </div>
    </div>
  )
}
