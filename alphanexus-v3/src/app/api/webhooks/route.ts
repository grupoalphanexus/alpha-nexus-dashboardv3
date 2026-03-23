import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const label = body.label || 'Webhook Principal'

  const { data, error } = await supabase
    .from('webhooks')
    .insert({ user_id: user.id, label, active: true })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://seudominio.vercel.app'
  return NextResponse.json({
    webhook: data,
    url: `${appUrl}/api/webhook/braip/${data.token}`,
  })
}

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://seudominio.vercel.app'

  const { data } = await supabase
    .from('webhooks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const webhooks = (data || []).map((wh: { token: string; [key: string]: unknown }) => ({
    ...wh,
    url: `${appUrl}/api/webhook/braip/${wh.token}`,
  }))

  return NextResponse.json({ webhooks })
}

export async function PATCH(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id, ...updates } = await req.json()
  const { error } = await supabase
    .from('webhooks')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
