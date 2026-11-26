import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../lib/database.types';
import { createAuthService } from './auth-service';

function fixture() {
  const auth = {
    initialize: vi.fn(async () => ({ error: null })),
    getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
    signInWithPassword: vi.fn(),
    signInWithOAuth: vi.fn(async () => ({ error: null })),
    signUp: vi.fn(async () => ({ error: null })),
    signOut: vi.fn(async () => ({ error: null })),
    resetPasswordForEmail: vi.fn(async () => ({ error: null })),
    updateUser: vi.fn(async () => ({ error: null })),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  };
  const rpc = vi.fn(async () => ({ data: 'client-id', error: null }));
  const query = { select: vi.fn(), eq: vi.fn(), abortSignal: vi.fn(), maybeSingle: vi.fn() };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.abortSignal.mockReturnValue(query);
  const from = vi.fn(() => query);
  const client = { auth, rpc, from } as unknown as SupabaseClient<Database>;
  return { auth, rpc, query, from, service: createAuthService(client) };
}

describe('Supabase auth service', () => {
  beforeEach(() => vi.stubGlobal('window', {
    location: { origin: 'https://gym.example', href: 'https://gym.example/login' },
    history: { state: null, replaceState: vi.fn() },
  }));
  afterEach(() => vi.unstubAllGlobals());

  it('starts Google OAuth with a fixed same-origin callback and account picker', async () => {
    const f = fixture();
    await f.service.signInWithGoogle();
    expect(f.auth.signInWithOAuth).toHaveBeenCalledExactlyOnceWith({
      provider: 'google',
      options: { redirectTo: 'https://gym.example/auth/callback', queryParams: { prompt: 'select_account' } },
    });
    expect(f.auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it('signs up invite recipients without privileged role metadata or automatic acceptance', async () => {
    const f = fixture();
    await f.service.signUpForInvitation(' learner@example.com ', 'new-password');
    expect(f.auth.signUp).toHaveBeenCalledExactlyOnceWith({
      email: 'learner@example.com', password: 'new-password', options: { emailRedirectTo: 'https://gym.example/auth/callback' },
    });
    expect(f.rpc).not.toHaveBeenCalled();
  });

  it('uses the exact typed verified-invitation RPC contract', async () => {
    const f = fixture();
    await expect(f.service.acceptInvitation('opaque-token')).resolves.toBe('client-id');
    expect(f.rpc).toHaveBeenCalledExactlyOnceWith('accept_client_invitation', { p_token: 'opaque-token' });
  });

  it('requests a same-origin reset redirect and rejects arbitrary origins', async () => {
    const f = fixture();
    await f.service.requestPasswordReset(' learner@example.com ');
    expect(f.auth.resetPasswordForEmail).toHaveBeenCalledExactlyOnceWith('learner@example.com', { redirectTo: 'https://gym.example/reset-password' });
    await expect(f.service.requestPasswordReset('learner@example.com', 'https://evil.example/reset')).rejects.toThrow('không hợp lệ');
    expect(f.auth.resetPasswordForEmail).toHaveBeenCalledTimes(1);
  });

  it('uses local signout and propagates revocation failure without claiming success', async () => {
    const f = fixture();
    await f.service.signOut();
    expect(f.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
    f.auth.signOut.mockResolvedValue({ error: new Error('network') } as never);
    await expect(f.service.signOut()).rejects.toThrow('chưa xác nhận thu hồi');
  });

  it('queries explicit profile and client metadata scoped to the session user', async () => {
    const f = fixture();
    f.query.maybeSingle.mockResolvedValueOnce({ data: { id: 'A', full_name: 'A', role: 'client' }, error: null })
      .mockResolvedValueOnce({ data: { id: 'client-A', user_id: 'A', pt_id: 'PT', status: 'active', archived_at: null }, error: null });
    const signal = new AbortController().signal;
    const result = await f.service.loadIdentity('A', signal);
    expect(result.profile?.role).toBe('client');
    expect(f.from.mock.calls).toEqual([['profiles'], ['clients']]);
    expect(f.query.select.mock.calls).toEqual([['id,full_name,role'], ['id,user_id,pt_id,status,archived_at']]);
    expect(f.query.eq.mock.calls).toEqual([['id', 'A'], ['user_id', 'A']]);
    expect(f.query.abortSignal).toHaveBeenCalledWith(signal);
  });

  it('surfaces profile failures instead of trying a mock or unscoped query', async () => {
    const f = fixture();
    f.query.maybeSingle.mockResolvedValue({ data: null, error: new Error('profile offline') });
    await expect(f.service.loadIdentity('A', new AbortController().signal)).rejects.toThrow('profile offline');
    expect(f.from).toHaveBeenCalledExactlyOnceWith('profiles');
  });

  it('waits for SDK callback consumption before removing residual auth secrets', async () => {
    const f = fixture();
    window.location.href = 'https://gym.example/auth/callback?code=auth-code&next=account#token=custom-invite';
    await f.service.getSession();
    expect(f.auth.initialize).toHaveBeenCalledOnce();
    expect(window.history.replaceState).toHaveBeenCalledWith(null, '', '/auth/callback?next=account#token=custom-invite');
    expect(f.auth.initialize.mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(window.history.replaceState).mock.invocationCallOrder[0]!);
  });

  it('sanitizes failed callback URLs and provides an error without token details', async () => {
    const f = fixture();
    window.location.href = 'https://gym.example/auth/callback#error=access_denied&error_description=secret-details';
    f.auth.initialize.mockResolvedValue({ error: new Error('secret-details') } as never);
    await expect(f.service.getSession()).rejects.toThrow('Liên kết xác thực không hợp lệ');
    expect(window.history.replaceState).toHaveBeenCalledWith(null, '', '/auth/callback');
    expect(f.auth.getSession).not.toHaveBeenCalled();
  });
});
