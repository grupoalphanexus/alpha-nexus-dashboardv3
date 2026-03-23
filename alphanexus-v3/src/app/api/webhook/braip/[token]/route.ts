import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { centsToBRL } from '@/lib/utils'

// Service role client — bypassa RLS (só para webhooks externos)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function mapCustomStatus(statusCode: number): string {
  const map: Record<number, string> = {
    1: 'Pendente',
    2: 'Pago',
    3: 'Cancelado',
    4: 'Chargeback',
    5: 'Devolvido',
    6: 'Em Análise',
    7: 'Estorno Pendente',
    8: 'Processando',
    9: 'Parcialmente Pago',
    10: 'Pagamento Atrasado',
    11: 'Agendado',
    12: 'Frustrado',
  }
  return map[statusCode] || 'Desconhecido'
}

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params

  try {
    const body = await req.json()

    // 1. Buscar webhook pelo token
    const { data: webhook, error: whErr } = await supabaseAdmin
      .from('webhooks')
      .select('id, user_id, braip_auth_key, active')
      .eq('token', token)
      .single()

    if (whErr || !webhook) {
      return NextResponse.json({ error: 'Webhook inválido' }, { status: 404 })
    }

    if (!webhook.active) {
      return NextResponse.json({ error: 'Webhook inativo' }, { status: 403 })
    }

    // 2. Validar basic_authentication (se configurado)
    if (webhook.braip_auth_key && body.basic_authentication !== webhook.braip_auth_key) {
      return NextResponse.json({ error: 'Autenticação inválida' }, { status: 401 })
    }

    const userId = webhook.user_id
    const postbackType = body.type

    // 3. Salvar log bruto SEMPRE
    await supabaseAdmin.from('transaction_logs').insert({
      user_id: userId,
      webhook_id: webhook.id,
      trans_key: body.trans_key || null,
      postback_type: postbackType,
      raw_payload: body,
      processed: true,
    })

    // 4. Atualizar contadores do webhook
    await supabaseAdmin
      .from('webhooks')
      .update({
        last_received_at: new Date().toISOString(),
        total_received: supabaseAdmin.rpc as unknown as number, // será feito via SQL abaixo
      })
      .eq('id', webhook.id)

    await supabaseAdmin.rpc('increment_webhook_count', { webhook_id: webhook.id })

    // 5. Processar conforme tipo
    if (postbackType === 'STATUS_ALTERADO') {
      await handleStatusAlterado(body, userId, webhook.id)
    } else if (
      postbackType === 'TRACKING_CODE_ADDED' ||
      postbackType === 'TRACKING_STATUS_CHANGED' ||
      postbackType === 'TRACKING_STATUS_OUT_FOR_DELIVERY' ||
      postbackType === 'TRACKING_STATUS_DELIVERED' ||
      postbackType === 'TRACKING_STATUS_WAITING_FOR_COLLECTION'
    ) {
      await handleTrackingUpdate(body, userId)
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err) {
    console.error('[WEBHOOK ERROR]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

async function handleStatusAlterado(body: Record<string, unknown>, userId: string, webhookId: string) {
  const meta = (body.meta as Record<string, unknown>) || {}
  const commissions = (body.commissions as Array<{ value: string | number }>) || []

  // Calcular comissão total (excluindo "Sistema")
  const totalCommission = commissions
    .filter((c: Record<string, unknown>) => c.type !== 'Sistema')
    .reduce((acc: number, c: Record<string, unknown>) => acc + centsToBRL(Number(c.value || 0)), 0)

  const statusCode = Number(body.trans_status_code)
  const isRealFrustration =
    statusCode === 12 && body.last_status_delivery !== 'Entregue'

  const transactionData = {
    user_id: userId,
    webhook_id: webhookId,
    trans_key: body.trans_key as string,
    product_name: body.product_name as string || null,
    product_key: body.product_key as string || null,
    plan_name: body.plan_name as string || null,
    plan_key: body.plan_key as string || null,
    trans_status: body.trans_status as string || null,
    trans_status_code: statusCode,
    custom_status: mapCustomStatus(statusCode),
    trans_total_value: centsToBRL(Number(body.trans_total_value || 0)),
    trans_value: centsToBRL(Number(body.trans_value || 0)),
    trans_discount: centsToBRL(Number(body.trans_discount_value || 0)),
    trans_freight: centsToBRL(Number(body.trans_freight || 0)),
    commission_value: totalCommission,
    payment_method: Number(body.trans_payment) || null,
    trans_installments: Number(body.trans_installments) || 1,
    is_cod: body.trans_pay_on_delivery === 1 || body.trans_cash_on_delivery === true,
    trans_payment_date: body.trans_payment_date as string || null,
    trans_create_date: body.trans_createdate as string || null,
    trans_update_date: body.trans_updatedate as string || null,
    // Origem / atendente
    src: (meta.src as string) || null,
    utm_campaign: (meta.utm_campaign as string) || null,
    utm_content: (meta.utm_content as string) || null,
    utm_source: (meta.utm_source as string) || null,
    utm_medium: (meta.utm_medium as string) || null,
    fbclid: (meta.fbclid as string) || null,
    // Entrega
    tracking_code: body.tracking_code as string || null,
    shipping_company: body.shipping_company as string || null,
    freight_type: body.trans_freight_type as string || null,
    delivery_status: body.last_status_delivery as string || null,
    is_delivered: body.last_status_delivery === 'Entregue',
    // Cliente
    client_name: body.client_name as string || null,
    client_email: body.client_email as string || null,
    client_city: body.client_address_city as string || null,
    client_state: body.client_address_state as string || null,
    // Flags
    is_real_frustration: isRealFrustration,
    is_upsell: body.is_upsell === '1' || body.is_upsell === 1,
  }

  await supabaseAdmin
    .from('transactions')
    .upsert(transactionData, { onConflict: 'user_id,trans_key' })
}

async function handleTrackingUpdate(body: Record<string, unknown>, userId: string) {
  if (!body.trans_key) return

  const isDelivered = body.last_status_delivery === 'Entregue'

  await supabaseAdmin
    .from('transactions')
    .update({
      tracking_code: body.tracking_code as string || null,
      shipping_company: body.shipping_company as string || null,
      delivery_status: body.last_status_delivery as string || null,
      is_delivered: isDelivered,
      is_real_frustration: !isDelivered && false, // só muda se vier status final
      trans_update_date: body.trans_updatedate as string || null,
    })
    .match({ user_id: userId, trans_key: body.trans_key as string })
}
