import { useMemo } from 'react';
import { useHome } from '@/hooks/useHome';
import type { CacheEntry } from '@/types/firestore';

/**
 * Returns the most recent CacheEntry written by the server to homes/{hid}.lastPackage.
 * The server updates this on every telemetry tick, so it is always the latest single
 * package. For the full in-memory ring buffer, use requestCacheForHome + subscribeToOnDemandCache.
 */
export function useLastPackage(): { lastPackage: CacheEntry | null; isLoading: boolean } {
  const { home, isLoading } = useHome();

  const lastPackage = useMemo<CacheEntry | null>(() => {
    if (!home?.lastPackage) return null;
    return home.lastPackage;
  }, [home?.lastPackage]);

  return { lastPackage, isLoading };
}