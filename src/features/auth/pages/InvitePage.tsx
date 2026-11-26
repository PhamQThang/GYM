import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth-context';
import { AuthFrame, AuthLoading, AuthNotice } from './AuthFrame';
import { LoginForm } from './LoginForm';
import { InvitationSignUp } from './InvitationSignUp';
import { authActionError, readInvitationToken } from './form-validation';
import { buttonClass, secondaryButtonClass } from './form-styles';
import { GoogleSignInButton, invitationReturnKey } from './GoogleSignInButton';

export function InvitePage() {
  const { state, acceptInvitation, signOut } = useAuth();
  const { hash } = useLocation();
  const token = readInvitationToken(hash || window.location.hash);
  const [busy, setBusy] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creatingAccount, setCreatingAccount] = useState(false);
  // The fragment is not sent to the server; remove it once the invitation is consumed.
  useEffect(() => {
    if (accepted) window.history.replaceState(window.history.state, '', window.location.pathname);
  }, [accepted]);
  useEffect(() => {
    window.sessionStorage?.removeItem(invitationReturnKey);
  }, [hash]);
  async function accept() {
    if (!token || busy || !state.session?.user.email_confirmed_at || state.profile?.role !== 'client') return;
    setBusy(true); setError(null);
    try { await acceptInvitation(token); setAccepted(true); }
    catch { setError('Không thể nhận lời mời. Hãy kiểm tra đúng email đã được mời; lời mời có thể đã hết hạn, bị thu hồi hoặc đã được sử dụng.'); }
    finally { setBusy(false); }
  }
  async function switchAccount() {
    if (busy) return;
    setBusy(true); setError(null);
    try { await signOut(); }
    catch { setError('Chưa thể xác nhận đăng xuất. Vui lòng thử lại.'); }
    finally { setBusy(false); }
  }
  if (state.status === 'recovery') return <Navigate to="/reset-password" replace />;
  return <AuthFrame title="Lời mời từ PT" description="Xác nhận để liên kết tài khoản với hồ sơ học viên đã được PT chuẩn bị.">
    {error && <AuthNotice error>{error}</AuthNotice>}
    {!error && state.error && <AuthNotice error>{authActionError(new Error(state.error))}</AuthNotice>}
    {accepted ? <><AuthNotice>Đã nhận lời mời và liên kết hồ sơ.</AuthNotice><Link to="/client" className={buttonClass + ' block text-center'}>Tiếp tục</Link></>
      : !token ? <AuthNotice error>Đường dẫn mời thiếu mã hợp lệ. Hãy mở đầy đủ đường dẫn PT đã gửi hoặc đề nghị cấp lời mời mới.</AuthNotice>
        : state.status === 'loading' ? <AuthLoading />
          : state.status === 'disabled' ? <AuthNotice>Tài khoản hoặc tính năng đăng nhập hiện chưa khả dụng. Vui lòng liên hệ PT.</AuthNotice>
            : !state.session ? <>
              {creatingAccount ? <InvitationSignUp /> : <><GoogleSignInButton invitationToken={token} /><LoginForm invitation /></>}
              <button className={secondaryButtonClass} onClick={() => setCreatingAccount(value => !value)}>{creatingAccount ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Tạo tài khoản học viên'}</button>
            </>
              : <>
                <p className="text-sm text-[var(--color-text-muted)]">Bạn đang đăng nhập bằng <strong className="break-all text-[var(--color-text-main)]">{state.session.user.email}</strong>.</p>
                {!state.session.user.email_confirmed_at && <AuthNotice error>Hãy xác minh email rồi mở lại lời mời để tiếp tục.</AuthNotice>}
                {state.profile?.role !== 'client' && <AuthNotice error>Hãy đăng nhập bằng tài khoản học viên để nhận lời mời. Nếu hồ sơ chưa tải được, vui lòng thử lại.</AuthNotice>}
                <button className={buttonClass} disabled={busy || !state.session.user.email_confirmed_at || state.profile?.role !== 'client'} onClick={() => void accept()}>{busy ? 'Đang xử lý…' : 'Xác nhận nhận lời mời'}</button>
                <button className={secondaryButtonClass} disabled={busy} onClick={() => void switchAccount()}>Dùng tài khoản khác</button>
              </>}
  </AuthFrame>;
}
