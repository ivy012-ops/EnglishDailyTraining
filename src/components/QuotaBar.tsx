import React, { useEffect, useState } from 'react';
import { useQuota } from '../hooks/useQuota';
import './QuotaBar.css';

interface QuotaBarProps {
  userId: string | null;
  refreshKey?: number;
}

function InfoTooltip() {
  const [open, setOpen] = useState(false);
  return (
    <div className="qb-info" onMouseLeave={() => setOpen(false)}>
      <button
        className="qb-info__icon"
        aria-label="How sessions are counted"
        onMouseEnter={() => setOpen(true)}
        onClick={() => setOpen(v => !v)}
        type="button"
      >
        i
      </button>
      {open && (
        <div className="qb-info__popup" role="tooltip">
          <p className="qb-info__title">How sessions work</p>
          <ul className="qb-info__list">
            <li>✅ 1 session deducted when you <strong>complete</strong> a session</li>
            <li>✅ Counts for: AI Conversation, Impromptu Speech, Word Builder</li>
            <li>🔁 <strong>Regenerating a topic</strong> also uses 1 session</li>
            <li>🚫 Going back early = <strong>no deduction</strong></li>
            <li>🔄 Resets daily at <strong>midnight UTC</strong></li>
          </ul>
        </div>
      )}
    </div>
  );
}

export function QuotaBar({ userId, refreshKey }: QuotaBarProps) {
  const { quota, remaining, loading, checkQuota } = useQuota(userId);

  useEffect(() => { checkQuota(); }, [checkQuota, refreshKey]);
  useEffect(() => {
    const id = setInterval(checkQuota, 60_000);
    return () => clearInterval(id);
  }, [checkQuota]);

  if (!userId || loading) return null;

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
          <span key={i} className={`qb-dot${i < used ? ' qb-dot--used' : ''}`} aria-hidden="true" />
        ))}
      </div>
      <span className="qb-strip__label">
        {isMaxed ? 'Daily limit reached' : `${remaining} session${remaining !== 1 ? 's' : ''} left today`}
      </span>
      <InfoTooltip />
    </div>
  );
}
