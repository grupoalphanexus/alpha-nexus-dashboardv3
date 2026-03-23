'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const navItems = [
  { href: '/dashboard',           icon: GridIcon,       label: 'Dashboard' },
  { href: '/dashboard/connect',   icon: LinkIcon,       label: 'Integrações' },
  { href: '/dashboard/attendants',icon: UsersIcon,      label: 'Atendentes' },
  { href: '/dashboard/cashflow',  icon: WalletIcon,     label: 'Fluxo de Caixa' },
  { href: '/dashboard/logs',      icon: ActivityIcon,   label: 'Logs Webhook' },
  { href: '/dashboard/settings',  icon: SettingsIcon,   label: 'Configurações' },
]

interface SidebarProps {
  user: { name: string; avatar?: string | null; email: string }
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function logout() {
    await supabase.auth.signOut()
    toast.success('Até logo!')
    router.push('/auth/login')
  }

  return (
    <aside style={{
      position: 'fixed', left: 0, top: 0, bottom: 0, width: 240,
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, #6172f3 0%, #8098fb 100%)',
            borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(97,114,243,0.35)',
            flexShrink: 0,
          }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 15, letterSpacing: '-0.01em', lineHeight: 1.2 }}>
              Alpha<span style={{ color: 'var(--brand)' }}>Nexus</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Dashboard</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link key={href} href={href} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 10,
              color: active ? '#fff' : 'var(--text-secondary)',
              background: active ? 'var(--brand-dim)' : 'transparent',
              fontWeight: active ? 600 : 400, fontSize: 14,
              textDecoration: 'none',
              transition: 'all 0.15s',
              borderLeft: active ? '2px solid var(--brand)' : '2px solid transparent',
            }}
            onMouseEnter={e => { if (!active) (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.04)' }}
            onMouseLeave={e => { if (!active) (e.currentTarget as HTMLAnchorElement).style.background = 'transparent' }}
            >
              <Icon size={16} color={active ? 'var(--brand-light)' : undefined} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10 }}>
          {user.avatar ? (
            <img src={user.avatar} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--brand-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, color: 'var(--brand-light)',
            }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
          </div>
        </div>
        <button onClick={logout} className="btn-ghost" style={{ width: '100%', marginTop: 8, justifyContent: 'center', fontSize: 13, padding: '8px 12px' }}>
          <LogoutIcon size={14} /> Sair
        </button>
      </div>
    </aside>
  )
}

// ---- Ícones inline ----
function GridIcon({ size = 18, color }: { size?: number; color?: string }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke={color || 'currentColor'} strokeWidth="1.8"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke={color || 'currentColor'} strokeWidth="1.8"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke={color || 'currentColor'} strokeWidth="1.8"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke={color || 'currentColor'} strokeWidth="1.8"/></svg>
}
function LinkIcon({ size = 18, color }: { size?: number; color?: string }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke={color || 'currentColor'} strokeWidth="1.8" strokeLinecap="round"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke={color || 'currentColor'} strokeWidth="1.8" strokeLinecap="round"/></svg>
}
function UsersIcon({ size = 18, color }: { size?: number; color?: string }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke={color || 'currentColor'} strokeWidth="1.8" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke={color || 'currentColor'} strokeWidth="1.8"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke={color || 'currentColor'} strokeWidth="1.8" strokeLinecap="round"/></svg>
}
function WalletIcon({ size = 18, color }: { size?: number; color?: string }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><path d="M20 12V8a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-4" stroke={color || 'currentColor'} strokeWidth="1.8" strokeLinecap="round"/><path d="M20 12h-4a2 2 0 000 4h4v-4z" stroke={color || 'currentColor'} strokeWidth="1.8" strokeLinecap="round"/></svg>
}
function ActivityIcon({ size = 18, color }: { size?: number; color?: string }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke={color || 'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function SettingsIcon({ size = 18, color }: { size?: number; color?: string }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" stroke={color || 'currentColor'} strokeWidth="1.8"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke={color || 'currentColor'} strokeWidth="1.8"/></svg>
}
function LogoutIcon({ size = 18, color }: { size?: number; color?: string }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke={color || 'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
