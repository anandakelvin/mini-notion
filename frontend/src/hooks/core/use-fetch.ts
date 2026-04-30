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
  /** HTTP status of the last completed response. */
  status: number | null;
}

interface UseFetchReturn<TData, TBody> extends FetchState<TData> {
  /** Re-run (or manually trigger) the request, optionally overriding the body. */
  execute: (overrideBody?: TBody) => Promise<TData | null>;
  /** Reset state back to initial values. */
  reset: () => void;
}

function initialState<TData>(): FetchState<TData> {
  return { data: null, error: null, isLoading: false, status: null };
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
        const response = await fetch(url, {
          method,
          signal: controller.signal,
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
          body:
            requestBody !== undefined
              ? JSON.stringify(requestBody)
              : undefined,
        });

        // ── 401 handling ────────────────────────────────────────────────────
        if (response.status === 401) {
          onUnauthorized?.();
          authReset()
          setState({
            data: null,
            error: new Error("Unauthorized — redirecting to auth"),
            isLoading: false,
            status: 401,
          });
          return null;
        }
 
        // ── Non-2xx errors ───────────────────────────────────────────────────
        if (!response.ok) {
          const message = await response
            .text()
            .catch(() => `HTTP error ${response.status}`);
          throw new Error(message || `HTTP error ${response.status}`);
        }
 
        // ── Success ──────────────────────────────────────────────────────────
        const contentType = response.headers.get("content-type") ?? "";
        const data: TData = contentType.includes("application/json")
          ? await response.json()
          : ((await response.text()) as unknown as TData);

        setState({ data, error: null, isLoading: false, status: response.status });
        return data;
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          // Request was intentionally cancelled — don't update state
          return null;
        }
 
        const error = err instanceof Error ? err : new Error(String(err));
        setState({ data: null, error, isLoading: false, status: null });
        return null;
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