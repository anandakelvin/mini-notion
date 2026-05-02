import axios, { isCancel } from "axios";
import { useAuthStore } from "frontend/src/stores/auth.store";
import { useCallback, useEffect, useRef, useState } from "react";
 
// ─── Types ────────────────────────────────────────────────────────────────────
 
type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
 
interface FetchOptions<TBody = unknown> {
  method?: HttpMethod;
  body?: TBody;
  headers?: Record<string, string>;
  /** Skip auto-fetch on mount (useful for mutations). Defaults to false. */
  manual?: boolean;
  /** Called right before redirect on 401. Use to clear tokens / local state. */
  onUnauthorized?: () => void;
  /** Path to redirect to on 401. Defaults to "/auth". */
  authRedirectPath?: string;
}

interface FetchState<TData> {
  data: TData | null;
  error: Error | null;
  isLoading: boolean;
}

interface UseFetchReturn<TData, TBody> extends FetchState<TData> {
  /** Re-run (or manually trigger) the request, optionally overriding the body. */
  execute: (overrideBody?: TBody) => Promise<TData | null>;
  /** Reset state back to initial values. */
  reset: () => void;
}

function initialState<TData>(): FetchState<TData> {
  return { data: null, error: null, isLoading: false };
}

export function useFetch<TData = unknown, TBody = unknown>(
  url: string,
  options: FetchOptions<TBody> = {}
): UseFetchReturn<TData, TBody> {
  const {
    method = "GET",
    body,
    headers = {},
    manual = false,
    onUnauthorized,
  } = options;
	const authReset = useAuthStore(state => state.reset)

  const [state, setState] = useState<FetchState<TData>>(initialState<TData>);
 
  // Stable ref so the execute callback never becomes stale
  const abortRef = useRef<AbortController | null>(null);
 
  const execute = useCallback(
    async (overrideBody?: TBody): Promise<TData | null> => {
      // Cancel any in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
 
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
 
      const requestBody = overrideBody ?? body;
 
      try {
        const response = await axios(url, {
          method: method.toLowerCase(),
          signal: controller.signal,
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
          data:
            requestBody !== undefined
              ? JSON.stringify(requestBody)
              : undefined,
        });
        setState({ data: response.data, error: null, isLoading: false });
        return response.data;
      } catch (err: any) {
        if (isCancel(err)) {
          return null
        } 
        
        if (err.response?.status === 401) {
          onUnauthorized?.();
          authReset()
          setState({
            data: null,
            error: new Error("Unauthorized — redirecting to auth"),
            isLoading: false,
          });
        } else {
          setState({ data: null, error: err.response?.data ?? err, isLoading: false });
        }
        throw err
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [url, method, JSON.stringify(body), JSON.stringify(headers)]
  );
 
  // Auto-fetch on mount (unless manual)
  useEffect(() => {
    if (!manual) {
      execute();
    }
 
    return () => {
      abortRef.current?.abort();
    };
  }, [execute, manual]);
 
  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState(initialState<TData>());
  }, []);
 
  return { ...state, execute, reset };
}