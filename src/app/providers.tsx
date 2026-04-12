"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import { SignInModalProvider } from "@/components/auth/sign-in-modal-context";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

/**
 * Provides TanStack Query for API-backed market search and explanations.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={client}>
      <SignInModalProvider>
        <TooltipProvider delay={200} closeDelay={100}>
          {children}
        </TooltipProvider>
      </SignInModalProvider>
      <Toaster position="top-center" richColors closeButton className="z-[520]" />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
