import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './features/auth/AuthProvider';
import { useAuth } from './features/auth/auth-context';
import { AccountStatusPage, AuthCallbackPage, ForgotPasswordPage, InvitePage, LoginPage, ResetPasswordPage } from './features/auth/pages';

function AccountRoute({ area }: { area?: 'pt' | 'client' | 'account' }) {
  const { state } = useAuth();
  if (state.status === 'signedOut') return <Navigate replace to="/login" />;
  if (state.status === 'recovery') return <Navigate replace to="/reset-password" />;
  if (state.status === 'ready' && state.profile && area !== 'account' && area !== state.profile.role) {
    return <Navigate replace to={'/' + state.profile.role} />;
  }
  return <AccountStatusPage area={area === 'account' ? undefined : area} />;
}

export default function CloudApp() {
  return <AuthProvider enabled><Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />
    <Route path="/auth/callback" element={<AuthCallbackPage />} />
    <Route path="/invite" element={<InvitePage />} />
    <Route path="/account" element={<AccountRoute area="account" />} />
    <Route path="/pt/*" element={<AccountRoute area="pt" />} />
    <Route path="/client/*" element={<AccountRoute area="client" />} />
    <Route path="*" element={<AccountRoute />} />
  </Routes></AuthProvider>;
}
