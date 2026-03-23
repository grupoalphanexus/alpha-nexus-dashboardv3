'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Cashflow } from '@/types'

const CATEGORIES_IN = ['venda', 'comissao', 'reembolso', 'antecipado', 'outro']
const CATEGORIES_OUT = ['trafego', 'comissao_atendente', 'custo_fixo', 'produto', 'frete', 'imposto', 'outro']
const EMPTY = { type: 'entrada' as 'entrada' | 'saida', category: 'outro', description: '', amount: 0, reference_date: new Date().toISOString().split('T')[0], notes: '' }

export default function CashflowPage() {
  const supabase = createClient()
  const [items, setItems] = useState<Cashflow[]>([])
  const [form, setForm] = useState(EMPTY)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'entrada' | 'saida'>('all')

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('cashflow').select('*').order('reference_date', { ascending: false })
    setItems(data || [])
  }

  async function save() {
    if (!form.description || !form.amount) return toast.error('Preencha todos os campos')
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('cashflow').insert({ ...form, user_id: user!.id })
      if (error) throw error
      toast.success('Lançamento adicionado!')
      setForm(EMPTY); setShowForm(false)
      await load()
    } catch (e: unknown) { toast.error((e as Error).message) }
    finally { setLoading(false) }
  }

  async function remove(id: string) {
    if (!confirm('Remover este lançamento?')) return
    await supabase.from('cashflow').delete().eq('id', id)
    toast.success('Removido')
    await load()
  }

  const filtered = items.filter(i => filter === 'all' || i.type === filter)
  const totalIn = items.filter(i => i.type === 'entrada').reduce((a, i) => a + i.amount, 0)
  const totalOut = items.filter(i => i.type === 'saida').reduce((a, i) => a + i.amount, 0)
  const balance = totalIn - totalOut

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, letterSpacing: '-0.02em' }}>Fluxo de Caixa</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 2 }}>Entradas e saídas da operação</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>+ Novo Lançamento</button>
      </div>

      {/* Resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Entradas', value: totalIn, color: 'var(--success)' },
          { label: 'Total Saídas', value: totalOut, color: 'var(--danger)' },
          { label: 'Saldo', value: balance, color: balance >= 0 ? 'var(--success)' : 'var(--danger)' },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ padding: '20px 24px' }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>{s.label}</p>
            <p className="metric-value" style={{ fontSize: 26, color: s.color }}>{formatCurrency(s.value)}</p>
          </div>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div className="glass-card animate-in" style={{ padding: 28, marginBottom: 24 }}>
          <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 24 }}>Novo Lançamento</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Tipo</label>
              <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as 'entrada' | 'saida', category: 'outro' }))}>
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Categoria</label>
              <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {(form.type === 'entrada' ? CATEGORIES_IN : CATEGORIES_OUT).map(c => (
                  <option key={c} value={c}>{c.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Descrição *</label>
              <input className="input" placeholder="Descreva o lançamento" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Valor (R$) *</label>
              <input className="input" type="number" step="0.01" placeholder="0,00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Data de referência</label>
              <input className="input" type="date" value={form.reference_date} onChange={e => setForm(f => ({ ...f, reference_date: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Observações</label>
              <input className="input" placeholder="Opcional..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <button className="btn-primary" onClick={save} disabled={loading}>{loading ? 'Salvando...' : 'Adicionar'}</button>
            <button className="btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['all', 'entrada', 'saida'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '7px 16px', borderRadius: 8, border: '1px solid var(--border)',
            background: filter === f ? 'var(--brand)' : 'transparent',
            color: filter === f ? 'white' : 'var(--text-secondary)',
            cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', transition: 'all 0.15s',
          }}>
            {f === 'all' ? 'Todos' : f.charAt(0).toUpperCase() + f.slice(1)}s
          </button>
        ))}
      </div>

      {/* Tabela */}
      <div className="glass-card">
        {filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>💰</div>
            <p style={{ color: 'var(--text-secondary)' }}>Nenhum lançamento encontrado</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor', ''].map(h => (
                  <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => (
                <tr key={item.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '13px 20px', fontSize: 13, color: 'var(--text-muted)' }}>{formatDate(item.reference_date)}</td>
                  <td style={{ padding: '13px 20px', fontSize: 14, fontWeight: 500 }}>{item.description}</td>
                  <td style={{ padding: '13px 20px' }}>
                    <span className="badge" style={{ fontSize: 11, background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>{item.category}</span>
                  </td>
                  <td style={{ padding: '13px 20px' }}>
                    <span className="badge" style={{ color: item.type === 'entrada' ? 'var(--success)' : 'var(--danger)', background: item.type === 'entrada' ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)' }}>
                      {item.type === 'entrada' ? '↑ Entrada' : '↓ Saída'}
                    </span>
                  </td>
                  <td style={{ padding: '13px 20px', fontSize: 15, fontWeight: 700, color: item.type === 'entrada' ? 'var(--success)' : 'var(--danger)' }}>
                    {item.type === 'entrada' ? '+' : '-'} {formatCurrency(item.amount)}
                  </td>
                  <td style={{ padding: '13px 20px' }}>
                    {!item.is_auto && (
                      <button onClick={() => remove(item.id)} style={{ fontSize: 12, padding: '4px 10px', background: 'rgba(248,113,113,0.1)', color: 'var(--danger)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }}>Remover</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
