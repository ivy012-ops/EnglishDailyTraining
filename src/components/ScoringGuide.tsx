import React from 'react';

interface Props {
  onBack: () => void;
}

const IELTS_BANDS = [
  { band: '9.0', cefr: '', label: 'Expert', color: '#6d28d9', bg: '#f5f3ff' },
  { band: '8.0–8.5', cefr: 'C2', label: 'Very Good', color: '#7c3aed', bg: '#f5f3ff' },
  { band: '7.0–7.5', cefr: 'C1', label: 'Good', color: '#2563eb', bg: '#eff6ff' },
  { band: '5.5–6.5', cefr: 'B2', label: 'Competent', color: '#0891b2', bg: '#ecfeff' },
  { band: '4.0–5.0', cefr: 'B1', label: 'Modest', color: '#059669', bg: '#f0fdf4' },
  { band: '3.0–3.5', cefr: 'A2', label: 'Limited', color: '#d97706', bg: '#fffbeb' },
];

const CRITERIA = [
  {
    icon: '🎙️',
    title: 'Fluency & Coherence',
    color: '#3b82f6',
    what: 'How smoothly you speak and how well your ideas connect.',
    tips: [
      'Avoid long silences or excessive filler words (um, uh, like)',
      'Use linking phrases: "Furthermore", "On the other hand", "As a result"',
      'Complete your thoughts — don\'t trail off mid-sentence',
    ],
  },
  {
    icon: '📚',
    title: 'Lexical Resource',
    color: '#8b5cf6',
    what: 'The range and precision of vocabulary you use.',
    tips: [
      'Replace basic words: "good" → "exceptional", "big" → "substantial"',
      'Use topic-specific vocabulary naturally',
      'Paraphrase rather than repeating the same word',
    ],
  },
  {
    icon: '✏️',
    title: 'Grammatical Range & Accuracy',
    color: '#10b981',
    what: 'Variety of sentence structures and how few errors you make.',
    tips: [
      'Mix simple and complex sentences (relative clauses, conditionals)',
      'Use perfect tenses: "I have been working on…"',
      'Self-correct naturally when you catch a mistake',
    ],
  },
  {
    icon: '🔊',
    title: 'Pronunciation',
    color: '#f59e0b',
    what: 'Clarity, stress, and intonation — not accent.',
    tips: [
      'Stress the right syllable: pre-SENT vs. PRE-sent',
      'Rise in pitch for questions, fall for statements',
      'Speak at a pace the listener can follow',
    ],
  },
];

const LEVELS = [
  {
    level: 'B1',
    color: '#059669',
    bg: '#f0fdf4',
    border: '#6ee7b7',
    title: 'Intermediate',
    scenarios: ['Casual Social', 'Travel / Service'],
    expect: 'Can handle routine topics with some hesitation. Uses common vocabulary correctly but with limited range.',
    levelUpCriteria: [
      'Use at least 2 precise / topic-specific words per response',
      'Produce complex sentences without major errors',
      'Maintain flow with minimal pausing',
    ],
  },
  {
    level: 'B2',
    color: '#2563eb',
    bg: '#eff6ff',
    border: '#93c5fd',
    title: 'Upper Intermediate',
    scenarios: ['Work Meeting', 'Job Interview'],
    expect: 'Communicates clearly on most topics. Uses varied vocabulary and mostly accurate grammar.',
    levelUpCriteria: [
      'Demonstrate wide vocabulary range with few errors',
      'Sustain arguments across multiple turns',
      'Self-correct grammar mistakes naturally',
    ],
  },
  {
    level: 'C1',
    color: '#7c3aed',
    bg: '#f5f3ff',
    border: '#c4b5fd',
    title: 'Advanced',
    scenarios: ['All scenarios — highest difficulty'],
    expect: 'Expresses complex ideas fluently and precisely. Uses sophisticated vocabulary and structures.',
    levelUpCriteria: ['Top tier — you have reached the highest level!'],
  },
];

