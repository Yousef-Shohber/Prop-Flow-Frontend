import { QueryClient } from "@tanstack/react-query";
import { normalizeError } from "./errors";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (count, error) => {
        const e = normalizeError(error);
        if (e.status >= 400 && e.status < 500 && e.status !== 429) return false; // client errors never retry
        return count < 1;
      },
    },
    mutations: { retry: false },
  },
});
