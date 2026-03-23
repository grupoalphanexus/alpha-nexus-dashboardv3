'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'
import type { Attendant } from '@/types'

type FormType = {
  name: string
  src_key: string
  commission_type: 'percent' | 'fixed'
  commission_value: number
  bonus: number
}

const EMPTY: FormType = { name: '', src_key: '', commission_type: 'percent', commission_value: 0, bonus: 0 }

export default function AttendantsPage() {
  const supabase = createClient()
  const [attendants, setAttendants] = useState<Attendant[]>([])
  const [form, setForm] = useState<FormType>(EMPTY)
  const [editing, setEditing] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('attendants').select('*').order('name')
    setAttendants(data || [])
  }

  async function save() {
    if (!form.name || !form.src_key) return toast.error('Nome e Chave (src) são obrigatórios')
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (editing) {
        const { error } = await supabase.from('attendants').update({ ...form }).eq('id', editing)
        if (error) throw error
        toast.success('Atendente atualizada!')
      } else {
        const { error } = await supabase.from('attendants').insert({ ...form, user_id: user!.id })
        if (error) throw error
        toast.success('Atendente cadastrada!')
      }
      setForm(EMPTY); setEditing(null); setShowForm(false)
      await load()
    } catch (e: unknown) { toast.error((e as Error).message) }
    finally { setLoading(false) }
  }

  async function toggle(id: string, active: boolean) {
    await supabase.from('attendants').update({ active: !active }).eq('id', id)
    await load()
  }

  async function remove(id: string) {
    if (!confirm('Remover atendente?')) return
    await supabase.from('attendants').delete().eq('id', id)
    toast.success('Removida')
    await load()
  }

  function startEdit(a: Attendant) {
    setForm({ name: a.name, src_key: a.src_key, commission_type: a.commission_type, commission_value: a.commission_value, bonus: a.bonus })
    setEditing(a.id); setShowForm(true)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, letterSpacing: '-0.02em' }}>Atendentes</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 2 }}>Gerencie sua equipe e comissões</p>
        </div>
        <button className="btn-primary" onClick={() => { setForm(EMPTY); setEditing(null); setShowForm(true) }}>
          + Nova Atendente
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="glass-card animate-in" style={{ padding: 28, marginBottom: 24 }}>
          <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 24 }}>{editing ? 'Editar' : 'Nova'} Atendente</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Nome *</label>
              <input className="input" placeholder="Bruna Silva" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Chave src * <span style={{ color: 'var(--brand)', fontSize: 11 }}>(igual ao link: src=Bruna)</span></label>
              <input className="input" placeholder="Bruna" value={form.src_key} onChange={e => setForm(f => ({ ...f, src_key: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Tipo de comissão</label>
              <select className="input" value={form.commission_type} onChange={e => setForm(f => ({ ...f, commission_type: e.target.value as 'percent' | 'fixed' }))}>
                <option value="percent">Percentual (%)</option>
                <option value="fixed">Valor fixo (R$)</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                {form.commission_type === 'percent' ? 'Comissão (%)' : 'Comissão (R$)'}
              </label>
              <input className="input" type="number" step="0.01" placeholder="0" value={form.commission_value} onChange={e => setForm(f => ({ ...f, commission_value: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Bônus (R$)</label>
              <input className="input" type="number" step="0.01" placeholder="0" value={form.bonus} onChange={e => setForm(f => ({ ...f, bonus: parseFloat(e.target.value) || 0 }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <button className="btn-primary" onClick={save} disabled={loading}>{loading ? 'Salvando...' : editing ? 'Salvar alterações' : 'Cadastrar'}</button>
            <button className="btn-ghost" onClick={() => { setShowForm(false); setEditing(null); setForm(EMPTY) }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Lista */}
      {attendants.length === 0 ? (
        <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Nenhuma atendente cadastrada</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Cadastre as atendentes para ver o ranking e calcular comissões</p>
        </div>
      ) : (
        <div className="glass-card">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Nome', 'Chave (src)', 'Comissão', 'Bônus', 'Status', 'Ações'].map(h => (
                  <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {attendants.map((a, i) => (
                <tr key={a.id} style={{ borderBottom: i < attendants.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--brand-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--brand)' }}>
                        {a.name.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{a.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <code style={{ fontSize: 12, background: 'rgba(97,114,243,0.1)', color: 'var(--brand-light)', padding: '3px 8px', borderRadius: 6 }}>src={a.src_key}</code>
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: 14 }}>
                    {a.commission_type === 'percent' ? `${a.commission_value}%` : formatCurrency(a.commission_value)}
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: 14, color: 'var(--success)' }}>
                    {a.bonus > 0 ? `+ ${formatCurrency(a.bonus)}` : '—'}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span className="badge" style={{ color: a.active ? 'var(--success)' : 'var(--danger)', background: a.active ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)' }}>
                      {a.active ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => startEdit(a)} className="btn-ghost" style={{ padding: '5px 12px', fontSize: 12 }}>Editar</button>
                      <button onClick={() => toggle(a.id, a.active)} className="btn-ghost" style={{ padding: '5px 12px', fontSize: 12 }}>{a.active ? 'Pausar' : 'Ativar'}</button>
                      <button onClick={() => remove(a.id)} style={{ padding: '5px 12px', fontSize: 12, background: 'rgba(248,113,113,0.1)', color: 'var(--danger)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>Remover</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
