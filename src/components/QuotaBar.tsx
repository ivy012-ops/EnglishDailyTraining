import React, { useEffect } from 'react';
import { useQuota } from '../hooks/useQuota';
import './QuotaBar.css';

interface QuotaBarProps {
  userId: string | null;
  refreshKey?: number;
  onUpgradeClick?: () => void;
}

export function QuotaBar({ userId, refreshKey, onUpgradeClick }: QuotaBarProps) {
  const { quota, remaining, isPaid, loading, checkQuota } = useQuota(userId);

  useEffect(() => {
    checkQuota();
  }, [checkQuota, refreshKey]);

  useEffect(() => {
    const id = setInterval(checkQuota, 60_000);
    return () => clearInterval(id);
  }, [checkQuota]);

  if (!userId || loading) return null;

  if (isPaid) {
    return (
      <div className="qb-strip qb-strip--paid" role="status">
        <span className="qb-strip__icon">✨</span>
        <span className="qb-strip__label">Unlimited sessions</span>
      </div>
    );
  }

  const limit = quota?.dailyLimit ?? 5;
  const used = quota?.dailyUsed ?? 0;
  const isMaxed = remaining <= 0;
  const isWarn = remaining === 1;

  return (
    <div
      className={`qb-strip${isMaxed ? ' qb-strip--maxed' : isWarn ? ' qb-strip--warn' : ''}`}
      role="status"
      aria-label={`${remaining} of ${limit} sessions remaining today`}
    >
      <div className="qb-strip__dots">
        {Array.from({ length: limit }).map((_, i) => (
          <span
            key={i}
            className={`qb-dot${i < used ? ' qb-dot--used' : ''}`}
            aria-hidden="true"
          />
        ))}
      </div>

      <span className="qb-strip__label">
        {isMaxed
          ? 'Daily limit reached'
          : `${remaining} session${remaining !== 1 ? 's' : ''} left today`}
      </span>

      {isMaxed && (
        <button className="qb-strip__upgrade" onClick={onUpgradeClick}>
          Upgrade →
        </button>
      )}
    </div>
  );
}
