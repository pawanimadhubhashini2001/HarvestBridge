import { useCallback, useEffect, useState } from 'react';

import { getApiError } from '../lib/api';

export function useAsyncData<T>(loader: () => Promise<T>, dependencies: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setData(await loader());
    } catch (requestError) {
      setError(getApiError(requestError));
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload: load };
}
