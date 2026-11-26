import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { AuthController } from './auth-controller';
import type { AuthService, ClientLink } from './auth-types';

function session(id: string): Session {
  return { access_token: `test-${id}`, refresh_token: 'test-refresh', token_type: 'bearer', expires_in: 3600,
    user: { id, aud: 'authenticated', app_metadata: {}, user_metadata: { role: 'pt' }, created_at: '2026-11-26T00:00:00Z' } };
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}
function fixture(initialSession: Session | null = null) {
  let callback: ((event: AuthChangeEvent, session: Session | null) => void) | null = null;
  const unsubscribe = vi.fn();
  const service: AuthService = {
    getSession: vi.fn(async () => initialSession),
    subscribe: vi.fn(listener => { callback = listener; return unsubscribe; }),
    loadIdentity: vi.fn<AuthService['loadIdentity']>(async userId => ({ profile: { id: userId, role: 'pt', full_name: 'PT' }, client: null })),
    signIn: vi.fn(async () => session('A')),
    signInWithGoogle: vi.fn(async () => {}),
    signUpForInvitation: vi.fn(async () => {}),
    signOut: vi.fn(async () => { callback?.('SIGNED_OUT', null); }),
    requestPasswordReset: vi.fn(async () => {}), updatePassword: vi.fn(async () => {}),
    acceptInvitation: vi.fn(async () => 'client-A'),
  };
  const load = vi.fn(async () => service);
  const controller = new AuthController(true, load);
  return { controller, service, load, unsubscribe, emit: (event: AuthChangeEvent, value: Session | null) => callback?.(event, value) };
}
async function settle() { await vi.runAllTimersAsync(); }

