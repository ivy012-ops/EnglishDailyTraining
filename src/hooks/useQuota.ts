// src/hooks/useQuota.ts
import { useState, useEffect, useCallback } from 'react';
import { quotaService, SessionType, UserQuota } from '../services/quotaService';

export interface UseQuotaReturn {
  quota: UserQuota | null;
  canStart: boolean;
  remaining: number;
  loading: boolean;
  error: string | null;
  checkQuota: () => Promise<boolean>;
  consumeQuota: (type: SessionType) => Promise<void>;
}

export function useQuota(userId: string | null): UseQuotaReturn {
  const [quota, setQuota]         = useState<UserQuota | null>(null);
  const [canStart, setCanStart]   = useState(true);
  const [remaining, setRemaining] = useState(5);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const checkQuota = useCallback(async (): Promise<boolean> => {
    if (!userId) {
      setLoading(false);
      return true; // No user — don't block
    }
    try {
      setLoading(true);
      setError(null);

      const result = await quotaService.canStartSession(userId);
      const q      = await quotaService.getUserQuota(userId);

      setQuota(q);
      setCanStart(result.allowed);
      setRemaining(result.remainingToday);

      return result.allowed;
    } catch (err) {
      setError((err as Error).message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    checkQuota();
  }, [checkQuota]);

  const consumeQuota = useCallback(
    async (type: SessionType): Promise<void> => {
      if (!userId) return;
      try {
        await quotaService.consumeQuota(userId, type);
        await checkQuota();
      } catch (err) {
        setError((err as Error).message);
        throw err;
      }
    },
    [userId, checkQuota]
  );

  return { quota, canStart, remaining, loading, error, checkQuota, consumeQuota };
}
