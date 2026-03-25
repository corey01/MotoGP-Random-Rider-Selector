"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { fetchSubscriptions, fetchDisabledSubSeries } from "@/utils/subscriptions";
import { SERIES_GROUPS, type SeriesKey, type SubSeriesKey } from "@/app/_components/Calendar/filterConfig";
import { useAuth } from "@/app/_components/AuthProvider";

interface SubscriptionsContextValue {
  subscribedSeries: SeriesKey[];
  disabledSubSeries: SubSeriesKey[];
  isLoaded: boolean;
  reload: () => Promise<void>;
}

const SubscriptionsContext = createContext<SubscriptionsContextValue>({
  subscribedSeries: SERIES_GROUPS.map((g) => g.key),
  disabledSubSeries: [],
  isLoaded: false,
  reload: async () => {},
});

export function SubscriptionsProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [subscribedSeries, setSubscribedSeries] = useState<SeriesKey[]>(
    SERIES_GROUPS.map((g) => g.key)
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
      setSubscribedSeries(series.length > 0 ? series : SERIES_GROUPS.map((g) => g.key));
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
