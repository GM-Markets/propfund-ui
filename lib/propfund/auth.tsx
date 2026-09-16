"use client";

/**
 * Sign-in for Propfund (PRD §2).
 *
 * `useAuth()` is the only API screens use. Three modes (lib/propfund/config.ts):
 * - `privy`: real sign-in. The provider SDK loads client-side only
 *   (lib/propfund/privy-bridge.tsx) and reports its state here.
 * - `test`: no app ID + `NEXT_PUBLIC_TEST_CONTROLS=true`. "Continue as test user".
 * - `unconfigured`: no app ID, no test flag. The sign-in dialog explains it.
 *
 * The signed-in user is also pushed into the mock service session, so all app
 * data is keyed by the sign-in user id.
 */
import * as React from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

import { AUTH_MODE, type AuthMode } from "@/lib/propfund/config";
import { startEngine } from "@/lib/propfund/mock/engine";
import { readJson, removeKey, storageKeys, writeJson } from "@/lib/propfund/mock/storage";
import { setSessionUser } from "@/lib/propfund/mock/store";

export type AuthUser = {
  /** Sign-in user id: the key for all Propfund data. */
  id: string;
  email?: string;
  /** The Propfund wallet (embedded EVM wallet). */
  walletAddress?: string;
};

export type SignInMethod = "email" | "google" | "wallet";

export type SignInOptions = {
  /** Navigate here once signed in (e.g. "/dashboard/challenges"). */
  redirectTo?: string;
};

export type AuthContextValue = {
  mode: AuthMode;
  /** False until the sign-in state is known. Render a skeleton meanwhile. */
  ready: boolean;
  authenticated: boolean;
  user: AuthUser | null;
  /** Opens the sign-in dialog (or navigates to `redirectTo` if already signed in). */
  signIn: (options?: SignInOptions) => void;
  signOut: () => Promise<void>;
};

/** Internal: the dialog + method handlers used by <SignInDialog /> and the dashboard gate. */
export type AuthInternals = {
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  /** Privy mode: start a method. Test mode: sign in as the test user. */
  signInWith: (method: SignInMethod | "test") => void;
  providerLoaded: boolean;
};

export const TEST_USER_ID = "test-user";
/** Deterministic test Propfund wallet. */
export const TEST_WALLET_ADDRESS = "0x7E5700000000000000000000000000000000Beef";

const AuthContext = React.createContext<(AuthContextValue & AuthInternals) | null>(null);

// Loaded only in the browser and only when an app ID is configured.
const PrivyBridge = dynamic(() => import("./privy-bridge").then((m) => m.PrivyBridge), {
  ssr: false,
});

export type BridgeState = {
  ready: boolean;
  authenticated: boolean;
  user: AuthUser | null;
};

export type BridgeHandle = {
  login: (method: SignInMethod) => void;
  logout: () => Promise<void>;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const mode = AUTH_MODE;

  const [state, setState] = React.useState<BridgeState>({
    ready: mode === "unconfigured",
    authenticated: false,
    user: null,
  });
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [providerLoaded, setProviderLoaded] = React.useState(false);
  const bridge = React.useRef<BridgeHandle | null>(null);
  const pendingRedirect = React.useRef<string | null>(null);

  // Test mode: restore a previous "Continue as test user" session.
  React.useEffect(() => {
    if (mode !== "test") return;
    const signedIn = readJson<boolean>(storageKeys.testSession) === true;
    setState({
      ready: true,
      authenticated: signedIn,
      user: signedIn ? { id: TEST_USER_ID, walletAddress: TEST_WALLET_ADDRESS } : null,
    });
  }, [mode]);

  // Keep the mock service session in step with sign-in.
  const userId = state.user?.id ?? null;
  const email = state.user?.email ?? null;
  const walletAddress = state.user?.walletAddress ?? null;
  React.useEffect(() => {
    if (!state.ready) return;
    if (state.authenticated && userId) {
      startEngine();
      void setSessionUser({ id: userId, email, walletAddress });
    } else {
      void setSessionUser(null);
    }
  }, [state.ready, state.authenticated, userId, email, walletAddress]);

  // Close the dialog and follow a pending redirect once signed in.
  React.useEffect(() => {
    if (!state.authenticated) return;
    setDialogOpen(false);
    const to = pendingRedirect.current;
    if (to) {
      pendingRedirect.current = null;
      router.push(to);
    }
  }, [state.authenticated, router]);

  const signIn = React.useCallback(
    (options?: SignInOptions) => {
      if (state.authenticated) {
        if (options?.redirectTo) router.push(options.redirectTo);
        return;
      }
      pendingRedirect.current = options?.redirectTo ?? null;
      setDialogOpen(true);
    },
    [state.authenticated, router],
  );

  const signInWith = React.useCallback(
    (method: SignInMethod | "test") => {
      if (method === "test") {
        if (mode !== "test") return;
        writeJson(storageKeys.testSession, true);
        setState({
          ready: true,
          authenticated: true,
          user: { id: TEST_USER_ID, walletAddress: TEST_WALLET_ADDRESS },
        });
        return;
      }
      if (mode !== "privy" || !bridge.current) return;
      // Close ours first so its focus trap doesn't fight the provider's modal.
      setDialogOpen(false);
      bridge.current.login(method);
    },
    [mode],
  );

  const signOut = React.useCallback(async () => {
    if (mode === "test") {
      removeKey(storageKeys.testSession);
      setState({ ready: true, authenticated: false, user: null });
    } else if (mode === "privy" && bridge.current) {
      await bridge.current.logout();
    }
    await setSessionUser(null);
  }, [mode]);

  const register = React.useCallback((handle: BridgeHandle | null) => {
    bridge.current = handle;
    setProviderLoaded(!!handle);
  }, []);

  const value = React.useMemo(
    () => ({
      mode,
      ready: state.ready,
      authenticated: state.authenticated,
      user: state.user,
      signIn,
      signOut,
      dialogOpen,
      setDialogOpen,
      signInWith,
      providerLoaded,
    }),
    [mode, state, signIn, signOut, dialogOpen, signInWith, providerLoaded],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      {mode === "privy" && <PrivyBridge onState={setState} register={register} />}
    </AuthContext.Provider>
  );
}

function useAuthContext() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>.");
  return ctx;
}

/** `{ mode, ready, authenticated, user: { id, email?, walletAddress? }, signIn(), signOut() }` */
export function useAuth(): AuthContextValue {
  const { mode, ready, authenticated, user, signIn, signOut } = useAuthContext();
  return React.useMemo(
    () => ({ mode, ready, authenticated, user, signIn, signOut }),
    [mode, ready, authenticated, user, signIn, signOut],
  );
}

/** For the sign-in dialog and dashboard gate only. */
export function useAuthInternals(): AuthContextValue & AuthInternals {
  return useAuthContext();
}
