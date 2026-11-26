import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth-context';
import { AuthNotice } from './AuthFrame';
import { authActionError, validateEmail } from './form-validation';
import { buttonClass, inputClass } from './form-styles';

export function LoginForm({ invitation = false }: { invitation?: boolean }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const invalid = validateEmail(email) ?? (!password ? 'Vui lòng nhập mật khẩu.' : null);
    if (invalid) { setError(invalid); return; }
    setBusy(true);
    setError(null);
    try { await signIn(email.trim(), password); setPassword(''); }
    catch (cause: unknown) { setError(authActionError(cause)); }
    finally { setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="space-y-5" aria-busy={busy}>
      {error && <AuthNotice error>{error}</AuthNotice>}
      <label className="block space-y-2 text-sm font-medium">Email
        <input className={inputClass} type="email" autoComplete="username" autoCapitalize="none" spellCheck={false} required value={email} disabled={busy} onChange={event => setEmail(event.target.value)} />
      </label>
      <label className="block space-y-2 text-sm font-medium">Mật khẩu
        <input className={inputClass} type="password" autoComplete="current-password" required value={password} disabled={busy} onChange={event => setPassword(event.target.value)} />
      </label>
      <button type="submit" disabled={busy} className={buttonClass}>{busy ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>
      {invitation
        ? <p className="text-sm leading-6 text-[var(--color-text-muted)]">Dùng tài khoản có email đã xác minh và trùng với email được mời. Nếu quên mật khẩu, hãy đặt lại tại trang đăng nhập rồi mở lại lời mời.</p>
        : <Link to="/forgot-password" className="inline-flex min-h-11 items-center text-sm text-[var(--color-primary)] hover:underline">Quên mật khẩu?</Link>}
    </form>
  );
}
