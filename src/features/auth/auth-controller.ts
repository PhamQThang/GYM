import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import type { AuthActions, AuthService, AuthState } from './auth-types';

const blank = (status: AuthState['status']): AuthState => ({
  status, session: null, profile: null, clientId: null, error: null, disabledReason: null,
});
const message = (error: unknown) => error instanceof Error ? error.message : 'Không thể kết nối tài khoản. Vui lòng thử lại.';

/** Owns only authentication state. Never imports or hydrates the demo tracker store. */
export class AuthController implements AuthActions {
  private state: AuthState;
  private listeners = new Set<() => void>();
  private servicePromise: Promise<AuthService> | null = null;
  private unsubscribe: (() => void) | null = null;
  private request: AbortController | null = null;
  private queued: ReturnType<typeof setTimeout> | null = null;
  private active = false;
  private lifecycle = 0;
  private generation = 0;
  private actionGeneration = 0;
  private logoutBarrier = false;
  private recoveryUserId: string | null = null;

  constructor(private enabled: boolean, private loadService: () => Promise<AuthService>) {
    this.state = enabled ? blank('loading') : { ...blank('disabled'), disabledReason: 'feature-disabled' };
  }

  getSnapshot = (): AuthState => this.state;
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };
  private publish(state: AuthState) {
    this.state = state;
    this.listeners.forEach(listener => listener());
  }
  private invalidate() {
    this.generation++;
    this.request?.abort();
    this.request = null;
    if (this.queued !== null) clearTimeout(this.queued);
    this.queued = null;
    return this.generation;
  }
  private service(): Promise<AuthService> {
    if (!this.enabled || !this.active) return Promise.reject(new Error('Đăng nhập cloud chưa được bật.'));
    this.servicePromise ??= this.loadService();
    return this.servicePromise;
  }

  start = (): (() => void) => {
    this.active = true;
    const lifecycle = ++this.lifecycle;
    const initialGeneration = this.generation;
    if (this.enabled) {
      void this.service().then(async service => {
        if (!this.active || lifecycle !== this.lifecycle) return;
        const generation = this.generation;
        this.unsubscribe = service.subscribe((event, session) => {
          if (this.active && lifecycle === this.lifecycle) this.onEvent(event, session);
        });
        const session = await service.getSession();
        if (this.active && lifecycle === this.lifecycle && generation === this.generation) this.applySession(session);
      }).catch(error => {
        if (this.active && lifecycle === this.lifecycle && initialGeneration === this.generation && this.state.status === 'loading') {
          this.publish({ ...blank('error'), error: message(error) });
        }
      });
    }
    return () => {
      if (lifecycle !== this.lifecycle) return;
      this.active = false;
      this.lifecycle++;
      this.actionGeneration++;
      this.invalidate();
      this.unsubscribe?.();
      this.unsubscribe = null;
    };
  };

  private onEvent(event: AuthChangeEvent, session: Session | null) {
    if (event === 'SIGNED_OUT') {
      if (!this.logoutBarrier) this.actionGeneration++;
      this.recoveryUserId = null;
      this.invalidate();
      this.publish(blank('signedOut'));
      return;
    }
    if (this.logoutBarrier) return;
    if (!this.state.session && (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED')) return;
    if (event === 'SIGNED_IN') this.actionGeneration++;
    if (event === 'PASSWORD_RECOVERY' && session) this.recoveryUserId = session.user.id;
    this.applySession(session);
  }

  private applySession(session: Session | null) {
    const generation = this.invalidate();
    if (!session) {
      this.recoveryUserId = null;
      this.publish(blank('signedOut'));
      return;
    }
    if (this.recoveryUserId === session.user.id) {
      this.publish({ ...blank('recovery'), session });
      return;
    }
    this.recoveryUserId = null;
    this.publish({ ...blank('loading'), session });
    // Supabase emits events while holding its auth lock. Never call SDK methods
    // inside that callback: leave the callback before querying the trusted profile.
    this.queued = setTimeout(() => {
      this.queued = null;
      void this.loadIdentity(session, generation);
    }, 0);
  }

  private async loadIdentity(session: Session, generation: number) {
    const request = new AbortController();
    this.request = request;
    try {
      const service = await this.service();
      if (!this.active || generation !== this.generation) return;
      const { profile, client } = await service.loadIdentity(session.user.id, request.signal);
      if (!this.active || generation !== this.generation || request.signal.aborted) return;
      if (!profile) {
        this.publish({ ...blank('unlinked'), session });
        return;
      }
      if (profile.id !== session.user.id || (client && client.user_id !== session.user.id)) {
        throw new Error('Hồ sơ tài khoản không khớp phiên đăng nhập.');
      }
      if (profile.role === 'client' && client && (client.status !== 'active' || client.archived_at !== null)) {
        this.publish({ ...blank('disabled'), session, profile, disabledReason: 'account-disabled' });
        return;
      }
      this.publish({ ...blank(profile.role === 'client' && !client ? 'unlinked' : 'ready'),
        session, profile, clientId: client?.id ?? null });
    } catch (error) {
      if (this.active && generation === this.generation && !request.signal.aborted) {
        this.publish({ ...blank('error'), session, error: message(error) });
      }
    }
  }

  signIn = async (email: string, password: string): Promise<void> => {
    if (!this.enabled || !this.active) throw new Error('Đăng nhập cloud chưa được bật.');
    const action = ++this.actionGeneration;
    this.logoutBarrier = false;
    this.recoveryUserId = null;
    this.invalidate();
    this.publish(blank('loading'));
    try {
      const service = await this.service();
      if (!this.active || action !== this.actionGeneration) return;
      const session = await service.signIn(email, password);
      if (this.active && action === this.actionGeneration) this.applySession(session);
    } catch (error) {
      if (this.active && action === this.actionGeneration) {
        this.invalidate();
        this.publish({ ...blank('signedOut'), error: message(error) });
      }
      throw error;
    }
  };

  signOut = async (): Promise<void> => {
    if (!this.enabled || !this.active) throw new Error('Đăng nhập cloud chưa được bật.');
    // Clear identity immediately, even if the network request fails.
    this.logoutBarrier = true;
    this.recoveryUserId = null;
    const action = ++this.actionGeneration;
    this.invalidate();
    this.publish(blank('signedOut'));
    try {
      const service = await this.service();
      if (!this.active || action !== this.actionGeneration) return;
      await service.signOut();
      if (this.active && action === this.actionGeneration) this.logoutBarrier = false;
    } catch (error) {
      if (this.active && action === this.actionGeneration) this.publish({ ...blank('error'), error: message(error) });
      throw error;
    }
  };

  signInWithGoogle = async (): Promise<void> => {
    if (this.state.session) throw new Error('Hãy đăng xuất để đổi tài khoản.');
    const service = await this.service();
    if (this.state.session || !this.active) throw new Error('Phiên tài khoản đã thay đổi. Vui lòng thử lại.');
    await service.signInWithGoogle();
  };

  signUpForInvitation = async (email: string, password: string): Promise<void> => {
    if (this.state.session) throw new Error('Đăng xuất tài khoản hiện tại trước khi tạo tài khoản học viên.');
    const service = await this.service();
    if (this.state.session || !this.active) throw new Error('Phiên tài khoản đã thay đổi. Vui lòng thử lại.');
    await service.signUpForInvitation(email, password);
  };

  requestPasswordReset = async (email: string, redirectTo?: string): Promise<void> => {
    const service = await this.service();
    await service.requestPasswordReset(email, redirectTo);
  };

  updatePassword = async (password: string): Promise<void> => {
    if (this.state.status !== 'recovery' || !this.state.session) throw new Error('Hãy mở liên kết đặt lại mật khẩu hợp lệ từ email.');
    const userId = this.state.session.user.id;
    const service = await this.service();
    if (this.state.session?.user.id !== userId || !this.active) throw new Error('Phiên tài khoản đã thay đổi. Vui lòng thử lại.');
    await service.updatePassword(password);
    if (this.state.session?.user.id === userId && this.active) await this.signOut();
  };

  acceptInvitation = async (token: string): Promise<void> => {
    const userId = this.state.session?.user.id;
    if (!userId || this.state.profile?.role !== 'client') throw new Error('Đăng nhập bằng tài khoản học viên để nhận lời mời.');
    const service = await this.service();
    if (this.state.session?.user.id !== userId || !this.active) throw new Error('Phiên tài khoản đã thay đổi. Vui lòng thử lại.');
    await service.acceptInvitation(token);
    if (this.state.session?.user.id === userId && this.active) await this.refreshProfile();
  };

  refreshProfile = async (): Promise<void> => {
    if (this.logoutBarrier) throw new Error('Vui lòng đăng xuất lại hoặc đăng nhập trước khi tải hồ sơ.');
    const generation = this.generation;
    const service = await this.service();
    const session = await service.getSession();
    if (this.active && generation === this.generation) this.applySession(session);
  };
}
