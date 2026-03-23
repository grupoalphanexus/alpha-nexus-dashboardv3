'use client'
import { useState, useEffect, useCallback } from 'react'
import { format, subDays } from 'date-fns'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import KpiCard from '@/components/dashboard/KpiCard'
import { formatCurrency, formatPercent, calcROI, getROIColor, getFrustrationColor, getCampaignScore } from '@/lib/utils'

interface Metrics {
  kpis: {
    total_commission: number; projected_commission: number; total_spend: number
    roi: number; roi_projected: number; cac: number; profit: number; profit_projected: number
    approved_count: number; scheduled_count: number; pending_count: number
    frustration_count: number; frustration_rate: number; total_transactions: number
  }
  daily_data: { date: string; commission: number; spend: number; sales: number }[]
  campaigns: { name: string; spend: number; commission: number; sales: number }[]
  attendants: { src: string; commission: number; sales: number; scheduled: number }[]
}

const PRESETS = [
  { label: 'Hoje', days: 0 },
  { label: '7 dias', days: 7 },
  { label: '14 dias', days: 14 },
  { label: '30 dias', days: 30 },
]

const CustomTooltip = ({ active, payload, label }: Record<string, unknown>) => {
  if (active && Array.isArray(payload) && payload.length) {
    return (
      <div style={{ background: '#1a1d2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 6 }}>{label as string}</p>
        {(payload as { color: string; name: string; value: number }[]).map((p, i) => (
          <p key={i} style={{ color: p.color, fontSize: 13, fontWeight: 600 }}>
            {p.name}: {p.name === 'Vendas' ? p.value : formatCurrency(p.value as number)}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [preset, setPreset] = useState(7)
  const [srcFilter, setSrcFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const to = format(new Date(), 'yyyy-MM-dd')
    const from = format(subDays(new Date(), preset), 'yyyy-MM-dd')
    const params = new URLSearchParams({ from, to })
    if (srcFilter) params.set('src', srcFilter)
    const res = await fetch(`/api/dashboard/metrics?${params}`)
    const data = await res.json()
    setMetrics(data)
    setLoading(false)
  }, [preset, srcFilter])

  useEffect(() => { load() }, [load])

  const kpis = metrics?.kpis
  const daily = metrics?.daily_data || []
  const campaigns = metrics?.campaigns || []
  const attendants = metrics?.attendants || []

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, letterSpacing: '-0.02em' }}>
            Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 2 }}>
            Visão geral das suas operações em tempo real
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Filtro de atendente */}
          <input
            className="input"
            placeholder="Filtrar por atendente (src)..."
            value={srcFilter}
            onChange={e => setSrcFilter(e.target.value)}
            style={{ width: 200 }}
          />
          {/* Presets de data */}
          <div style={{ display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
            {PRESETS.map(p => (
              <button key={p.days} onClick={() => setPreset(p.days)} style={{
                padding: '8px 14px', background: preset === p.days ? 'var(--brand)' : 'transparent',
                color: preset === p.days ? 'white' : 'var(--text-secondary)',
                border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}>
                {p.label}
              </button>
            ))}
          </div>
          <button onClick={load} className="btn-ghost" style={{ padding: '8px 14px' }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Atualizar
          </button>
        </div>
      </div>

      {/* KPIs principais — linha 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
        <KpiCard
          title="Comissão Real" value={loading ? '...' : formatCurrency(kpis?.total_commission || 0)}
          subtitle="Vendas aprovadas" color="var(--success)" loading={loading}
          tooltip={`Soma das comissões das vendas com status "Pagamento Aprovado".\nNão inclui agendadas nem pendentes.`}
          icon={<svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>}
        />
        <KpiCard
          title="Comissão Projetada" value={loading ? '...' : formatCurrency(kpis?.projected_commission || 0)}
          subtitle="Aprovadas + Agendadas" color="var(--brand)" loading={loading}
          tooltip={`Inclui comissões aprovadas + vendas agendadas (pay later).\nÉ o potencial real de recebimento do período.`}
          icon={<svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        />
        <KpiCard
          title="Investimento (c/ imposto)" value={loading ? '...' : formatCurrency(kpis?.total_spend || 0)}
          subtitle={`Multiplicador: 1.1383`} color="var(--warning)" loading={loading}
          tooltip={`Total gasto em Meta Ads com imposto aplicado.\nFórmula: Spend × 1.1383 (ajustável em Configurações)`}
          icon={<svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        />
        <KpiCard
          title="Lucro Líquido" value={loading ? '...' : formatCurrency(kpis?.profit || 0)}
          subtitle="Comissão − Investimento" color={(kpis?.profit || 0) >= 0 ? 'var(--success)' : 'var(--danger)'} loading={loading}
          tooltip={`Lucro = Comissão real − Investimento com imposto.\nValor negativo indica prejuízo no período.`}
          icon={<svg width="18" height="18" fill="none" viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><polyline points="17 6 23 6 23 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        />
      </div>

      {/* KPIs linha 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <KpiCard
          title="ROI Real" value={loading ? '...' : `${(kpis?.roi || 0).toFixed(2)}x`}
          subtitle="Baseado em aprovadas" color={getROIColor(kpis?.roi || 0)} loading={loading}
          tooltip={`ROI = Comissão aprovada ÷ Investimento.\n2x = para cada R$1 investido, recebeu R$2.\nAbaixo de 1x = prejuízo.`}
          icon={<svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M3 3v18h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M7 16l4-4 4 4 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        />
        <KpiCard
          title="ROI Projetado" value={loading ? '...' : `${(kpis?.roi_projected || 0).toFixed(2)}x`}
          subtitle="Incluindo agendadas" color={getROIColor(kpis?.roi_projected || 0)} loading={loading}
          tooltip={`ROI Projetado = Comissão projetada ÷ Investimento.\nConsidera as vendas agendadas que ainda serão pagas.`}
          icon={<svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M3 3v18h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M8 12l3-3 3 3 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        />
        <KpiCard
          title="CAC" value={loading ? '...' : formatCurrency(kpis?.cac || 0)}
          subtitle="Custo por venda aprovada" color="var(--info)" loading={loading}
          tooltip={`CAC = Custo de Aquisição por Cliente.\nFórmula: Investimento ÷ Vendas aprovadas.\nQuanto menor, mais eficiente o tráfego.`}
          icon={<svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M23 21v-2a4 4 0 00-3-3.87" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>}
        />
        <KpiCard
          title="Taxa de Frustração" value={loading ? '...' : formatPercent(kpis?.frustration_rate || 0)}
          subtitle={`${kpis?.frustration_count || 0} frustrações reais`}
          color={getFrustrationColor(kpis?.frustration_rate || 0)} loading={loading}
          tooltip={`Conta apenas vendas marcadas como "Frustrada" E que NÃO foram entregues.\nFrustrações pós-entrega não entram no cálculo.`}
          icon={<svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.8"/><line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>}
        />
      </div>

      {/* Gráficos */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Gráfico principal - Receita vs Investimento */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>Comissão vs Investimento</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Evolução diária no período</p>
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: '#6172f3' }} />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Comissão</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: '#fbbf24' }} />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Investimento</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={daily} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradComm" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6172f3" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6172f3" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gradSpend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill: '#5a5f70', fontSize: 11 }} tickLine={false} axisLine={false}
                tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fill: '#5a5f70', fontSize: 11 }} tickLine={false} axisLine={false}
                tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="commission" name="Comissão" stroke="#6172f3" strokeWidth={2} fill="url(#gradComm)" />
              <Area type="monotone" dataKey="spend" name="Investimento" stroke="#fbbf24" strokeWidth={2} fill="url(#gradSpend)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Contadores de status */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 20 }}>Status das Vendas</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Aprovadas', count: kpis?.approved_count || 0, color: '#34d399', pct: kpis?.total_transactions ? ((kpis?.approved_count || 0) / kpis.total_transactions) * 100 : 0 },
              { label: 'Agendadas', count: kpis?.scheduled_count || 0, color: '#6172f3', pct: kpis?.total_transactions ? ((kpis?.scheduled_count || 0) / kpis.total_transactions) * 100 : 0 },
              { label: 'Pendentes', count: kpis?.pending_count || 0, color: '#fbbf24', pct: kpis?.total_transactions ? ((kpis?.pending_count || 0) / kpis.total_transactions) * 100 : 0 },
              { label: 'Frustradas', count: kpis?.frustration_count || 0, color: '#f87171', pct: kpis?.total_transactions ? ((kpis?.frustration_count || 0) / kpis.total_transactions) * 100 : 0 },
            ].map(item => (
              <div key={item.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.count}</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${item.pct}%`, background: item.color, borderRadius: 3, transition: 'width 0.8s ease' }} />
                </div>
              </div>
            ))}
            <div style={{ marginTop: 8, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total no período: </span>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{kpis?.total_transactions || 0} vendas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance por campanha e atendente */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Campanhas */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 20 }}>Performance por Campanha</h3>
          {campaigns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 13 }}>
              Nenhuma campanha no período
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {campaigns.slice(0, 6).map((c, i) => {
                const roi = c.spend > 0 ? c.commission / c.spend : 0
                const frustRate = 0 // não temos por campanha ainda
                const score = getCampaignScore(roi, frustRate)
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        Gasto: {formatCurrency(c.spend)} · {c.sales} vendas
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: getROIColor(roi) }}>{roi.toFixed(2)}x</div>
                      <span className="badge" style={{ fontSize: 10, padding: '2px 7px', color: score.color, background: score.bg }}>{score.label}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Atendentes */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 20 }}>Ranking de Atendentes</h3>
          {attendants.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 13 }}>
              Cadastre atendentes para ver o ranking
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {attendants
                .sort((a, b) => b.commission - a.commission)
                .slice(0, 6)
                .map((a, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: i === 0 ? 'rgba(251,191,36,0.15)' : i === 1 ? 'rgba(148,163,184,0.15)' : 'rgba(255,255,255,0.05)',
                      fontSize: 12, fontWeight: 800,
                      color: i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : 'var(--text-muted)',
                      flexShrink: 0,
                    }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{a.src}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.sales} vendas · {a.scheduled} agendadas</div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--success)' }}>
                      {formatCurrency(a.commission)}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Gráfico de barras - Vendas por dia */}
      <div className="glass-card" style={{ padding: 24 }}>
        <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 20 }}>Vendas por Dia</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={daily} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="date" tick={{ fill: '#5a5f70', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => v.slice(5)} />
            <YAxis tick={{ fill: '#5a5f70', fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="sales" name="Vendas" fill="#6172f3" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
