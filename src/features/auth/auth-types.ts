import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

export type AuthProfile = { id: string; full_name: string; role: 'pt' | 'client' };
export type ClientLink = { id: string; user_id: string | null; pt_id: string; status: 'active' | 'paused' | 'inactive'; archived_at: string | null };
export type AuthStatus = 'disabled' | 'loading' | 'signedOut' | 'ready' | 'unlinked' | 'error' | 'recovery';
export interface AuthState {
  status: AuthStatus;
  session: Session | null;
  profile: AuthProfile | null;
  clientId: string | null;
  error: string | null;
  disabledReason: 'feature-disabled' | 'account-disabled' | null;
}

export interface AuthService {
  getSession(): Promise<Session | null>;
  subscribe(callback: (event: AuthChangeEvent, session: Session | null) => void): () => void;
  loadIdentity(userId: string, signal: AbortSignal): Promise<{ profile: AuthProfile | null; client: ClientLink | null }>;
  signIn(email: string, password: string): Promise<Session>;
  signInWithGoogle(): Promise<void>;
  signUpForInvitation(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  requestPasswordReset(email: string, redirectTo?: string): Promise<void>;
  updatePassword(password: string): Promise<void>;
  acceptInvitation(token: string): Promise<string>;
}

export interface AuthActions {
  signIn(email: string, password: string): Promise<void>;
  signInWithGoogle(): Promise<void>;
  signUpForInvitation(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  requestPasswordReset(email: string, redirectTo?: string): Promise<void>;
  updatePassword(password: string): Promise<void>;
  acceptInvitation(token: string): Promise<void>;
  refreshProfile(): Promise<void>;
}
export type AuthContextValue = AuthActions & { state: AuthState };
