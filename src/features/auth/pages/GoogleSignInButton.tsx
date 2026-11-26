import { useState } from 'react';
import { useAuth } from '../auth-context';
import { AuthNotice } from './AuthFrame';
import { buttonClass } from './form-styles';

export const invitationReturnKey = 'gym-google-invitation';

export function GoogleSignInButton({ invitationToken }: { invitationToken?: string }) {
  const { signInWithGoogle } = useAuth();
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState(false);

  async function start() {
    if (redirecting) return;
    setError(false);
    setRedirecting(true);
    try {
      window.sessionStorage.removeItem(invitationReturnKey);
      if (invitationToken) window.sessionStorage.setItem(invitationReturnKey, `token=${invitationToken}`);
      await signInWithGoogle();
    } catch {
      setError(true);
      setRedirecting(false);
    }
  }

  return <>
    <button type="button" className={buttonClass} disabled={redirecting} onClick={() => void start()}>
      {redirecting ? 'Đang mở Google…' : 'Tiếp tục với Google'}
    </button>
    {error && <AuthNotice error>Chưa thể mở đăng nhập Google. Vui lòng thử lại.</AuthNotice>}
  </>;
}
