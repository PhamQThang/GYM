import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth-context';
import { AuthFrame, AuthLoading, AuthNotice, LoginLink } from './AuthFrame';
import { authActionError, validateNewPassword } from './form-validation';
import { buttonClass, inputClass } from './form-styles';

export function ResetPasswordPage() {
  const { state, updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || state.status !== 'recovery') return;
    const invalid = validateNewPassword(password, confirmation);
    if (invalid) { setError(invalid); return; }
    setBusy(true); setError(null);
    try { await updatePassword(password); setPassword(''); setConfirmation(''); setSaved(true); }
    catch (cause: unknown) { setError(authActionError(cause)); }
    finally { setBusy(false); }
  }
  return (
    <AuthFrame title="Mật khẩu mới" description="Chọn mật khẩu riêng cho tài khoản, có ít nhất 8 ký tự.">
      {saved ? <><AuthNotice>Đã cập nhật mật khẩu. Bạn có thể tiếp tục đăng nhập.</AuthNotice><LoginLink /></>
        : state.status === 'loading' ? <AuthLoading />
          : state.status !== 'recovery' ? <><AuthNotice error>Đường dẫn khôi phục chưa hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu email đặt lại mật khẩu mới.</AuthNotice><Link to="/forgot-password" className="inline-flex min-h-11 items-center text-[var(--color-primary)]">Gửi lại hướng dẫn</Link></>
            : <form onSubmit={submit} className="space-y-5" aria-busy={busy}>
              {error && <AuthNotice error>{error}</AuthNotice>}
              <label className="block space-y-2 text-sm font-medium">Mật khẩu mới
                <input className={inputClass} type="password" autoComplete="new-password" minLength={8} required value={password} disabled={busy} onChange={event => setPassword(event.target.value)} />
              </label>
              <label className="block space-y-2 text-sm font-medium">Nhập lại mật khẩu
                <input className={inputClass} type="password" autoComplete="new-password" minLength={8} required value={confirmation} disabled={busy} onChange={event => setConfirmation(event.target.value)} />
              </label>
              <button className={buttonClass} disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu mật khẩu mới'}</button>
            </form>}
    </AuthFrame>
  );
}