export function ScoringGuide({ onBack }: Props) {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 120px', fontFamily: 'inherit' }}>

      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 16, padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          ← Back
        </button>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#94a3b8', marginBottom: 8 }}>How scoring works</p>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', margin: '0 0 10px' }}>Scoring Guide</h1>
        <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
          SpeakFlow uses the <strong>IELTS Speaking Band</strong> framework — the same standard used in official English proficiency tests worldwide.
          Every session gives you an estimated band score and personalised feedback across 4 criteria.
        </p>
      </div>

      {/* IELTS Band Reference */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>IELTS Band → CEFR Level</h2>
        <div style={{ border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
          {IELTS_BANDS.map((row, i) => (
            <div key={row.band} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', background: i % 2 === 0 ? '#fff' : '#f8fafc', borderBottom: i < IELTS_BANDS.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
              <div style={{ minWidth: 70, fontWeight: 700, fontSize: 18, color: row.color }}>{row.band}</div>
              {row.cefr && (
                <div style={{ background: row.bg, color: row.color, border: `1px solid ${row.color}33`, borderRadius: 100, padding: '2px 10px', fontSize: 12, fontWeight: 700, minWidth: 36, textAlign: 'center' }}>{row.cefr}</div>
              )}
              <div style={{ fontSize: 14, color: '#475569', fontWeight: 500 }}>{row.label}</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 10 }}>
          SpeakFlow currently tracks <strong>B1 → B2 → C1</strong> levels and promotes you automatically as you improve.
        </p>
      </section>

      {/* 4 IELTS Criteria */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>The 4 Scoring Criteria</h2>
        <p style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>Each response is evaluated on these four dimensions — equally weighted.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {CRITERIA.map(c => (
            <div key={c.title} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '20px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 22 }}>{c.icon}</span>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: c.color, margin: 0 }}>{c.title}</h3>
              </div>
              <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 12px', lineHeight: 1.5 }}>{c.what}</p>
              <ul style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                {c.tips.map(tip => (
                  <li key={tip} style={{ fontSize: 13, color: '#334155', lineHeight: 1.5 }}>{tip}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Level system */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Your Level & How to Level Up</h2>
        <p style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>After every session, AI evaluates whether you're ready to advance. Here's what's expected at each level.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {LEVELS.map(l => (
            <div key={l.level} style={{ background: l.bg, border: `1.5px solid ${l.border}`, borderRadius: 16, padding: '20px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ background: l.color, color: '#fff', borderRadius: 8, padding: '2px 10px', fontSize: 13, fontWeight: 700 }}>{l.level}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: l.color }}>{l.title}</span>
              </div>
              <p style={{ fontSize: 13, color: '#475569', margin: '0 0 8px' }}>
                <strong>Scenarios:</strong> {l.scenarios.join(' · ')}
              </p>
              <p style={{ fontSize: 13, color: '#475569', margin: '0 0 12px', lineHeight: 1.5 }}>{l.expect}</p>
              <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 10, padding: '12px 14px' }}>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: l.color, margin: '0 0 8px' }}>
                  {l.level === 'C1' ? '🏆 Max level reached' : '⬆️ To level up, AI looks for:'}
                </p>
                <ul style={{ margin: 0, padding: '0 0 0 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {l.levelUpCriteria.map(c => (
                    <li key={c} style={{ fontSize: 13, color: '#334155', lineHeight: 1.5 }}>{c}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How sessions count */}
      <section style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 20, padding: '24px 26px' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Session Rules</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { icon: '✅', text: '1 session is deducted when you complete a full session (reach the end)' },
            { icon: '✅', text: 'Counts for: AI Conversation, Impromptu Speech, and Word Builder' },
            { icon: '🚫', text: 'Going back early before finishing = no deduction' },
            { icon: '🔄', text: 'Free quota resets daily at midnight UTC (5 sessions / day)' },
            { icon: '♾️', text: 'Pro / Premium users have unlimited sessions — no daily cap' },
          ].map(row => (
            <div key={row.text} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 16, lineHeight: 1.4 }}>{row.icon}</span>
              <span style={{ fontSize: 14, color: '#475569', lineHeight: 1.5 }}>{row.text}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
