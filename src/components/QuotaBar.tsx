import React, { useEffect, useState, useRef } from 'react';
import { useQuota } from '../hooks/useQuota';
import './QuotaBar.css';

interface QuotaBarProps {
  userId: string | null;
  refreshKey?: number;
  onUpgradeClick?: () => void;
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
            <li>🚫 Going back early = <strong>no deduction</strong></li>
            <li>🔄 Resets daily at <strong>midnight UTC</strong></li>
            <li>♾️ <strong>Pro/Premium</strong> users have unlimited sessions</li>
          </ul>
        </div>
      )}
    </div>
  );
}

function ComingSoonPopup({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div className="qb-modal-backdrop">
      <div className="qb-modal" ref={ref} role="dialog" aria-modal="true">
        <div className="qb-modal__emoji">🚀</div>
        <h3 className="qb-modal__title">Pro plan coming soon</h3>
        <p className="qb-modal__body">
          We're putting the finishing touches on SpeakFlow Pro — unlimited sessions, progress exports, and custom scenarios.
        </p>
        <div className="qb-modal__perks">
          <div className="qb-modal__perk">♾️ Unlimited AI sessions</div>
          <div className="qb-modal__perk">📊 Full progress history</div>
          <div className="qb-modal__perk">📄 PDF report export</div>
          <div className="qb-modal__perk">🎯 Custom scenarios</div>
        </div>
        <p className="qb-modal__price">$7.99 / month · $69 / year</p>
        <p className="qb-modal__note">Check back soon — launching shortly!</p>
        <button className="qb-modal__close" onClick={onClose}>Got it</button>
      </div>
    </div>
  );
}

export function QuotaBar({ userId, refreshKey, onUpgradeClick }: QuotaBarProps) {
  const { quota, remaining, isPaid, loading, checkQuota } = useQuota(userId);
  const [showComingSoon, setShowComingSoon] = useState(false);

  useEffect(() => { checkQuota(); }, [checkQuota, refreshKey]);
  useEffect(() => {
    const id = setInterval(checkQuota, 60_000);
    return () => clearInterval(id);
  }, [checkQuota]);

  if (!userId || loading) return null;

  const handleUpgrade = () => {
    if (onUpgradeClick) onUpgradeClick();
    else setShowComingSoon(true);
  };

  if (isPaid) {
    return (
      <div className="qb-strip qb-strip--paid" role="status">
        <span className="qb-strip__icon">✨</span>
        <span className="qb-strip__label">Unlimited sessions</span>
        <InfoTooltip />
      </div>
    );
  }

  const limit = quota?.dailyLimit ?? 5;
  const used = quota?.dailyUsed ?? 0;
  const isMaxed = remaining <= 0;
  const isWarn = remaining === 1;

  return (
    <>
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
        {isMaxed && (
          <button className="qb-strip__upgrade" onClick={handleUpgrade}>
            Upgrade →
          </button>
        )}
      </div>

      {showComingSoon && <ComingSoonPopup onClose={() => setShowComingSoon(false)} />}
    </>
  );
}
