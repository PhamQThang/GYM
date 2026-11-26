import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { CloudRoutes } from '../../../CloudApp';
import { WORKOUT_TABS } from '../../../lib/navigation';
import { AuthContext } from '../auth-context';
import type { AuthContextValue, AuthState } from '../auth-types';
import { LoginPage, ResetPasswordPage, InvitePage, AccountStatusPage } from './index';
import { authActionError, readInvitationToken, validateEmail, validateNewPassword } from './form-validation';

const base: AuthState = { status: 'signedOut', session: null, profile: null, clientId: null, error: null, disabledReason: null };
function render(page: ReactNode, overrides: Partial<AuthState> = {}, path = '/') {
  const context: AuthContextValue = {
    state: { ...base, ...overrides }, signIn: vi.fn(), signOut: vi.fn(), requestPasswordReset: vi.fn(),
    signInWithGoogle: vi.fn(), updatePassword: vi.fn(), acceptInvitation: vi.fn(), refreshProfile: vi.fn(), signUpForInvitation: vi.fn(),
  };
  return renderToStaticMarkup(<MemoryRouter initialEntries={[path]}><AuthContext.Provider value={context}>{page}</AuthContext.Provider></MemoryRouter>);
}
afterEach(() => vi.unstubAllGlobals());

describe('auth page guards and safe messages', () => {
  it('shows login form only when enabled', () => {
    expect(render(<LoginPage />)).toContain('Tiếp tục với Google');
    expect(render(<LoginPage />)).toContain('autoComplete="current-password"');
    const disabled = render(<LoginPage />, { status: 'disabled', disabledReason: 'feature-disabled' });
    expect(disabled).toContain('chưa được bật');
    expect(disabled).not.toContain('<form');
    expect(disabled).not.toContain('Tiếp tục với Google');
  });
  it('only shows password update form in a recovery session', () => {
    expect(render(<ResetPasswordPage />, { status: 'ready' })).not.toContain('<form');
    expect(render(<ResetPasswordPage />, { status: 'recovery' })).toContain('autoComplete="new-password"');
  });
  it('requires explicit acceptance and a verified email for invitation', () => {
    vi.stubGlobal('window', { location: { hash: '#token=' + 'a'.repeat(64) } });
    const session = { user: { id: 'test-user', email: 'member@example.test', email_confirmed_at: '2026-11-25T00:00:00Z' } } as Session;
    const profile = { id: 'test-user', full_name: 'Test Member', role: 'client' as const };
    const verified = render(<InvitePage />, { status: 'unlinked', session, profile });
    expect(verified).toContain('Xác nhận nhận lời mời');
    expect(verified).not.toContain('a'.repeat(64));
    expect(verified).not.toContain('disabled=""');
    const unverified = render(<InvitePage />, { status: 'unlinked', profile, session: { ...session, user: { ...session.user, email_confirmed_at: undefined } } });
    expect(unverified).toContain('disabled=""');
    expect(unverified).toContain('Hãy xác minh email');
  });
  it('does not expose invitation creation to client accounts', () => {
    const markup = render(<CloudRoutes />, {
      status: 'ready', profile: { id: 'client-user', full_name: 'Test Member', role: 'client' },
      clientId: 'linked-client', session: { user: { id: 'client-user' } } as Session,
    }, '/client');
    expect(markup).not.toContain('Mời học viên');
  });
  it.each(['pt', 'client'] as const)('links from the account page to the %s area and back', role => {
    const state = {
      status: 'ready' as const,
      profile: { id: 'user', full_name: 'Test Account', role },
      session: { user: { id: 'user' } } as Session,
      clientId: role === 'client' ? 'linked-client' : null,
    };
    const panel = role === 'pt' ? 'Tổng quan PT' : 'Đang tải hồ sơ tập luyện';
    const account = render(<CloudRoutes />, state, '/account');
    expect(account).toContain(`href="/${role}"`);
    expect(account).not.toContain(panel);
    const area = render(<CloudRoutes />, state, '/' + role);
    expect(area).toContain(panel);
    expect(area).toContain('<aside');
    expect(area).toContain('Điều hướng khu vực');
    expect(area).toContain('href="/account"');
    expect(area).toContain(role === 'pt' ? 'href="/pt/clients"' : 'href="/client/workout"');
  });
  it('only offers learner signup inside a syntactically valid invitation', () => {
    vi.stubGlobal('window', { location: { hash: '#token=' + 'a'.repeat(64) } });
    expect(render(<InvitePage />)).toContain('Tạo tài khoản học viên');
    vi.stubGlobal('window', { location: { hash: '#token=invalid' } });
    expect(render(<InvitePage />)).not.toContain('Tạo tài khoản học viên');
    expect(render(<LoginPage />)).not.toContain('Tạo tài khoản học viên');
  });
  it.each(WORKOUT_TABS)('renders the shared $label tab inside the online workout workspace', ({ path, label }) => {
    const markup = render(<CloudRoutes />, {
      status: 'ready', profile: { id: 'learner', full_name: 'Learner', role: 'client' },
      clientId: 'linked-client', session: { user: { id: 'learner' } } as Session,
    }, '/client' + path);
    expect(markup).toContain('Menu tập luyện');
    expect(markup).toMatch(new RegExp('aria-current="page"[^>]*>' + label + '</a>'));
    for (const tab of WORKOUT_TABS) expect(markup).toContain('href="/client' + tab.path + '"');
  });
  it('does not render raw backend errors', () => {
    const markup = render(<AccountStatusPage />, { status: 'error', error: 'https://secret.test?token=private-token' });
    expect(markup).toContain('Chưa tải được');
    expect(markup).not.toContain('private-token');
    expect(authActionError(new Error('https://secret.test?token=private-token'))).not.toContain('private-token');
    expect(render(<LoginPage />, { error: 'Invalid login credentials' })).toContain('Email hoặc mật khẩu không đúng.');
  });
});

describe('auth input validation', () => {
  it('validates email and a matching new password', () => {
    expect(validateEmail(' user@example.test ')).toBeNull();
    expect(validateEmail('user@')).not.toBeNull();
    expect(validateNewPassword('long password', 'long password')).toBeNull();
    expect(validateNewPassword('short', 'short')).not.toBeNull();
    expect(validateNewPassword('long password', 'other password')).not.toBeNull();
  });
  it('only reads one valid migration-004 token from fragment', () => {
    const token = 'a'.repeat(64);
    expect(readInvitationToken('#token=' + token)).toBe(token);
    for (const fragment of ['', '#token=short', '#token=' + token + '&token=' + token, '#access_token=' + token, '?token=' + token]) {
      expect(readInvitationToken(fragment)).toBeNull();
    }
  });
});
