"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { DEFAULT_SERIES_KEYS, type SeriesKey, type SubSeriesKey } from "@/consts/series";
import { fetchSubscriptions, fetchDisabledSubSeries } from "@/utils/subscriptions";
import { useAuth } from "@/app/_components/AuthProvider";

interface SubscriptionsContextValue {
  subscribedSeries: SeriesKey[];
  disabledSubSeries: SubSeriesKey[];
  isLoaded: boolean;
  reload: () => Promise<void>;
}

const SubscriptionsContext = createContext<SubscriptionsContextValue>({
  subscribedSeries: DEFAULT_SERIES_KEYS,
  disabledSubSeries: [],
  isLoaded: false,
  reload: async () => {},
});

export function SubscriptionsProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [subscribedSeries, setSubscribedSeries] = useState<SeriesKey[]>(
    DEFAULT_SERIES_KEYS
  );
  const [disabledSubSeries, setDisabledSubSeries] = useState<SubSeriesKey[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [series, disabled] = await Promise.all([
        fetchSubscriptions(),
        fetchDisabledSubSeries(),
      ]);
      setSubscribedSeries(series.length > 0 ? series : DEFAULT_SERIES_KEYS);
      setDisabledSubSeries(disabled);
    } catch {
      // keep defaults
    } finally {
      setIsLoaded(true);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <SubscriptionsContext.Provider
      value={{ subscribedSeries, disabledSubSeries, isLoaded, reload: load }}
    >
      {children}
    </SubscriptionsContext.Provider>
  );
}

export function useSubscriptions(): SubscriptionsContextValue {
  return useContext(SubscriptionsContext);
}
