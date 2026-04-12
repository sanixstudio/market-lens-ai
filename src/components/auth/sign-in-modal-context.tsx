"use client";

import { SignInButton } from "@clerk/nextjs";
import { createContext, useCallback, useContext, useRef } from "react";

const SignInModalContext = createContext<(() => void) | null>(null);

/**
 * Opens Clerk’s sign-in modal (same as `SignInButton` with `mode="modal"`).
 * No-op if the provider is missing.
 */
export function useOpenSignInModal(): () => void {
  const open = useContext(SignInModalContext);
  return open ?? (() => {});
}

/**
 * Mounts a hidden `SignInButton` and exposes a function to open the modal programmatically.
 * Must render inside `ClerkProvider`.
 */
export function SignInModalProvider({ children }: { children: React.ReactNode }) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const open = useCallback(() => {
    triggerRef.current?.click();
  }, []);

  return (
    <SignInModalContext.Provider value={open}>
      <SignInButton mode="modal">
        <button
          ref={triggerRef}
          type="button"
          className="fixed left-0 top-0 h-px w-px overflow-hidden p-0 opacity-0"
          tabIndex={-1}
        >
          <span className="sr-only">Open sign in</span>
        </button>
      </SignInButton>
      {children}
    </SignInModalContext.Provider>
  );
}
