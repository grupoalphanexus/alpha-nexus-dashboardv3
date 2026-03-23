'use client'
import { useState } from 'react'

interface KpiCardProps {
  title: string
  value: string
  subtitle?: string
  change?: number
  changeLabel?: string
  tooltip?: string
  icon?: React.ReactNode
  color?: string
  loading?: boolean
}

export default function KpiCard({
  title, value, subtitle, change, changeLabel, tooltip, icon, color = 'var(--brand)', loading
}: KpiCardProps) {
  const [showTip, setShowTip] = useState(false)
  const isPositive = (change ?? 0) >= 0

  return (
    <div className="glass-card animate-in" style={{ padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>
      {/* Accent glow */}
      <div style={{
        position: 'absolute', top: -40, right: -40, width: 120, height: 120,
        borderRadius: '50%', background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>{title}</span>
          {tooltip && (
            <div style={{ position: 'relative' }}>
              <button
                onMouseEnter={() => setShowTip(true)}
                onMouseLeave={() => setShowTip(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1, color: 'var(--text-muted)' }}
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
                  <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </button>
              {showTip && (
                <div style={{
                  position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#0c0e18', border: '1px solid var(--border-strong)',
                  borderRadius: 10, padding: '10px 14px', width: 220, zIndex: 100,
                  fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  whiteSpace: 'pre-line',
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</div>
                  {tooltip}
                  {/* Arrow */}
                  <div style={{
                    position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                    width: 0, height: 0,
                    borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
                    borderTop: '5px solid var(--border-strong)',
                  }} />
                </div>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `${color}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color,
          }}>
            {icon}
          </div>
        )}
      </div>

      {loading ? (
        <div className="shimmer" style={{ height: 36, borderRadius: 8, marginBottom: 8 }} />
      ) : (
        <div className="metric-value" style={{ fontSize: 28, color: 'var(--text-primary)', marginBottom: 6 }}>
          {value}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {change !== undefined && (
          <span style={{
            fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
            color: isPositive ? 'var(--success)' : 'var(--danger)',
            background: isPositive ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
          }}>
            {isPositive ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
          </span>
        )}
        {(subtitle || changeLabel) && (
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{changeLabel || subtitle}</span>
        )}
      </div>
    </div>
  )
}
