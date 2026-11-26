import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth-context';
import { AuthFrame, AuthLoading, AuthNotice, LoginLink } from './AuthFrame';
import { invitationReturnKey } from './GoogleSignInButton';
import { readInvitationToken } from './form-validation';

export function AuthCallbackPage() {
  const { state } = useAuth();
  if (state.status === 'recovery') return <Navigate to="/reset-password" replace />;
  if (state.session && state.status !== 'loading') {
    const token = readInvitationToken('#' + window.sessionStorage?.getItem(invitationReturnKey));
    if (token) return <Navigate to={`/invite#token=${token}`} replace />;
  }
  if (state.status === 'ready') return <Navigate to={state.profile?.role === 'pt' ? '/pt' : '/client'} replace />;
  if (state.session && state.status !== 'loading') return <Navigate to="/account" replace />;
  return <AuthFrame title="Xác minh tài khoản">
    {state.status === 'loading' ? <AuthLoading /> : <><AuthNotice error>Chưa thể xác minh đường dẫn này. Đường dẫn có thể đã hết hạn hoặc đăng nhập chưa khả dụng. Hãy đăng nhập lại hoặc liên hệ PT.</AuthNotice><LoginLink /></>}
  </AuthFrame>;
}
