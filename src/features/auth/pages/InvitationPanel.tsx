import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AuthLoading, AuthNotice } from './AuthFrame';
import { buttonClass, inputClass, secondaryButtonClass } from './form-styles';
import { validateEmail } from './form-validation';
import { loadInvitationService, type InviteCandidate, type IssuedInvitation, type PendingInvitation } from './invitation-service';

/** Parent keys this component by authenticated owner; old requests cannot publish into a new account. */
export function InvitationPanel({ ownerId }: { ownerId: string }) {
  const [clients, setClients] = useState<InviteCandidate[]>([]);
  const [pending, setPending] = useState<PendingInvitation[]>([]);
  const [selected, setSelected] = useState('');
  const [issued, setIssued] = useState<IssuedInvitation | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listFailed, setListFailed] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    void loadInvitationService().then(service => service.list(ownerId, controller.signal)).then(result => {
      if (controller.signal.aborted) return;
      setClients(result.clients); setPending(result.pending); setLoading(false);
    }).catch(() => {
      if (!controller.signal.aborted) { setListFailed(true); setLoading(false); }
    });
    return () => { mounted.current = false; controller.abort(); };
  }, [ownerId, reload]);
  const current = pending.find(invitation => invitation.client_id === selected);
  function showInvitation(clientId: string, result: IssuedInvitation) {
    setIssued(result);
    setPending(rows => [...rows.filter(row => row.client_id !== clientId), { id: result.invitation_id, client_id: clientId, expires_at: result.expires_at }]);
  }
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || loading) return;
    const invalid = !name.trim() ? 'Vui lòng nhập họ tên học viên.' : validateEmail(email);
    if (invalid) { setError(invalid); return; }
    setBusy(true); setError(null); setNotice(null); setIssued(null);
    let saved = false;
    try {
      const service = await loadInvitationService();
      if (!mounted.current) return;
      const client = await service.createClient(ownerId, name, email);
      if (!mounted.current) return;
      saved = true;
      setClients(rows => [...rows, client].sort((a, b) => a.full_name.localeCompare(b.full_name, 'vi')));
      setSelected(client.id);
      setShowForm(false); setName(''); setEmail('');
      const result = await service.issue(client.id);
      if (mounted.current) showInvitation(client.id, result);
    } catch (cause) {
      if (!mounted.current) return;
      if (saved) setError('Đã lưu hồ sơ. Hãy chọn “Tạo đường dẫn mời” để thử cấp lại.');
      else if (cause instanceof Error && cause.message === 'duplicate-client-email') setError('Email này đã có trong danh sách học viên của bạn.');
      else setError('Chưa lưu được hồ sơ học viên. Vui lòng thử lại.');
    } finally { if (mounted.current) setBusy(false); }
  }
  async function issue() {
    if (busy || !clients.some(client => client.id === selected)) return;
    setBusy(true); setError(null); setNotice(null); setIssued(null);
    try {
      const service = await loadInvitationService();
      if (!mounted.current) return;
      const result = await service.issue(selected);
      if (!mounted.current) return;
      showInvitation(selected, result);
    } catch { if (mounted.current) setError('Chưa cấp được lời mời. Hãy kiểm tra hồ sơ học viên và thử lại.'); }
    finally { if (mounted.current) setBusy(false); }
  }
  async function revoke() {
    if (busy || !current) return;
    setBusy(true); setError(null); setNotice(null);
    try {
      const service = await loadInvitationService();
      if (!mounted.current) return;
      await service.revoke(current.id);
      if (!mounted.current) return;
      setPending(rows => rows.filter(row => row.id !== current.id)); setIssued(null); setNotice('Đã thu hồi lời mời.');
    } catch { if (mounted.current) setError('Chưa thu hồi được lời mời. Vui lòng thử lại.'); }
    finally { if (mounted.current) setBusy(false); }
  }
  const link = issued ? `${window.location.origin}/invite#token=${issued.token}` : '';
  async function copy() {
    try { await navigator.clipboard.writeText(link); if (mounted.current) setNotice('Đã sao chép đường dẫn mời.'); }
    catch { if (mounted.current) setNotice('Không thể tự sao chép. Bạn có thể chọn và sao chép đường dẫn bên dưới.'); }
  }
  return <section className="space-y-4 border-t border-[var(--color-border)] pt-6" aria-labelledby="invitation-heading">
    <h2 id="invitation-heading" className="text-lg font-bold">Mời học viên</h2>
    <p className="text-sm leading-6 text-[var(--color-text-muted)]">Chọn hồ sơ chưa liên kết tài khoản. Học viên cần tài khoản được cấp và email đã xác minh để nhận lời mời.</p>
    {error && <AuthNotice error>{error}</AuthNotice>}
    {listFailed && <><AuthNotice error>Chưa tải được danh sách lời mời.</AuthNotice>
      <button className={secondaryButtonClass} disabled={busy} onClick={() => { setListFailed(false); setLoading(true); setReload(value => value + 1); }}>Tải lại danh sách</button></>}
    {notice && <AuthNotice>{notice}</AuthNotice>}
    <button type="button" className={secondaryButtonClass} aria-expanded={showForm} aria-controls="new-client-form" disabled={busy}
      onClick={() => { setShowForm(value => !value); setError(null); }}>
      {showForm ? 'Đóng biểu mẫu' : 'Thêm học viên'}
    </button>
    {showForm && <form id="new-client-form" className="space-y-3" aria-busy={busy} onSubmit={event => void create(event)}>
      <label className="block space-y-2 text-sm font-medium">Họ tên học viên
        <input className={inputClass} autoComplete="off" required maxLength={150} value={name} disabled={busy} onChange={event => setName(event.target.value)} />
      </label>
      <label className="block space-y-2 text-sm font-medium">Email học viên
        <input className={inputClass} type="email" autoComplete="off" required maxLength={254} value={email} disabled={busy} onChange={event => setEmail(event.target.value)} />
      </label>
      <button type="submit" className={buttonClass} disabled={busy || loading}>{busy ? 'Đang lưu…' : 'Lưu và tạo đường dẫn mời'}</button>
    </form>}
    {loading ? <AuthLoading /> : clients.length === 0 ? !listFailed && <AuthNotice>Chưa có hồ sơ học viên đủ điều kiện nhận lời mời.</AuthNotice> : <>
      <label className="block space-y-2 text-sm font-medium">Học viên
        <select className={inputClass} value={selected} disabled={busy} onChange={event => { setSelected(event.target.value); setIssued(null); setNotice(null); }}>
          <option value="">Chọn học viên</option>
          {clients.map(client => <option key={client.id} value={client.id}>{client.full_name} — {client.email}</option>)}
        </select>
      </label>
      {current && <p className="text-sm text-[var(--color-text-muted)]">Lời mời hiện tại hết hạn {new Date(current.expires_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}. Cấp lại sẽ vô hiệu hóa đường dẫn cũ.</p>}
      <button className={buttonClass} disabled={busy || !selected} onClick={() => void issue()}>{busy ? 'Đang xử lý…' : current ? 'Cấp lại lời mời' : 'Tạo đường dẫn mời'}</button>
      {current && <button className={secondaryButtonClass} disabled={busy} onClick={() => void revoke()}>Thu hồi lời mời</button>}
      {issued && <div className="space-y-3">
        <label className="block space-y-2 text-sm font-medium">Đường dẫn mời
          <input className={inputClass} readOnly value={link} onFocus={event => event.target.select()} />
        </label>
        <button className={secondaryButtonClass} onClick={() => void copy()}>Sao chép đường dẫn</button>
        <p className="text-xs leading-5 text-[var(--color-text-muted)]">Chỉ gửi riêng cho học viên đã chọn. Đường dẫn chỉ hiển thị trong lần cấp này và chưa được gửi tự động.</p>
      </div>}
    </>}
  </section>;
}
