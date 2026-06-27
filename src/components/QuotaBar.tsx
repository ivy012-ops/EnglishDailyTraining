// src/components/QuotaBar.tsx
import React, { useEffect } from 'react';
import { useQuota } from '../hooks/useQuota';
import './QuotaBar.css';

interface QuotaBarProps {
  userId: string | null;
  onUpgradeClick?: () => void;
}

export function QuotaBar({ userId, onUpgradeClick }: QuotaBarProps) {
  const { quota, remaining, isPaid, loading, checkQuota } = useQuota(userId);

  useEffect(() => {
    const id = setInterval(checkQuota, 60_000);
    return () => clearInterval(id);
  }, [checkQuota]);

  if (!userId || loading) {
    return loading ? <div className="qb-skeleton" aria-busy="true" /> : null;
  }

  // ── Paid users ────────────────────────────────────────────────────────────
  if (isPaid) {
    return (
      <div className="qb-root qb-paid" role="status">
        <span className="qb-badge">✨ Unlimited Sessions</span>
        <p className="qb-paid-text">Practice as much as you like — no limits.</p>
      </div>
    );
  }

  // ── Free users ────────────────────────────────────────────────────────────
  const limit   = quota?.dailyLimit ?? 5;
  const used    = quota?.dailyUsed  ?? 0;
  const pct     = Math.min((used / limit) * 100, 100);
  const isMaxed = remaining <= 0;
  const isWarn  = remaining === 1;

  return (
    <div
      className={`qb-root qb-free${isMaxed ? ' qb-maxed' : ''}${isWarn ? ' qb-warning' : ''}`}
      role="status"
      aria-label={`${remaining} of ${limit} practice sessions remaining today`}
    >
      <div className="qb-header">
        <span className="qb-label">Today's AI Sessions</span>
        <span className="qb-counter">{used} / {limit}</span>
      </div>

      <div className="qb-bar-track" role="progressbar" aria-valuenow={used} aria-valuemin={0} aria-valuemax={limit}>
        <div
          className={`qb-bar-fill${isMaxed ? ' qb-bar-fill--maxed' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="qb-bubbles" aria-hidden="true">
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className={`qb-bubble${i < used ? ' qb-bubble--used' : ' qb-bubble--free'}`}>
            {i < used ? '✓' : String(i + 1)}
          </div>
        ))}
      </div>

      <div className={`qb-msg${isMaxed ? ' qb-msg--maxed' : isWarn ? ' qb-msg--warn' : ' qb-msg--ok'}`}>
        {isMaxed
          ? <>🔒 All sessions used. Resets tomorrow or <strong>upgrade to Pro</strong>.</>
          : isWarn
          ? <>⚠️ Only <strong>1 session</strong> left today — make it count!</>
          : <>🎯 <strong>{remaining} sessions</strong> left today. Keep practising!</>
        }
      </div>

      {isMaxed && (
        <button className="qb-upgrade-btn" onClick={onUpgradeClick}>
          Upgrade to Pro — Unlimited Sessions →
        </button>
      )}

      <p className="qb-streak">🔥 Practise every day to keep your streak alive!</p>
      <p className="qb-reset">Sessions reset at midnight UTC.</p>
    </div>
  );
}
