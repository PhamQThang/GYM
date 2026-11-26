import { useState, type FormEvent } from 'react';
import { useAuth } from '../auth-context';
import { AuthNotice } from './AuthFrame';
import { authActionError, validateEmail, validateNewPassword } from './form-validation';
import { buttonClass, inputClass } from './form-styles';

export function InvitationSignUp() {
  const { signUpForInvitation } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const invalid = validateEmail(email) ?? validateNewPassword(password, confirmation);
    if (invalid) { setError(invalid); return; }
    setBusy(true); setError(null);
    try { await signUpForInvitation(email.trim(), password); setPassword(''); setConfirmation(''); setSent(true); }
    catch (cause: unknown) { setError(authActionError(cause)); }
    finally { setBusy(false); }
  }
  if (sent) return <AuthNotice>Yêu cầu tạo tài khoản đã được gửi. Hãy kiểm tra email để xác minh, sau đó mở lại đường dẫn mời ban đầu và đăng nhập để xác nhận. Nếu đã có tài khoản, hãy dùng tài khoản đó.</AuthNotice>;
  return <form onSubmit={submit} className="space-y-5" aria-busy={busy}>
    <p className="text-sm leading-6 text-[var(--color-text-muted)]">Dùng đúng email PT đã mời. Tạo tài khoản chưa liên kết hồ sơ; bạn sẽ xác nhận lời mời sau khi xác minh email.</p>
    {error && <AuthNotice error>{error}</AuthNotice>}
    <label className="block space-y-2 text-sm font-medium">Email được mời
      <input className={inputClass} type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} required disabled={busy} value={email} onChange={event => setEmail(event.target.value)} />
    </label>
    <label className="block space-y-2 text-sm font-medium">Mật khẩu
      <input className={inputClass} type="password" autoComplete="new-password" minLength={8} required disabled={busy} value={password} onChange={event => setPassword(event.target.value)} />
    </label>
    <label className="block space-y-2 text-sm font-medium">Nhập lại mật khẩu
      <input className={inputClass} type="password" autoComplete="new-password" minLength={8} required disabled={busy} value={confirmation} onChange={event => setConfirmation(event.target.value)} />
    </label>
    <button className={buttonClass} disabled={busy}>{busy ? 'Đang gửi…' : 'Tạo tài khoản học viên'}</button>
  </form>;
}
