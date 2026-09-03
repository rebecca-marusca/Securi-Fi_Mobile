import { useEffect, useState } from 'react';
import { subscribeToHomeCache } from '@/services/cache';
import type { Cache } from '@/types/firestore';

export function useHomeCache(hid: string | null | undefined) {
  const [cache, setCache] = useState<Cache | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(hid));

  useEffect(() => {
    if (!hid) {
      setCache(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = subscribeToHomeCache(hid, (nextCache) => {
      setCache(nextCache);
      setIsLoading(false);
    });

    return unsubscribe;
  }, [hid]);

  return { cache, isLoading };
}