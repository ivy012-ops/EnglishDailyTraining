// src/services/quotaService.ts
import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
} from 'firebase/firestore';
import { db } from './firebase';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Plan = 'free' | 'pro' | 'premium';
export type SessionType =
  | 'conversation'
  | 'impromptu'
  | 'vocabulary'
  | 'pre_recorded';

export interface UserQuota {
  userId: string;
  plan: Plan;

  // Daily quota (AI sessions)
  dailyLimit: number;       // 5 free | Number.MAX_SAFE_INTEGER paid
  dailyUsed: number;        // sessions consumed today
  lastResetDate: string;    // YYYY-MM-DD (UTC)

  // Lifetime stats
  totalSessionsAllTime: number;

  // Subscription
  subscriptionStatus: 'active' | 'cancelled' | 'expired';
  subscriptionEndDate?: string; // ISO string

  // Timestamps
  lastSessionDate: string;  // ISO string
  createdAt: string;
}

export interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;
  remainingToday: number;   // Infinity for paid users
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FREE_DAILY_LIMIT = 5;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayUTC(): string {
  return new Date().toISOString().split('T')[0];
}

// ─── Service ──────────────────────────────────────────────────────────────────

class QuotaService {
  // ── Read ──────────────────────────────────────────────────────────────────

  async getUserQuota(userId: string): Promise<UserQuota | null> {
    try {
      const snap = await getDoc(doc(db, 'quotas', userId));
      if (!snap.exists()) return null;

      const quota = snap.data() as UserQuota;

      // Reset daily count if it's a new day
      if (quota.lastResetDate !== todayUTC()) {
        await this._resetDaily(userId);
        quota.dailyUsed = 0;
        quota.lastResetDate = todayUTC();
      }

      return quota;
    } catch (err) {
      console.error('[QuotaService] getUserQuota:', err);
      throw err;
    }
  }

  // ── Check ─────────────────────────────────────────────────────────────────

  async canStartSession(userId: string): Promise<QuotaCheckResult> {
    let quota = await this.getUserQuota(userId);

    // First-time user — create free quota automatically
    if (!quota) {
      quota = await this._createFreeQuota(userId);
    }

    // Paid plans: unlimited
    if (quota.plan !== 'free') {
      return { allowed: true, remainingToday: Infinity };
    }

    const remaining = quota.dailyLimit - quota.dailyUsed;

    if (remaining <= 0) {
      return {
        allowed: false,
        reason: `You've used all ${quota.dailyLimit} free sessions today. Come back tomorrow or upgrade to Pro!`,
        remainingToday: 0,
      };
    }

    return { allowed: true, remainingToday: remaining };
  }

  // ── Consume ───────────────────────────────────────────────────────────────

  /**
   * Call this AFTER a session completes successfully.
   * pre_recorded sessions don't count against the daily quota.
   */
  async consumeQuota(
    userId: string,
    sessionType: SessionType
  ): Promise<void> {
    const quota = await this.getUserQuota(userId);
    if (!quota) throw new Error('[QuotaService] Quota record not found');

    const isPreRecorded = sessionType === 'pre_recorded';
    const quotaDelta = isPreRecorded ? 0 : 1;

    await updateDoc(doc(db, 'quotas', userId), {
      dailyUsed: quota.dailyUsed + quotaDelta,
      totalSessionsAllTime: quota.totalSessionsAllTime + 1,
      lastSessionDate: new Date().toISOString(),
    });
  }

  // ── Upgrade / Downgrade ───────────────────────────────────────────────────

  async upgradeToPaid(
    userId: string,
    plan: 'pro' | 'premium',
    endDate: Date
  ): Promise<void> {
    await updateDoc(doc(db, 'quotas', userId), {
      plan,
      subscriptionStatus: 'active',
      subscriptionEndDate: endDate.toISOString(),
      dailyLimit: Number.MAX_SAFE_INTEGER,
    });
  }

  async downgradeToFree(userId: string): Promise<void> {
    await updateDoc(doc(db, 'quotas', userId), {
      plan: 'free',
      subscriptionStatus: 'expired',
      dailyLimit: FREE_DAILY_LIMIT,
      subscriptionEndDate: null,
    });
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private async _createFreeQuota(userId: string): Promise<UserQuota> {
    const now = new Date().toISOString();
    const quota: UserQuota = {
      userId,
      plan: 'free',
      dailyLimit: FREE_DAILY_LIMIT,
      dailyUsed: 0,
      lastResetDate: todayUTC(),
      totalSessionsAllTime: 0,
      subscriptionStatus: 'active',
      lastSessionDate: now,
      createdAt: now,
    };
    await setDoc(doc(db, 'quotas', userId), quota);
    return quota;
  }

  private async _resetDaily(userId: string): Promise<void> {
    await updateDoc(doc(db, 'quotas', userId), {
      dailyUsed: 0,
      lastResetDate: todayUTC(),
    });
  }
}

export const quotaService = new QuotaService();
