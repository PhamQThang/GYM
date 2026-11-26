export function validateEmail(email: string): string | null {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ? null : 'Vui lòng nhập địa chỉ email hợp lệ.';
}

export function validateNewPassword(password: string, confirmation: string): string | null {
  if (password.length < 8) return 'Mật khẩu mới cần ít nhất 8 ký tự.';
  if (password !== confirmation) return 'Hai mật khẩu chưa trùng khớp.';
  return null;
}

/** Only a custom invitation token is accepted; auth access/refresh tokens are not invitations. */
export function readInvitationToken(fragment: string): string | null {
  if (!fragment.startsWith('#')) return null;
  const values = new URLSearchParams(fragment.replace(/^#/, '')).getAll('token');
  if (values.length !== 1) return null;
  const token = values[0];
  return token && /^[0-9a-f]{64}$/.test(token) ? token : null;
}

/** Never render raw provider messages: these can contain URLs or account details. */
export function authActionError(error: unknown): string {
  const code = error instanceof Error ? error.message.toLowerCase() : '';
  if (code.includes('invalid login') || code.includes('invalid_credentials')) return 'Email hoặc mật khẩu không đúng.';
  if (code.includes('email not confirmed') || code.includes('email_not_confirmed')) return 'Hãy xác minh email trước khi tiếp tục.';
  if (code.includes('rate') || code.includes('too many')) return 'Bạn đã thử nhiều lần. Vui lòng đợi một lát rồi thử lại.';
  if (code.includes('weak password') || code.includes('weak_password')) return 'Mật khẩu chưa đáp ứng yêu cầu. Hãy chọn mật khẩu mạnh hơn.';
  if (code.includes('same password') || code.includes('same_password')) return 'Hãy chọn mật khẩu khác mật khẩu hiện tại.';
  if (code.includes('fetch') || code.includes('network')) return 'Không thể kết nối. Hãy kiểm tra mạng rồi thử lại.';
  return 'Chưa thể hoàn tất thao tác. Vui lòng thử lại hoặc liên hệ PT để được hỗ trợ.';
}
