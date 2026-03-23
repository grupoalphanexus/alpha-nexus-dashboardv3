'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { TransactionLog } from '@/types'
import { STATUS_MAP, PAYMENT_MAP } from '@/types'

export default function LogsPage() {
  const supabase = createClient()
  const [logs, setLogs] = useState<TransactionLog[]>([])
  const [selected, setSelected] = useState<TransactionLog | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('transaction_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    setLogs(data || [])
    setLoading(false)
  }

  function getTypeColor(type: string) {
    if (type === 'STATUS_ALTERADO') return { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' }
    if (type?.startsWith('TRACKING')) return { color: '#34d399', bg: 'rgba(52,211,153,0.1)' }
    return { color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.05)' }
  }

  const payload = selected?.raw_payload as Record<string, unknown> | null

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, letterSpacing: '-0.02em' }}>Logs de Webhook</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 2 }}>Histórico de postbacks recebidos da Braip</p>
        </div>
        <button className="btn-ghost" onClick={load}>↻ Atualizar</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: 20 }}>
        {/* Lista de logs */}
        <div className="glass-card">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Carregando...</div>
          ) : logs.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📡</div>
              <p style={{ color: 'var(--text-secondary)' }}>Nenhum postback recebido ainda</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Configure o webhook na Braip para começar a receber dados</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Tipo', 'Trans. Key', 'Status', 'Data', ''].map(h => (
                    <th key={h} style={{ padding: '13px 18px', textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => {
                  const tc = getTypeColor(log.postback_type || '')
                  const p = log.raw_payload as Record<string, unknown>
                  const statusCode = Number(p?.trans_status_code)
                  const statusInfo = STATUS_MAP[statusCode]
                  return (
                    <tr key={log.id}
                      onClick={() => setSelected(selected?.id === log.id ? null : log)}
                      style={{
                        borderBottom: i < logs.length - 1 ? '1px solid var(--border)' : 'none',
                        cursor: 'pointer',
                        background: selected?.id === log.id ? 'rgba(97,114,243,0.08)' : 'transparent',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => { if (selected?.id !== log.id) (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.025)' }}
                      onMouseLeave={e => { if (selected?.id !== log.id) (e.currentTarget as HTMLTableRowElement).style.background = 'transparent' }}
                    >
                      <td style={{ padding: '12px 18px' }}>
                        <span className="badge" style={{ fontSize: 10, color: tc.color, background: tc.bg }}>{log.postback_type}</span>
                      </td>
                      <td style={{ padding: '12px 18px' }}>
                        <code style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{log.trans_key || '—'}</code>
                      </td>
                      <td style={{ padding: '12px 18px' }}>
                        {statusInfo ? (
                          <span className="badge" style={{ fontSize: 10, color: statusInfo.color, background: statusInfo.bg }}>{statusInfo.label}</span>
                        ) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                      </td>
                      <td style={{ padding: '12px 18px', fontSize: 12, color: 'var(--text-muted)' }}>
                        {formatDate(log.created_at, 'dd/MM HH:mm')}
                      </td>
                      <td style={{ padding: '12px 18px' }}>
                        <span style={{ fontSize: 12, color: 'var(--brand)', fontWeight: 600 }}>Ver →</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Detalhe do log */}
        {selected && payload && (
          <div className="glass-card animate-in" style={{ padding: 24, maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontWeight: 700, fontSize: 15 }}>Detalhes do Postback</h3>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}>×</button>
            </div>

            {/* Interpretado */}
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>🧠 Interpretado pelo sistema</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { k: 'Atendente (src)', v: (payload.meta as Record<string, unknown>)?.src as string || payload.src as string || '—' },
                  { k: 'Status', v: payload.trans_status as string || '—' },
                  { k: 'Cliente', v: payload.client_name as string || '—' },
                  { k: 'Cidade', v: `${payload.client_address_city || ''}${payload.client_address_state ? ', ' + payload.client_address_state : ''}` || '—' },
                  { k: 'Produto', v: payload.product_name as string || '—' },
                  { k: 'Valor total', v: payload.trans_total_value ? formatCurrency((payload.trans_total_value as number) / 100) : '—' },
                  { k: 'Pagamento', v: PAYMENT_MAP[payload.trans_payment as number] || '—' },
                  { k: 'Rastreio', v: payload.tracking_code as string || '—' },
                  { k: 'Transportadora', v: payload.shipping_company as string || '—' },
                  { k: 'Status entrega', v: payload.last_status_delivery as string || '—' },
                  { k: 'Tipo', v: payload.postback_type as string || selected.postback_type || '—' },
                ].filter(r => r.v && r.v !== '—' && r.v !== ', ').map(row => (
                  <div key={row.k} style={{ display: 'flex', gap: 12, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 120 }}>{row.k}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, flex: 1 }}>{row.v}</span>
                  </div>
                ))}

                {/* Comissões */}
                {Array.isArray(payload.commissions) && (payload.commissions as { name: string; type: string; value: number }[]).length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Comissões:</span>
                    {(payload.commissions as { name: string; type: string; value: number }[]).map((c, i) => (
                      <div key={i} style={{ fontSize: 12, color: 'var(--success)', marginTop: 4, marginLeft: 8 }}>
                        {c.name} ({c.type}): {formatCurrency(c.value / 100)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* JSON bruto */}
            <div>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>📦 JSON bruto</h4>
              <pre style={{
                fontSize: 11, color: 'var(--text-muted)',
                background: 'rgba(0,0,0,0.3)', padding: 16, borderRadius: 10,
                overflow: 'auto', maxHeight: 300, lineHeight: 1.6,
                border: '1px solid var(--border)',
                fontFamily: 'var(--font-mono, monospace)',
              }}>
                {JSON.stringify(selected.raw_payload, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
