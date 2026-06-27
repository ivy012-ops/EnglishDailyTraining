// src/hooks/useQuota.ts
import { useState, useEffect, useCallback } from 'react';
import { quotaService, SessionType, UserQuota } from '../services/quotaService';
import { useAuth } from './useAuth';

export interface UseQuotaReturn {
  quota: UserQuota | null;
  canStart: boolean;
  remaining: number;      // Infinity for paid users
  isPaid: boolean;
  loading: boolean;
  error: string | null;
  checkQuota: () => Promise<boolean>;
  consumeQuota: (type: SessionType) => Promise<void>;
}

export function useQuota(): UseQuotaReturn {
  const { user } = useAuth();

  const [quota, setQuota]       = useState<UserQuota | null>(null);
  const [canStart, setCanStart] = useState(true);
  const [remaining, setRemaining] = useState(5);
  const [isPaid, setIsPaid]     = useState(false);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const checkQuota = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    try {
      setLoading(true);
      setError(null);

      const result = await quotaService.canStartSession(user.uid);
      const q      = await quotaService.getUserQuota(user.uid);

      setQuota(q);
      setCanStart(result.allowed);
      setRemaining(result.remainingToday);
      setIsPaid(q?.plan !== 'free');

      return result.allowed;
    } catch (err) {
      const msg = (err as Error).message;
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load on mount and when user changes
  useEffect(() => {
    if (user) {
      checkQuota();
    } else {
      setLoading(false);
    }
  }, [user, checkQuota]);

  const consumeQuota = useCallback(
    async (type: SessionType): Promise<void> => {
      if (!user) return;
      try {
        await quotaService.consumeQuota(user.uid, type);
        await checkQuota(); // refresh state
      } catch (err) {
        setError((err as Error).message);
        throw err;
      }
    },
    [user, checkQuota]
  );

  return {
    quota,
    canStart,
    remaining,
    isPaid,
    loading,
    error,
    checkQuota,
    consumeQuota,
  };
}
