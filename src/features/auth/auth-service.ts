import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../lib/database.types';
import type { AuthService } from './auth-types';

function cleanAuthCallbackUrl() {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  const fragment = new URLSearchParams(url.hash.slice(1));
  const keys = ['code', 'access_token', 'refresh_token', 'expires_in', 'expires_at', 'token_type', 'type', 'error', 'error_code', 'error_description'];
  let changed = false;
  for (const params of [url.searchParams, fragment]) {
    if (['code', 'access_token', 'error', 'error_code'].some(key => params.has(key))) {
      keys.forEach(key => params.delete(key));
      changed = true;
    }
  }
  if (changed) {
    url.hash = fragment.toString();
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
  }
}

export function createAuthService(client: SupabaseClient<Database>): AuthService {
  let initialized = false;
  return {
    async getSession() {
      if (!initialized) {
        initialized = true;
        // SDK consumes recovery/invite callback credentials before we remove them
        // from the address bar. Custom invitation #token is deliberately untouched.
        const { error } = await client.auth.initialize();
        cleanAuthCallbackUrl();
        if (error) throw new Error('Liên kết xác thực không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu liên kết mới.');
      }
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      return data.session;
    },
    subscribe(callback) {
      const { data } = client.auth.onAuthStateChange(callback);
      return () => data.subscription.unsubscribe();
    },
    async loadIdentity(userId, signal) {
      const { data: profile, error: profileError } = await client.from('profiles')
        .select('id,full_name,role').eq('id', userId).abortSignal(signal).maybeSingle();
      if (profileError) throw profileError;
      if (!profile) return { profile: null, client: null };
      if (profile.role !== 'pt' && profile.role !== 'client') throw new Error('Vai trò tài khoản không hợp lệ.');
      const { data: linkedClient, error: clientError } = await client.from('clients')
        .select('id,user_id,pt_id,status,archived_at').eq('user_id', userId).abortSignal(signal).maybeSingle();
      if (clientError) throw clientError;
      return { profile, client: linkedClient };
    },
    async signIn(email, password) {
      const { data, error } = await client.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      if (!data.session) throw new Error('Chưa nhận được phiên đăng nhập.');
      return data.session;
    },
    async signInWithGoogle() {
      const { error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: new URL('/auth/callback', window.location.origin).href,
          queryParams: { prompt: 'select_account' },
        },
      });
      if (error) throw error;
    },
    async signUpForInvitation(email, password) {
      const { error } = await client.auth.signUp({
        email: email.trim(), password,
        options: { emailRedirectTo: new URL('/auth/callback', window.location.origin).href },
      });
      if (error) throw error;
    },
    async signOut() {
      const { error } = await client.auth.signOut({ scope: 'local' });
      if (error) throw new Error('Đã khóa giao diện tài khoản nhưng chưa xác nhận thu hồi phiên trên máy chủ. Vui lòng thử đăng xuất lại.');
    },
    async requestPasswordReset(email, redirectTo) {
      const target = new URL(redirectTo ?? '/reset-password', window.location.origin);
      if (target.origin !== window.location.origin) throw new Error('Đường dẫn đặt lại mật khẩu không hợp lệ.');
      const { error } = await client.auth.resetPasswordForEmail(email.trim(), { redirectTo: target.href });
      if (error) throw error;
    },
    async updatePassword(password) {
      const { error } = await client.auth.updateUser({ password });
      if (error) throw error;
    },
    async acceptInvitation(token) {
      const { data, error } = await client.rpc('accept_client_invitation', { p_token: token });
      // Do not surface Postgres details that may contain invitation identifiers.
      if (error || !data) throw new Error('Không thể nhận lời mời. Kiểm tra email đã xác minh, thời hạn và trạng thái lời mời.');
      return data;
    },
  };
}

export async function loadAuthService(): Promise<AuthService> {
  const { supabase } = await import('../../lib/supabase');
  return createAuthService(supabase);
}
