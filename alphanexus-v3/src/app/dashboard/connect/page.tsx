'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'

interface AdAccount { id: string; meta_account_id: string; account_name: string; active: boolean; last_sync_at: string | null }
interface WebhookData { id: string; token: string; label: string; active: boolean; last_received_at: string | null; total_received: number }

export default function ConnectPage() {
  const supabase = createClient()
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([])
  const [webhooks, setWebhooks] = useState<WebhookData[]>([])
  const [metaToken, setMetaToken] = useState('')
  const [metaAccountId, setMetaAccountId] = useState('')
  const [metaName, setMetaName] = useState('')
  const [loadingMeta, setLoadingMeta] = useState(false)
  const [loadingWebhook, setLoadingWebhook] = useState(false)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: acc } = await supabase.from('ad_accounts').select('*').order('created_at', { ascending: false })
    const { data: wh } = await supabase.from('webhooks').select('*').order('created_at', { ascending: false })
    setAdAccounts(acc || [])
    setWebhooks(wh || [])
  }

  async function connectMeta() {
    if (!metaToken || !metaAccountId) return toast.error('Preencha Token e ID da Conta')
    setLoadingMeta(true)
    try {
      const accountId = metaAccountId.replace('act_', '')
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('ad_accounts').upsert({
        user_id: user!.id, meta_account_id: accountId,
        account_name: metaName || `Conta ${accountId}`,
        access_token: metaToken, active: true,
      }, { onConflict: 'user_id,meta_account_id' })
      if (error) throw error
      toast.success('Conta Meta Ads conectada!')
      setMetaToken(''); setMetaAccountId(''); setMetaName('')
      await loadData()
      // Sync imediato
      const { data: acc } = await supabase.from('ad_accounts').select('id').eq('meta_account_id', accountId).single()
      if (acc) { await fetch('/api/meta/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ad_account_id: acc.id }) }) }
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Erro ao conectar')
    } finally { setLoadingMeta(false) }
  }

  async function syncMeta(accId: string) {
    toast.loading('Sincronizando...', { id: 'sync' })
    const res = await fetch('/api/meta/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ad_account_id: accId }) })
    const d = await res.json()
    if (d.error) toast.error(d.error, { id: 'sync' })
    else toast.success(`${d.synced} insights sincronizados!`, { id: 'sync' })
    await loadData()
  }

  async function generateWebhook() {
    setLoadingWebhook(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('webhooks').insert({ user_id: user!.id, label: `Webhook ${webhooks.length + 1}`, active: true })
      if (error) throw error
      toast.success('Webhook gerado!')
      await loadData()
    } catch (e: unknown) { toast.error((e as Error).message) }
    finally { setLoadingWebhook(false) }
  }

  async function copyWebhook(token: string) {
    const url = `${window.location.origin}/api/webhook/braip/${token}`
    await navigator.clipboard.writeText(url)
    setCopiedToken(token)
    toast.success('Link copiado!')
    setTimeout(() => setCopiedToken(null), 2000)
  }

  async function toggleWebhook(id: string, active: boolean) {
    await supabase.from('webhooks').update({ active: !active }).eq('id', id)
    await loadData()
  }

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, letterSpacing: '-0.02em' }}>Integrações</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 2 }}>Conecte sua conta de anúncios e a Braip</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* META ADS */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(24,119,242,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Meta Ads</h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Conecte sua conta de anúncios</p>
            </div>
          </div>

          <div className="glass-card" style={{ padding: 24, marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--text-secondary)' }}>Adicionar conta</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Token de Acesso (Permanente)</label>
                <input className="input" placeholder="EAAcZCheoKQTA..." value={metaToken} onChange={e => setMetaToken(e.target.value)} type="password" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>ID da Conta (ex: 492500913895242)</label>
                <input className="input" placeholder="492500913895242" value={metaAccountId} onChange={e => setMetaAccountId(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Nome da conta (opcional)</label>
                <input className="input" placeholder="Minha conta principal" value={metaName} onChange={e => setMetaName(e.target.value)} />
              </div>
              <button className="btn-primary" onClick={connectMeta} disabled={loadingMeta} style={{ width: '100%', justifyContent: 'center' }}>
                {loadingMeta ? 'Conectando...' : '+ Conectar conta'}
              </button>
            </div>
          </div>

          {/* Contas conectadas */}
          {adAccounts.length > 0 && (
            <div className="glass-card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: 'var(--text-secondary)' }}>Contas conectadas</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {adAccounts.map(acc => (
                  <div key={acc.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: acc.active ? 'var(--success)' : 'var(--danger)', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{acc.account_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        ID: {acc.meta_account_id} · {acc.last_sync_at ? `Sync: ${formatDate(acc.last_sync_at)}` : 'Nunca sincronizado'}
                      </div>
                    </div>
                    <button onClick={() => syncMeta(acc.id)} className="btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }}>↻ Sync</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* BRAIP WEBHOOK */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(97,114,243,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14v2.92z" stroke="var(--brand)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Braip Webhook</h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Receba vendas em tempo real</p>
            </div>
          </div>

          {/* Instrução */}
          <div className="glass-card" style={{ padding: 20, marginBottom: 16, borderColor: 'rgba(97,114,243,0.3)' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--brand-light)' }}>Como conectar</h3>
            {['Clique em "Gerar Webhook" abaixo', 'Copie o link gerado', 'Acesse sua conta na Braip → Configurações → Postback', 'Cole o link e salve', 'Teste enviando um postback de teste'].map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--brand-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--brand)', flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s}</span>
              </div>
            ))}
          </div>

          <button className="btn-primary" onClick={generateWebhook} disabled={loadingWebhook} style={{ width: '100%', justifyContent: 'center', marginBottom: 16 }}>
            {loadingWebhook ? 'Gerando...' : '+ Gerar Webhook'}
          </button>

          {/* Webhooks gerados */}
          {webhooks.length > 0 && (
            <div className="glass-card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: 'var(--text-secondary)' }}>Webhooks ativos</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {webhooks.map(wh => (
                  <div key={wh.id} style={{ padding: 14, background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: wh.active ? 'var(--success)' : 'var(--danger)' }} />
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{wh.label}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{wh.total_received} req.</span>
                      </div>
                      <button onClick={() => toggleWebhook(wh.id, wh.active)} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit' }}>
                        {wh.active ? 'Pausar' : 'Ativar'}
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <code style={{ flex: 1, fontSize: 11, color: 'var(--text-muted)', background: 'rgba(0,0,0,0.2)', padding: '6px 10px', borderRadius: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                        {typeof window !== 'undefined' ? `${window.location.origin}/api/webhook/braip/${wh.token}` : `/api/webhook/braip/${wh.token}`}
                      </code>
                      <button onClick={() => copyWebhook(wh.token)} className="btn-primary" style={{ padding: '7px 14px', fontSize: 12, flexShrink: 0 }}>
                        {copiedToken === wh.token ? '✓ Copiado' : 'Copiar'}
                      </button>
                    </div>
                    {wh.last_received_at && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                        Último recebido: {formatDate(wh.last_received_at, 'dd/MM/yyyy HH:mm')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
