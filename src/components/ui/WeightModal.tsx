import { useRef, useState, type FormEvent } from 'react';

export function WeightModal({ onClose, onSave, min = 1, max }: {
  onClose: () => void;
  onSave: (weight: number, submissionId: string) => void | Promise<void>;
  min?: number;
  max?: number;
}) {
  const [val, setVal] = useState('');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const submission = useRef<{ weight: number; id: string }>(null);
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = Number(val);
    if (busy || !Number.isFinite(parsed) || parsed < min || (max !== undefined && parsed > max)) return;
    if (submission.current?.weight !== parsed) submission.current = { weight: parsed, id: crypto.randomUUID?.() ?? '' };
    setBusy(true);
    setFailed(false);
    try {
      await onSave(parsed, submission.current.id);
      onClose();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={busy ? undefined : onClose}>
      <div aria-labelledby="weight-modal-title" role="dialog" className="bg-[var(--color-panel-bg)] border border-[var(--color-border)] rounded-2xl p-8 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 id="weight-modal-title" className="text-lg font-bold mb-1">Ghi Nhận Cân Nặng</h3>
        <p className="text-xs text-[var(--color-text-muted)] mb-6">Nhập cân nặng hiện tại của bạn (kg)</p>
        <form onSubmit={event => void handleSubmit(event)} className="flex flex-col gap-4" aria-busy={busy}>
          <input
            type="number"
            step="0.1"
            min={min}
            max={max}
            required
            disabled={busy}
            placeholder="65.0"
            value={val}
            onChange={e => setVal(e.target.value)}
            autoFocus
            aria-label="Cân nặng theo kg"
            className="w-full bg-[var(--color-app-bg)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-xl font-bold text-center outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] transition-colors"
          />
          {failed && <p role="alert" className="text-sm text-red-400">Chưa lưu được cân nặng. Vui lòng thử lại.</p>}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} disabled={busy} className="flex-1 py-3 rounded-xl bg-[var(--color-card-bg)] border border-[var(--color-border)] font-semibold text-sm hover:bg-[var(--color-card-hover)] transition-colors">
              Hủy
            </button>
            <button type="submit" disabled={busy} className="flex-1 py-3 rounded-xl bg-[var(--color-primary)] text-black font-bold text-sm hover:bg-[var(--color-primary-dark)] transition-colors">
              {busy ? 'Đang lưu…' : 'Lưu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}