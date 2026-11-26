import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth-context';
import { AuthFrame, AuthLoading, AuthNotice } from './AuthFrame';
import { LoginForm } from './LoginForm';
import { authActionError } from './form-validation';
import { GoogleSignInButton } from './GoogleSignInButton';

export function LoginPage() {
  const { state } = useAuth();

  if (state.status === 'ready') return <Navigate to={state.profile?.role === 'pt' ? '/pt' : '/client'} replace />;
  if (state.status === 'recovery') return <Navigate to="/reset-password" replace />;
  if (state.session && state.status !== 'loading') return <Navigate to="/account" replace />;
  return (
    <AuthFrame title="Chào mừng trở lại" description="Đăng nhập để truy cập tài khoản PT hoặc học viên của bạn.">
      {state.error && <AuthNotice error>{authActionError(new Error(state.error))}</AuthNotice>}
      {state.status === 'loading' ? <AuthLoading /> : state.status === 'disabled'
        ? <AuthNotice>Đăng nhập chưa được bật trên phiên bản này. Vui lòng liên hệ PT để được hỗ trợ.</AuthNotice>
        : <>
          <GoogleSignInButton />
          <details className="space-y-4">
            <summary className="cursor-pointer text-sm text-[var(--color-text-muted)]">Dùng email và mật khẩu</summary>
            <LoginForm />
          </details>
        </>}
    </AuthFrame>
  );
}
