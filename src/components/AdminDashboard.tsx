import React, { useEffect, useState } from 'react';
import { quotaService, PlatformStats } from '../services/quotaService';
import { User } from 'firebase/auth';

interface Props {
  user: User | null;
  onBack: () => void;
}

function todayUTC() {
  return new Date().toISOString().split('T')[0];
}

function last7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
}

function formatDate(iso: string) {
  const [, m, d] = iso.split('-');
  return `${m}/${d}`;
}

export function AdminDashboard({ user, onBack }: Props) {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const load = async () => {
    setLoading(true);
    const s = await quotaService.getPlatformStats();
    setStats(s);
    setLastRefresh(new Date());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const days = last7Days();
  const sessionsByDay = stats?.sessionsByDay ?? {};
  const todaySessions = sessionsByDay[todayUTC()] ?? 0;
  const maxBar = Math.max(...days.map(d => sessionsByDay[d] ?? 0), 1);

  const conversionRate = stats && stats.totalUsers > 0
    ? ((stats.paidUsers / stats.totalUsers) * 100).toFixed(1)
    : '0.0';

  const estMonthlyCost = ((stats?.totalSessionsAllTime ?? 0) * 0.0022 / 30).toFixed(2);

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '48px 24px 96px', fontFamily: 'inherit' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 40 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#94a3b8', marginBottom: 6 }}>
            Admin only
          </p>
          <h1 style={{ fontSize: 40, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', margin: 0 }}>
            Platform Dashboard
          </h1>
          <p style={{ color: '#64748b', marginTop: 6, fontSize: 15 }}>
            Last refreshed {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button onClick={load} style={{ padding: '10px 18px', background: '#f1f5f9', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
            ↺ Refresh
          </button>
          <button onClick={onBack} style={{ padding: '10px 18px', background: '#0f172a', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
            ← Back
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '60px 0', fontSize: 15 }}>Loading stats...</div>
      ) : !stats ? (
        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '60px 0', fontSize: 15 }}>
          No data yet — stats appear after the first user completes a session.
        </div>
      ) : (
        <>
          {/* Metric cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 32 }}>
            {[
              { label: 'Total users', value: stats.totalUsers, color: '#3b82f6' },
              { label: 'Sessions today', value: todaySessions, color: '#8b5cf6' },
              { label: 'All-time sessions', value: stats.totalSessionsAllTime, color: '#10b981' },
              { label: 'Paid users', value: stats.paidUsers, color: '#f59e0b' },
              { label: 'Free users', value: stats.freeUsers, color: '#64748b' },
              { label: 'Conversion %', value: `${conversionRate}%`, color: '#ec4899' },
            ].map(card => (
              <div key={card.label} style={{ background: '#f8fafc', borderRadius: 16, padding: '18px 20px', border: '1px solid #e2e8f0' }}>
                <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', margin: '0 0 8px' }}>{card.label}</p>
                <p style={{ fontSize: 28, fontWeight: 700, color: card.color, margin: 0, letterSpacing: '-0.02em' }}>{card.value}</p>
              </div>
            ))}
          </div>

          {/* Sessions last 7 days bar chart */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: '24px 28px', marginBottom: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 20 }}>Sessions — last 7 days</p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 100 }}>
              {days.map(day => {
                const count = sessionsByDay[day] ?? 0;
                const height = maxBar > 0 ? Math.max((count / maxBar) * 100, count > 0 ? 8 : 2) : 2;
                const isToday = day === todayUTC();
                return (
                  <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: isToday ? '#3b82f6' : '#94a3b8' }}>{count}</span>
                    <div style={{ width: '100%', height: `${height}%`, background: isToday ? '#3b82f6' : '#cbd5e1', borderRadius: 6, minHeight: 3, transition: 'height 0.3s ease' }} />
                    <span style={{ fontSize: 10, color: isToday ? '#3b82f6' : '#94a3b8', fontWeight: isToday ? 600 : 400 }}>{formatDate(day)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cost estimate + plan split */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: '22px 24px' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 16 }}>Estimated API cost</p>
              <p style={{ fontSize: 32, fontWeight: 700, color: '#10b981', margin: '0 0 4px', letterSpacing: '-0.02em' }}>${estMonthlyCost}</p>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>per month at current pace</p>
              <p style={{ fontSize: 11, color: '#cbd5e1', margin: '10px 0 0', lineHeight: 1.5 }}>Based on $0.0022/session avg × sessions/day × 30</p>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: '22px 24px' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 16 }}>Plan split</p>
              {stats.totalUsers > 0 ? (
                <>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ flex: stats.freeUsers, background: '#e2e8f0', height: 10, borderRadius: 100 }} />
                    <div style={{ flex: stats.paidUsers, background: '#f59e0b', height: 10, borderRadius: 100, minWidth: stats.paidUsers > 0 ? 8 : 0 }} />
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                    <span style={{ color: '#64748b' }}>⬜ Free: {stats.freeUsers}</span>
                    <span style={{ color: '#d97706' }}>🟡 Paid: {stats.paidUsers}</span>
                  </div>
                </>
              ) : (
                <p style={{ color: '#94a3b8', fontSize: 13 }}>No users yet</p>
              )}
            </div>
          </div>

          {/* External links */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 20, padding: '22px 24px' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 14 }}>External monitoring</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Firebase Console — Firestore usage + Auth users', url: 'https://console.firebase.google.com/project/gen-lang-client-0515745813/firestore' },
                { label: 'Google AI Studio — Gemini API rate limits + token usage', url: 'https://aistudio.google.com/rate-limit' },
                { label: 'Vercel — Deployments, logs, analytics', url: 'https://vercel.com/ivygirl0624-2016s-projects/english-daily-training' },
              ].map(link => (
                <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, textDecoration: 'none', color: '#334155', fontSize: 13 }}>
                  <span>{link.label}</span>
                  <span style={{ color: '#94a3b8', fontSize: 12 }}>↗</span>
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
