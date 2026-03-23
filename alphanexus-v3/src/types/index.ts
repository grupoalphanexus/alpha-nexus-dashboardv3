export type TransactionStatus =
  | 'Aguardando Pagamento'
  | 'Pagamento Aprovado'
  | 'Cancelada'
  | 'Chargeback'
  | 'Devolvida'
  | 'Em Análise'
  | 'Estorno Pendente'
  | 'Em Processamento'
  | 'Parcialmente Pago'
  | 'Pagamento Atrasado'
  | 'Agendado'
  | 'Frustrada'

export type DeliveryStatus =
  | 'A Enviar' | 'Postado' | 'A Caminho' | 'Entregue'
  | 'Aguardando Retirada' | 'Frustrada' | 'Saiu Para Entrega'
  | 'Em Atraso' | 'Endereço Incorreto'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: 'owner' | 'admin' | 'attendant'
  created_at: string
}

export interface Settings {
  id: string
  user_id: string
  meta_tax_multiplier: number
  timezone: string
  currency: string
}

export interface Attendant {
  id: string
  user_id: string
  name: string
  src_key: string
  commission_type: 'percent' | 'fixed'
  commission_value: number
  bonus: number
  active: boolean
  created_at: string
}

export interface AttendantEntry {
  id: string
  user_id: string
  attendant_id: string | null
  sigla: string | null
  kit: '3_meses' | '5_meses' | '12_meses' | 'outro' | null
  kit_value: number | null
  status: 'agendado' | 'pago_antecipado' | 'cancelado'
  is_prepaid: boolean
  entry_date: string
  notes: string | null
  trans_key: string | null
  created_at: string
}

export interface AdAccount {
  id: string
  user_id: string
  meta_account_id: string
  account_name: string | null
  access_token: string
  active: boolean
  last_sync_at: string | null
  created_at: string
}

export interface AdInsight {
  id: string
  user_id: string
  ad_account_id: string
  campaign_name: string | null
  adset_name: string | null
  ad_name: string | null
  spend: number
  spend_with_tax: number
  insight_date: string
}

export interface Webhook {
  id: string
  user_id: string
  token: string
  braip_auth_key: string | null
  label: string
  active: boolean
  last_received_at: string | null
  total_received: number
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  webhook_id: string | null
  trans_key: string
  product_name: string | null
  plan_name: string | null
  trans_status: TransactionStatus | null
  trans_status_code: number | null
  custom_status: string | null
  trans_total_value: number
  commission_value: number
  payment_method: number | null
  trans_installments: number
  is_cod: boolean
  trans_payment_date: string | null
  trans_create_date: string | null
  src: string | null
  utm_campaign: string | null
  tracking_code: string | null
  shipping_company: string | null
  delivery_status: DeliveryStatus | null
  is_delivered: boolean
  client_name: string | null
  client_email: string | null
  client_city: string | null
  client_state: string | null
  is_real_frustration: boolean
  manual_override: boolean
  created_at: string
  updated_at: string
}

export interface TransactionLog {
  id: string
  user_id: string
  trans_key: string | null
  postback_type: string | null
  raw_payload: Record<string, unknown>
  processed: boolean
  created_at: string
}

export interface Cashflow {
  id: string
  user_id: string
  type: 'entrada' | 'saida'
  category: string
  description: string
  amount: number
  reference_date: string
  is_auto: boolean
  trans_key: string | null
  notes: string | null
  created_at: string
}

export interface DashboardMetrics {
  total_commission: number
  total_commission_projected: number
  total_spend: number
  approved_count: number
  scheduled_count: number
  pending_count: number
  frustration_count: number
  total_transactions: number
  delivered_count: number
}

// Status map
export const STATUS_MAP: Record<number, { label: string; color: string; bg: string }> = {
  1:  { label: 'Pendente',        color: 'text-amber-400',  bg: 'bg-amber-400/10' },
  2:  { label: 'Pago',            color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  3:  { label: 'Cancelado',       color: 'text-red-400',    bg: 'bg-red-400/10' },
  4:  { label: 'Chargeback',      color: 'text-red-500',    bg: 'bg-red-500/10' },
  5:  { label: 'Devolvido',       color: 'text-orange-400', bg: 'bg-orange-400/10' },
  6:  { label: 'Em Análise',      color: 'text-blue-400',   bg: 'bg-blue-400/10' },
  7:  { label: 'Estorno Pend.',   color: 'text-purple-400', bg: 'bg-purple-400/10' },
  8:  { label: 'Processando',     color: 'text-cyan-400',   bg: 'bg-cyan-400/10' },
  9:  { label: 'Parcial',         color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  10: { label: 'Atrasado',        color: 'text-orange-500', bg: 'bg-orange-500/10' },
  11: { label: 'Agendado',        color: 'text-brand-400',  bg: 'bg-brand-400/10' },
  12: { label: 'Frustrado',       color: 'text-red-400',    bg: 'bg-red-400/10' },
}

export const PAYMENT_MAP: Record<number, string> = {
  1: 'Boleto', 2: 'Cartão', 3: 'Boleto Parc.', 4: 'Grátis',
  5: 'Pix', 6: 'Na Entrega', 7: 'Cash Delivery', 8: 'Cartão+Pix', 9: 'Cartão+Boleto',
}
