'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function SettingsPage() {
  const supabase = createClient()
  const [taxMultiplier, setTaxMultiplier] = useState('1.1383')
  const [timezone, setTimezone] = useState('America/Sao_Paulo')
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState({ full_name: '', email: '' })

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: s } = await supabase.from('settings').select('*').eq('user_id', user.id).single()
    const { data: p } = await supabase.from('profiles').select('full_name, email').eq('id', user.id).single()
    if (s) { setTaxMultiplier(String(s.meta_tax_multiplier)); setTimezone(s.timezone) }
    if (p) setProfile(p)
  }

  async function save() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('settings').update({
        meta_tax_multiplier: parseFloat(taxMultiplier), timezone,
      }).eq('user_id', user!.id)
      if (error) throw error
      toast.success('Configurações salvas!')
    } catch (e: unknown) { toast.error((e as Error).message) }
    finally { setLoading(false) }
  }

  async function logout() {
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, letterSpacing: '-0.02em' }}>Configurações</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 2 }}>Ajuste os parâmetros do seu dashboard</p>
      </div>

      {/* Perfil */}
      <div className="glass-card" style={{ padding: 28, marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Conta</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--brand-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: 'var(--brand)' }}>
            {profile.full_name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{profile.full_name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{profile.email}</div>
          </div>
        </div>
        <button onClick={logout} className="btn-ghost" style={{ marginTop: 20 }}>Sair da conta</button>
      </div>

      {/* Configurações de cálculo */}
      <div className="glass-card" style={{ padding: 28, marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Cálculos financeiros</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>Esses valores afetam todos os cálculos do dashboard</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Multiplicador de imposto da Meta</label>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
              Valor gasto × multiplicador = custo real (padrão: 1.1383)<br/>
              Fórmula: 1 + (taxa_imposto / 100)
            </p>
            <input className="input" type="number" step="0.0001" min="1" max="2" value={taxMultiplier} onChange={e => setTaxMultiplier(e.target.value)} style={{ maxWidth: 200 }} />
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
              Atual: {((parseFloat(taxMultiplier) - 1) * 100).toFixed(2)}% de imposto
            </div>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Fuso horário</label>
            <select className="input" value={timezone} onChange={e => setTimezone(e.target.value)} style={{ maxWidth: 280 }}>
              <option value="America/Sao_Paulo">São Paulo (UTC-3)</option>
              <option value="America/Manaus">Manaus (UTC-4)</option>
              <option value="America/Fortaleza">Fortaleza (UTC-3)</option>
              <option value="America/Belem">Belém (UTC-3)</option>
              <option value="America/Recife">Recife (UTC-3)</option>
            </select>
          </div>
        </div>

        <button className="btn-primary" onClick={save} disabled={loading} style={{ marginTop: 24 }}>
          {loading ? 'Salvando...' : 'Salvar configurações'}
        </button>
      </div>

      {/* Info do sistema */}
      <div className="glass-card" style={{ padding: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Sobre o AlphaNexus</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { k: 'Versão', v: '1.0.0' },
            { k: 'Stack', v: 'Next.js 14 + Supabase + Vercel' },
            { k: 'Banco', v: 'PostgreSQL (Supabase)' },
            { k: 'Auth', v: 'Supabase Auth (Google OAuth)' },
            { k: 'Webhook Braip', v: 'STATUS_ALTERADO + TRACKING_*' },
          ].map(row => (
            <div key={row.k} style={{ display: 'flex', gap: 12, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 120 }}>{row.k}</span>
              <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{row.v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
