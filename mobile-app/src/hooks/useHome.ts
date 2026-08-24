import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { subscribeToUserHomeLinks, subscribeToHome } from '@/services/homes';
import type { Home } from '@/types/firestore';

export function useHome() {
  const { user } = useAuth();
  const [hid, setHid] = useState<string | null>(null);
  const [home, setHome] = useState<(Home & { hid: string }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setHid(null);
      setHome(null);
      setIsLoading(false);
      return;
    }

    const unsubscribe = subscribeToUserHomeLinks(user.uid, (links) => {
      // Single-home assumption for now — first linked home wins.
      // Revisit once multi-home support actually matters.
      const primaryHid = links[0]?.hid ?? null;
      setHid(primaryHid);
      if (!primaryHid) {
        setHome(null);
        setIsLoading(false);
      }
    });

    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!hid) return;
    const unsubscribe = subscribeToHome(hid, (homeData) => {
      setHome(homeData);
      setIsLoading(false);
    });
    return unsubscribe;
  }, [hid]);

  return { home, hid, isLoading, isPaired: hid !== null };
}