describe('auth lifecycle and isolation', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('does not initialize a client or network when cloud auth is disabled', async () => {
    const load = vi.fn<() => Promise<AuthService>>();
    const controller = new AuthController(false, load);
    const stop = controller.start();
    await settle();
    expect(controller.getSnapshot()).toMatchObject({ status: 'disabled', disabledReason: 'feature-disabled', session: null });
    await expect(controller.signIn('test@example.com', 'password')).rejects.toThrow('chưa được bật');
    expect(load).not.toHaveBeenCalled();
    expect(controller.getSnapshot()).toMatchObject({ status: 'disabled', disabledReason: 'feature-disabled' });
    stop();
  });

  it('supports PT without self-client and uses only the server role', async () => {
    const f = fixture(session('A'));
    f.controller.start();
    await settle();
    expect(f.controller.getSnapshot()).toMatchObject({ status: 'ready', profile: { role: 'pt' }, clientId: null });
    vi.mocked(f.service.loadIdentity).mockResolvedValue({ profile: { id: 'A', role: 'client', full_name: 'Client' }, client: null });
    f.emit('TOKEN_REFRESHED', session('A'));
    await settle();
    expect(f.controller.getSnapshot()).toMatchObject({ status: 'unlinked', profile: { role: 'client' }, clientId: null });
  });

  it('distinguishes missing profile, missing client, and disabled linked client', async () => {
    const f = fixture(session('A'));
    vi.mocked(f.service.loadIdentity).mockResolvedValue({ profile: null, client: null });
    f.controller.start();
    await settle();
    expect(f.controller.getSnapshot().status).toBe('unlinked');
    const client: ClientLink = { id: 'client-A', user_id: 'A', pt_id: 'pt', status: 'paused', archived_at: null };
    vi.mocked(f.service.loadIdentity).mockResolvedValue({ profile: { id: 'A', role: 'client', full_name: 'Client' }, client });
    f.emit('SIGNED_IN', session('A'));
    await settle();
    expect(f.controller.getSnapshot()).toMatchObject({ status: 'disabled', disabledReason: 'account-disabled', clientId: null });
  });

  it('defers SDK profile calls until the auth callback has returned', async () => {
    const f = fixture();
    f.controller.start();
    await settle();
    f.emit('SIGNED_IN', session('A'));
    expect(f.service.loadIdentity).not.toHaveBeenCalled();
    expect(f.controller.getSnapshot().status).toBe('loading');
    await settle();
    expect(f.service.loadIdentity).toHaveBeenCalledOnce();
  });

  it('ignores an old initial session result after a newer account event', async () => {
    const initial = deferred<Session | null>();
    const f = fixture();
    vi.mocked(f.service.getSession).mockReturnValue(initial.promise);
    f.controller.start();
    await settle();
    f.emit('SIGNED_IN', session('B'));
    await settle();
    initial.resolve(session('A'));
    await settle();
    expect(f.controller.getSnapshot().profile?.id).toBe('B');
  });

  it('ignores an initial session error after a newer account event', async () => {
    const initial = deferred<Session | null>();
    const f = fixture();
    vi.mocked(f.service.getSession).mockReturnValue(initial.promise);
    f.controller.start();
    await settle();
    f.emit('SIGNED_IN', session('B'));
    initial.reject(new Error('stale initialization'));
    await settle();
    expect(f.controller.getSnapshot().profile?.id).toBe('B');
  });

  it('aborts and ignores late profile A when account B signs in', async () => {
    const profileA = deferred<Awaited<ReturnType<AuthService['loadIdentity']>>>();
    const f = fixture(session('A'));
    vi.mocked(f.service.loadIdentity).mockImplementation(async id => id === 'A' ? profileA.promise
      : { profile: { id, role: 'pt', full_name: 'B' }, client: null });
    f.controller.start();
    await settle();
    const signal = vi.mocked(f.service.loadIdentity).mock.calls[0]![1];
    f.emit('SIGNED_IN', session('B'));
    expect(signal.aborted).toBe(true);
    expect(f.controller.getSnapshot().profile).toBeNull();
    await settle();
    profileA.resolve({ profile: { id: 'A', role: 'pt', full_name: 'A' }, client: null });
    await settle();
    expect(f.controller.getSnapshot().profile?.id).toBe('B');
  });

  it('clears identity before logout and never restores a late profile', async () => {
    const pending = deferred<Awaited<ReturnType<AuthService['loadIdentity']>>>();
    const f = fixture(session('A'));
    vi.mocked(f.service.loadIdentity).mockReturnValue(pending.promise);
    f.controller.start();
    await settle();
    const out = f.controller.signOut();
    expect(f.controller.getSnapshot()).toMatchObject({ status: 'signedOut', session: null, profile: null, clientId: null });
    await out;
    pending.resolve({ profile: { id: 'A', role: 'pt', full_name: 'A' }, client: null });
    await settle();
    expect(f.controller.getSnapshot().status).toBe('signedOut');
  });

  it('keeps logout failures visible and blocks token refresh from restoring the account', async () => {
    const f = fixture(session('A'));
    f.controller.start();
    await settle();
    vi.mocked(f.service.signOut).mockRejectedValue(new Error('network logout failed'));
    await expect(f.controller.signOut()).rejects.toThrow('network');
    f.emit('TOKEN_REFRESHED', session('A'));
    await settle();
    expect(f.controller.getSnapshot()).toMatchObject({ status: 'error', session: null, profile: null, error: 'network logout failed' });
    await expect(f.controller.refreshProfile()).rejects.toThrow('đăng xuất lại');
  });

  it('unsubscribes and does not publish identity after disposal or duplicate StrictMode mount', async () => {
    const f = fixture(session('A'));
    const stop = f.controller.start();
    await settle();
    stop();
    expect(f.unsubscribe).toHaveBeenCalledOnce();
    f.emit('SIGNED_IN', session('B'));
    await settle();
    expect(f.controller.getSnapshot().profile?.id).toBe('A');
    const stopAgain = f.controller.start();
    await settle();
    expect(f.service.subscribe).toHaveBeenCalledTimes(2);
    stopAgain();
  });

  it('keeps recovery through token events and signs out after updating password', async () => {
    const f = fixture();
    f.controller.start();
    await settle();
    f.emit('PASSWORD_RECOVERY', session('A'));
    f.emit('TOKEN_REFRESHED', session('A'));
    await settle();
    expect(f.controller.getSnapshot().status).toBe('recovery');
    expect(f.service.loadIdentity).not.toHaveBeenCalled();
    await f.controller.updatePassword('new-password');
    expect(f.service.updatePassword).toHaveBeenCalledWith('new-password');
    expect(f.controller.getSnapshot().status).toBe('signedOut');
    await expect(f.controller.updatePassword('again')).rejects.toThrow('liên kết');
  });

  it('does not turn a profile network failure into a mock user or linked account', async () => {
    const f = fixture(session('A'));
    vi.mocked(f.service.loadIdentity).mockRejectedValue(new Error('offline'));
    f.controller.start();
    await settle();
    expect(f.controller.getSnapshot()).toMatchObject({ status: 'error', error: 'offline', profile: null, clientId: null });
  });

  it('rejects mismatched profile identity', async () => {
    const f = fixture(session('A'));
    vi.mocked(f.service.loadIdentity).mockResolvedValue({ profile: { id: 'B', role: 'pt', full_name: 'B' }, client: null });
    f.controller.start();
    await settle();
    expect(f.controller.getSnapshot()).toMatchObject({ status: 'error', profile: null });
  });

  it('rejects invitation for PT and refreshes only the current client after acceptance', async () => {
    const f = fixture(session('A'));
    f.controller.start();
    await settle();
    await expect(f.controller.acceptInvitation('test-invite')).rejects.toThrow('học viên');
    vi.mocked(f.service.loadIdentity).mockResolvedValue({ profile: { id: 'A', role: 'client', full_name: 'A' }, client: null });
    f.emit('SIGNED_IN', session('A'));
    await settle();
    await f.controller.acceptInvitation('test-invite');
    expect(f.service.acceptInvitation).toHaveBeenCalledWith('test-invite');
    await settle();
  });

  it('does not restore a sign-in response that arrives after logout', async () => {
    const f = fixture();
    const pending = deferred<Session>();
    vi.mocked(f.service.signIn).mockReturnValue(pending.promise);
    f.controller.start();
    await settle();
    const login = f.controller.signIn('a@example.com', 'password');
    await settle();
    await f.controller.signOut();
    pending.resolve(session('A'));
    await login;
    f.emit('TOKEN_REFRESHED', session('A'));
    await settle();
    expect(f.controller.getSnapshot()).toMatchObject({ status: 'signedOut', session: null, profile: null });
  });

  it('does not let a late logout error clear a new login', async () => {
    const f = fixture(session('A'));
    const pending = deferred<void>();
    vi.mocked(f.service.signOut).mockReturnValue(pending.promise);
    f.controller.start();
    await settle();
    const logout = f.controller.signOut().catch(() => {});
    await settle();
    vi.mocked(f.service.signIn).mockResolvedValue(session('B'));
    await f.controller.signIn('b@example.com', 'password');
    await settle();
    pending.reject(new Error('old logout error'));
    await logout;
    expect(f.controller.getSnapshot()).toMatchObject({ status: 'ready', profile: { id: 'B' } });
  });

  it('keeps recovery state for retry when updating the password fails', async () => {
    const f = fixture();
    f.controller.start();
    await settle();
    f.emit('PASSWORD_RECOVERY', session('A'));
    vi.mocked(f.service.updatePassword).mockRejectedValue(new Error('password rejected'));
    await expect(f.controller.updatePassword('weak')).rejects.toThrow('password rejected');
    expect(f.controller.getSnapshot().status).toBe('recovery');
    expect(f.service.signOut).not.toHaveBeenCalled();
  });
});
