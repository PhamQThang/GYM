import { useEffect, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { AuthContext } from './auth-context';
import { AuthController } from './auth-controller';
import { loadAuthService } from './auth-service';

export function AuthProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const controller = useMemo(() => new AuthController(enabled, loadAuthService), [enabled]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  useEffect(() => controller.start(), [controller]);
  const value = useMemo(() => ({
    state,
    signIn: controller.signIn,
    signInWithGoogle: controller.signInWithGoogle,
    signUpForInvitation: controller.signUpForInvitation,
    signOut: controller.signOut,
    requestPasswordReset: controller.requestPasswordReset,
    updatePassword: controller.updatePassword,
    acceptInvitation: controller.acceptInvitation,
    refreshProfile: controller.refreshProfile,
  }), [controller, state]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
