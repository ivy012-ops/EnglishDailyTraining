// src/components/QuotaBar.tsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuota } from '../hooks/useQuota';
import './QuotaBar.css';

interface QuotaBarProps {
  /** Called when the user clicks "Upgrade to Pro" */
  onUpgradeClick?: () => void;
}

export function QuotaBar({ onUpgradeClick }: QuotaBarProps) {
  const { quota, remaining, isPaid, loading, checkQuota } = useQuota();
  const navigate = useNavigate();

  // Refresh quota every 60 s so the bar stays accurate across tabs/refreshes
  useEffect(() => {
    const id = setInterval(checkQuota, 60_000);
    return () => clearInterval(id);
  }, [checkQuota]);

  const handleUpgrade = () => {
    if (onUpgradeClick) {
      onUpgradeClick();
    } else {
      navigate('/pricing');
    }
  };

  if (loading) {
    return <div className="qb-skeleton" aria-busy="true" />;
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
  const limit     = quota?.dailyLimit ?? 5;
  const used      = quota?.dailyUsed  ?? 0;
  const pct       = Math.min((used / limit) * 100, 100);
  const isMaxed   = remaining <= 0;
  const isWarning = remaining === 1;

  return (
    <div
      className={`qb-root qb-free${isMaxed ? ' qb-maxed' : ''}${isWarning ? ' qb-warning' : ''}`}
      role="status"
      aria-label={`${remaining} of ${limit} practice sessions remaining today`}
    >
      {/* Header */}
      <div className="qb-header">
        <span className="qb-label">Today's AI Sessions</span>
        <span className="qb-counter">
          {used} / {limit}
        </span>
      </div>

      {/* Progress bar */}
      <div className="qb-bar-track" role="progressbar" aria-valuenow={used} aria-valuemin={0} aria-valuemax={limit}>
        <div
          className={`qb-bar-fill${isMaxed ? ' qb-bar-fill--maxed' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Session bubbles */}
      <div className="qb-bubbles" aria-hidden="true">
        {Array.from({ length: limit }).map((_, i) => (
          <div
            key={i}
            className={`qb-bubble${i < used ? ' qb-bubble--used' : ' qb-bubble--free'}`}
          >
            {i < used ? '✓' : String(i + 1)}
          </div>
        ))}
      </div>

      {/* Status message */}
      <div className={`qb-msg${isMaxed ? ' qb-msg--maxed' : isWarning ? ' qb-msg--warn' : ' qb-msg--ok'}`}>
        {isMaxed ? (
          <>🔒 All sessions used. Resets tomorrow or <strong>upgrade to Pro</strong>.</>
        ) : isWarning ? (
          <>⚠️ Only <strong>1 session</strong> left today — make it count!</>
        ) : (
          <>🎯 <strong>{remaining} sessions</strong> left today. Keep practising!</>
        )}
      </div>

      {/* Upgrade CTA (shown when maxed out) */}
      {isMaxed && (
        <button className="qb-upgrade-btn" onClick={handleUpgrade}>
          Upgrade to Pro — Unlimited Sessions →
        </button>
      )}

      {/* Streak nudge */}
      <p className="qb-streak">🔥 Practise every day to keep your streak alive!</p>

      {/* Reset time */}
      <p className="qb-reset">Sessions reset at midnight UTC.</p>
    </div>
  );
}
