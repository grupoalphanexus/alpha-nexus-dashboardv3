import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const searchParams = req.nextUrl.searchParams
  const dateFrom = searchParams.get('from') || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
  const dateTo = searchParams.get('to') || new Date().toISOString().split('T')[0]
  const src = searchParams.get('src') || null

  // Transações no período
  let txQuery = supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .gte('trans_create_date', dateFrom)
    .lte('trans_create_date', dateTo + 'T23:59:59')

  if (src) txQuery = txQuery.eq('src', src)
  const { data: transactions } = await txQuery

  // Investimento no período
  let spendQuery = supabase
    .from('ad_insights')
    .select('spend, spend_with_tax, campaign_name, insight_date')
    .eq('user_id', user.id)
    .gte('insight_date', dateFrom)
    .lte('insight_date', dateTo)

  const { data: insights } = await spendQuery

  const txs = transactions || []
  const ins = insights || []

  // KPIs
  const approved = txs.filter(t => t.trans_status_code === 2)
  const scheduled = txs.filter(t => t.trans_status_code === 11)
  const pending = txs.filter(t => t.trans_status_code === 1)
  const frustrated = txs.filter(t => t.is_real_frustration)

  const totalCommission = approved.reduce((a, t) => a + (t.commission_value || 0), 0)
  const projectedCommission = [...approved, ...scheduled].reduce((a, t) => a + (t.commission_value || 0), 0)
  const totalSpend = ins.reduce((a, i) => a + (i.spend_with_tax || 0), 0)

  // Gráfico diário
  const dailyMap: Record<string, { date: string; commission: number; spend: number; sales: number }> = {}

  for (const tx of approved) {
    const date = tx.trans_create_date?.split('T')[0] || tx.created_at.split('T')[0]
    if (!dailyMap[date]) dailyMap[date] = { date, commission: 0, spend: 0, sales: 0 }
    dailyMap[date].commission += tx.commission_value || 0
    dailyMap[date].sales += 1
  }

  for (const insight of ins) {
    const date = insight.insight_date
    if (!dailyMap[date]) dailyMap[date] = { date, commission: 0, spend: 0, sales: 0 }
    dailyMap[date].spend += insight.spend_with_tax || 0
  }

  const dailyData = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date))

  // Performance por campanha
  const campaignMap: Record<string, { name: string; spend: number; commission: number; sales: number }> = {}
  for (const insight of ins) {
    const name = insight.campaign_name || 'Sem campanha'
    if (!campaignMap[name]) campaignMap[name] = { name, spend: 0, commission: 0, sales: 0 }
    campaignMap[name].spend += insight.spend_with_tax || 0
  }
  for (const tx of approved) {
    const name = tx.utm_campaign || 'Sem campanha'
    if (!campaignMap[name]) campaignMap[name] = { name, spend: 0, commission: 0, sales: 0 }
    campaignMap[name].commission += tx.commission_value || 0
    campaignMap[name].sales += 1
  }

  // Performance por atendente
  const attendantMap: Record<string, { src: string; commission: number; sales: number; scheduled: number }> = {}
  for (const tx of txs.filter(t => t.trans_status_code === 2 || t.trans_status_code === 11)) {
    const s = tx.src || 'Desconhecido'
    if (!attendantMap[s]) attendantMap[s] = { src: s, commission: 0, sales: 0, scheduled: 0 }
    if (tx.trans_status_code === 2) {
      attendantMap[s].commission += tx.commission_value || 0
      attendantMap[s].sales += 1
    }
    if (tx.trans_status_code === 11) attendantMap[s].scheduled += 1
  }

  return NextResponse.json({
    kpis: {
      total_commission: totalCommission,
      projected_commission: projectedCommission,
      total_spend: totalSpend,
      roi: totalSpend > 0 ? totalCommission / totalSpend : 0,
      roi_projected: totalSpend > 0 ? projectedCommission / totalSpend : 0,
      cac: approved.length > 0 ? totalSpend / approved.length : 0,
      profit: totalCommission - totalSpend,
      profit_projected: projectedCommission - totalSpend,
      approved_count: approved.length,
      scheduled_count: scheduled.length,
      pending_count: pending.length,
      frustration_count: frustrated.length,
      frustration_rate: txs.length > 0 ? (frustrated.length / txs.length) * 100 : 0,
      total_transactions: txs.length,
    },
    daily_data: dailyData,
    campaigns: Object.values(campaignMap),
    attendants: Object.values(attendantMap),
  })
}
