import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const p = req.nextUrl.searchParams
  const from = p.get('from')
  const to = p.get('to')
  const status = p.get('status')
  const src = p.get('src')
  const page = parseInt(p.get('page') || '1')
  const limit = 50
  const offset = (page - 1) * limit

  let query = supabase
    .from('transactions')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('trans_create_date', { ascending: false })
    .range(offset, offset + limit - 1)

  if (from) query = query.gte('trans_create_date', from)
  if (to) query = query.lte('trans_create_date', to + 'T23:59:59')
  if (status) query = query.eq('trans_status_code', parseInt(status))
  if (src) query = query.eq('src', src)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ transactions: data || [], total: count || 0, page, limit })
}

export async function PATCH(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id, ...updates } = await req.json()

  // Marcar como override manual
  const { error, data } = await supabase
    .from('transactions')
    .update({ ...updates, manual_override: true })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ transaction: data })
}
