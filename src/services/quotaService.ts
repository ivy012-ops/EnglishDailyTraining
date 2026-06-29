// src/services/quotaService.ts
import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  increment,
  collection,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';

const STATS_DOC = doc(db, '_platform', 'stats');

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

export interface PlatformStats {
  totalUsers: number;
  totalSessionsAllTime: number;
  freeUsers: number;
  paidUsers: number;
  sessionsByDay: Record<string, number>;
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
    // Update platform stats
    if (!isPreRecorded) {
      await setDoc(STATS_DOC, {
        totalSessionsAllTime: increment(1),
        [`sessionsByDay.${todayUTC()}`]: increment(1),
      }, { merge: true }).catch(() => {});
    }
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
    await setDoc(STATS_DOC, { freeUsers: increment(-1), paidUsers: increment(1) }, { merge: true }).catch(() => {});
  }

  async downgradeToFree(userId: string): Promise<void> {
    await updateDoc(doc(db, 'quotas', userId), {
      plan: 'free',
      subscriptionStatus: 'expired',
      dailyLimit: FREE_DAILY_LIMIT,
      subscriptionEndDate: null,
    });
    await setDoc(STATS_DOC, { freeUsers: increment(1), paidUsers: increment(-1) }, { merge: true }).catch(() => {});
  }

  async getPlatformStats(): Promise<PlatformStats | null> {
    try {
      const snap = await getDoc(STATS_DOC);
      if (snap.exists()) return snap.data() as PlatformStats;
      // Doc doesn't exist yet — seed it from quota docs
      return await this.seedPlatformStats();
    } catch {
      return null;
    }
  }

  async seedPlatformStats(): Promise<PlatformStats | null> {
    try {
      const allQuotas = await getDocs(collection(db, 'quotas'));
      let totalUsers = 0, totalSessionsAllTime = 0, freeUsers = 0, paidUsers = 0;
      const sessionsByDay: Record<string, number> = {};

      allQuotas.forEach(d => {
        const q = d.data() as UserQuota;
        totalUsers++;
        totalSessionsAllTime += q.totalSessionsAllTime ?? 0;
        if (q.plan === 'free') freeUsers++; else paidUsers++;
        // Attribute all-time sessions to last session date as best approximation
        if (q.lastSessionDate) {
          const day = q.lastSessionDate.split('T')[0];
          sessionsByDay[day] = (sessionsByDay[day] ?? 0) + (q.dailyUsed ?? 0);
        }
      });

      const stats: PlatformStats = { totalUsers, totalSessionsAllTime, freeUsers, paidUsers, sessionsByDay };
      await setDoc(STATS_DOC, stats, { merge: true });
      return stats;
    } catch {
      return null;
    }
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
    // Track new user in platform stats
    await setDoc(STATS_DOC, {
      totalUsers: increment(1),
      totalSessionsAllTime: increment(0),
      freeUsers: increment(1),
      paidUsers: increment(0),
    }, { merge: true }).catch(() => {});
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
