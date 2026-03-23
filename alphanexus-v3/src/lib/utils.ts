import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

export function formatDate(dateStr: string, fmt = 'dd/MM/yyyy'): string {
  try {
    return format(parseISO(dateStr), fmt, { locale: ptBR })
  } catch {
    return dateStr
  }
}

export function formatDateRange(from: Date, to: Date): string {
  return `${format(from, 'dd/MM', { locale: ptBR })} – ${format(to, 'dd/MM/yyyy', { locale: ptBR })}`
}

export function calcROI(commission: number, spend: number): number {
  if (spend === 0) return 0
  return commission / spend
}

export function calcCAC(spend: number, sales: number): number {
  if (sales === 0) return 0
  return spend / sales
}

export function calcFrustrationRate(frustrated: number, total: number): number {
  if (total === 0) return 0
  return (frustrated / total) * 100
}

export function calcProfit(commission: number, spend: number): number {
  return commission - spend
}

export function getROIColor(roi: number): string {
  if (roi >= 3) return 'text-emerald-400'
  if (roi >= 1.5) return 'text-amber-400'
  return 'text-red-400'
}

export function getFrustrationColor(rate: number): string {
  if (rate <= 15) return 'text-emerald-400'
  if (rate <= 30) return 'text-amber-400'
  return 'text-red-400'
}

export function centsToBRL(cents: number): number {
  return cents / 100
}

export function applMetaTax(spend: number, multiplier: number): number {
  return spend * multiplier
}

export function generateWebhookToken(): string {
  return crypto.randomUUID()
}

// Score de campanha baseado em ROI + taxa de frustração
export function getCampaignScore(roi: number, frustrationRate: number): {
  label: string; color: string; bg: string
} {
  if (roi >= 2.5 && frustrationRate <= 20) return { label: 'Escalar', color: 'text-emerald-400', bg: 'bg-emerald-400/10' }
  if (roi >= 1.2 || frustrationRate <= 35) return { label: 'Testar', color: 'text-amber-400', bg: 'bg-amber-400/10' }
  return { label: 'Pausar', color: 'text-red-400', bg: 'bg-red-400/10' }
}
