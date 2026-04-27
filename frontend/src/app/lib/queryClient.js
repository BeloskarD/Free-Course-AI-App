'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

// Shared queryClient instance — accessible from outside the React tree (e.g. AuthContext)
let sharedQueryClient = null;

export function getQueryClient() {
  return sharedQueryClient;
}

// This handles data fetching and caching for the entire app
export function QueryProviders({ children }) {
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000, // Cache data for 5 minutes
          retry: 1,
          refetchOnWindowFocus: false, // Fix: Stops reloading when switching tabs
        },
      },
    });
    sharedQueryClient = client;
    return client;
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
