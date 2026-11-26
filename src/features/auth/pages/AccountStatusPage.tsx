import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../auth-context';
import { AuthFrame, AuthLoading, AuthNotice, LoginLink } from './AuthFrame';
import { authActionError } from './form-validation';
import { buttonClass, secondaryButtonClass } from './form-styles';

export function AccountStatusPage() {
  const { state, refreshProfile, signOut } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function run(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true); setError(null);
    try { await action(); } catch (cause: unknown) { setError(authActionError(cause)); }
    finally { setBusy(false); }
  }
  if (state.status === 'recovery') return <Navigate to="/reset-password" replace />;
  const profile = state.status === 'ready' ? state.profile : null;
  const areaTitle = profile?.role === 'pt' ? 'Khu vực PT' : 'Khu vực học viên';
  const title = profile ? 'Tài khoản của bạn' : 'Trạng thái tài khoản';
  return <AuthFrame title={title}>
    {error && <AuthNotice error>{error}</AuthNotice>}
    {state.status === 'loading' ? <AuthLoading />
      : profile ? <>
        <p className="text-lg font-semibold">{profile.full_name}</p>
        <p className="text-sm text-[var(--color-text-muted)]">{profile.role === 'pt' ? 'Huấn luyện viên cá nhân' : 'Học viên'}</p>
        <Link to={'/' + profile.role} className={buttonClass + ' block text-center'}>{areaTitle}</Link>
      </>
        : state.status === 'unlinked' ? <AuthNotice>Tài khoản chưa liên kết với hồ sơ học viên. Hãy mở đường dẫn mời từ PT và xác nhận bằng đúng email của bạn.</AuthNotice>
          : state.status === 'disabled' ? <AuthNotice>{state.disabledReason === 'account-disabled' ? 'Hồ sơ hiện không được phép truy cập. Vui lòng liên hệ PT.' : 'Đăng nhập chưa được bật trên phiên bản này.'}</AuthNotice>
            : state.status === 'error' ? <AuthNotice error>Chưa tải được thông tin tài khoản. Hãy kiểm tra mạng rồi thử lại. Nếu lỗi tiếp diễn, vui lòng liên hệ PT.</AuthNotice>
              : <AuthNotice>Bạn chưa đăng nhập.</AuthNotice>}
    {state.session ? <>
      {state.status !== 'loading' && <button className={secondaryButtonClass} disabled={busy} onClick={() => void run(refreshProfile)}>{busy ? 'Đang xử lý…' : 'Kiểm tra lại tài khoản'}</button>}
      <button className={secondaryButtonClass} disabled={busy} onClick={() => void run(signOut)}>Đăng xuất</button>
    </> : <LoginLink />}
  </AuthFrame>;
}
