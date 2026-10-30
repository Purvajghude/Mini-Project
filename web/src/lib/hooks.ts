import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from './api';

export interface Loaded<T> {
  data: T | undefined;
  error: ApiError | null;
  loading: boolean;
  reload(): Promise<void>;
  setData(next: T | ((prev: T | undefined) => T)): void;
}

/** Load once per `deps` change. Errors are surfaced, never replaced with placeholder data. */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[]): Loaded<T> {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const seq = useRef(0);

  const run = useCallback(async () => {
    const id = ++seq.current;
    setLoading(true);
    setError(null);
    try {
      const result = await fn();
      if (id === seq.current) setData(result);
    } catch (e) {
      if (id === seq.current) setError(e instanceof ApiError ? e : new ApiError(String(e), 0));
    } finally {
      if (id === seq.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { void run(); }, [run]);
  return { data, error, loading, reload: run, setData: setData as Loaded<T>['setData'] };
}

/** Wrap an async action with pending + error state. */
export function useAction<A extends unknown[], R>(fn: (...args: A) => Promise<R>) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const run = useCallback(async (...args: A): Promise<R | undefined> => {
    setPending(true);
    setError(null);
    try {
      return await fn(...args);
    } catch (e) {
      setError(e instanceof ApiError ? e : new ApiError(String(e), 0));
      return undefined;
    } finally {
      setPending(false);
    }
  }, [fn]);
  return { run, pending, error, clearError: () => setError(null) };
}
