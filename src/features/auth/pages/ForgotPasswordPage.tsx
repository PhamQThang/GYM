import { useState, type FormEvent } from 'react';
import { useAuth } from '../auth-context';
import { AuthFrame, AuthNotice, LoginLink } from './AuthFrame';
import { authActionError, validateEmail } from './form-validation';
import { buttonClass, inputClass } from './form-styles';

export function ForgotPasswordPage() {
  const { state, requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const invalid = validateEmail(email);
    if (invalid) { setError(invalid); return; }
    setBusy(true); setError(null);
    try { await requestPasswordReset(email.trim()); setSent(true); }
    catch (cause: unknown) { setError(authActionError(cause)); }
    finally { setBusy(false); }
  }
  return (
    <AuthFrame title="Đặt lại mật khẩu" description="Nhập email bạn dùng để đăng nhập. Bạn sẽ nhận hướng dẫn nếu tài khoản đủ điều kiện.">
      {state.status === 'disabled' ? <AuthNotice>Tính năng đăng nhập chưa khả dụng. Vui lòng liên hệ PT.</AuthNotice>
        : sent ? <AuthNotice>Yêu cầu đã được gửi. Hãy kiểm tra email và thư mục thư rác, sau đó mở đường dẫn đặt lại mật khẩu.</AuthNotice>
          : <form onSubmit={submit} className="space-y-5" aria-busy={busy}>
            {error && <AuthNotice error>{error}</AuthNotice>}
            <label className="block space-y-2 text-sm font-medium">Email
              <input className={inputClass} type="email" autoComplete="email" required autoCapitalize="none" spellCheck={false} value={email} disabled={busy} onChange={event => setEmail(event.target.value)} />
            </label>
            <button className={buttonClass} disabled={busy || state.status === 'loading'}>{busy ? 'Đang gửi…' : 'Gửi hướng dẫn'}</button>
          </form>}
      <LoginLink />
    </AuthFrame>
  );
}
