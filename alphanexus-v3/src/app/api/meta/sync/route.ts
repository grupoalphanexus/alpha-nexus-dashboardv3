import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const { ad_account_id } = await req.json()

    // Buscar conta de anúncio
    const { data: account } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('id', ad_account_id)
      .eq('user_id', user.id)
      .single()

    if (!account) return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 })

    // Buscar configurações (multiplicador de imposto)
    const { data: settings } = await supabase
      .from('settings')
      .select('meta_tax_multiplier')
      .eq('user_id', user.id)
      .single()

    const taxMultiplier = settings?.meta_tax_multiplier ?? 1.1383

    // Buscar insights dos últimos 30 dias
    const today = new Date()
    const since = new Date(today)
    since.setDate(since.getDate() - 30)
    const sinceStr = since.toISOString().split('T')[0]
    const untilStr = today.toISOString().split('T')[0]

    const fields = 'campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,spend'
    const url = `https://graph.facebook.com/v19.0/act_${account.meta_account_id}/insights?fields=${fields}&time_range={"since":"${sinceStr}","until":"${untilStr}"}&level=ad&time_increment=1&limit=500&access_token=${account.access_token}`

    const response = await fetch(url)
    const data = await response.json()

    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 400 })
    }

    const insights = data.data || []

    // Upsert no banco
    for (const insight of insights) {
      const spend = parseFloat(insight.spend || '0')
      await supabase.from('ad_insights').upsert({
        user_id: user.id,
        ad_account_id: account.id,
        meta_account_id: account.meta_account_id,
        campaign_id: insight.campaign_id,
        campaign_name: insight.campaign_name,
        adset_id: insight.adset_id,
        adset_name: insight.adset_name,
        ad_id: insight.ad_id,
        ad_name: insight.ad_name,
        spend,
        spend_with_tax: spend * taxMultiplier,
        insight_date: insight.date_start,
      }, { onConflict: 'ad_account_id,ad_id,insight_date' })
    }

    // Atualizar last_sync_at
    await supabase
      .from('ad_accounts')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', account.id)

    return NextResponse.json({ success: true, synced: insights.length })
  } catch (err) {
    console.error('[META SYNC ERROR]', err)
    return NextResponse.json({ error: 'Erro ao sincronizar' }, { status: 500 })
  }
}

// GET - listar contas de anúncio do usuário via token
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('access_token')
  if (!token) return NextResponse.json({ error: 'Token necessário' }, { status: 400 })

  try {
    const response = await fetch(
      `https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name,account_status&access_token=${token}`
    )
    const data = await response.json()
    if (data.error) return NextResponse.json({ error: data.error.message }, { status: 400 })
    return NextResponse.json({ accounts: data.data || [] })
  } catch (err) {
    return NextResponse.json({ error: 'Erro ao buscar contas' }, { status: 500 })
  }
}
