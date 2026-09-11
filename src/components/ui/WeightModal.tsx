import { useState, FormEvent } from 'react';

export function WeightModal({ onClose, onSave }: { onClose: () => void; onSave: (w: number) => void }) {
  const [val, setVal] = useState('');
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed > 0) {
      onSave(parsed);
      onClose();
    }
  };
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div aria-labelledby="weight-modal-title" role="dialog" className="bg-[var(--color-panel-bg)] border border-[var(--color-border)] rounded-2xl p-8 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 id="weight-modal-title" className="text-lg font-bold mb-1">Ghi Nhận Cân Nặng</h3>
        <p className="text-xs text-[var(--color-text-muted)] mb-6">Nhập cân nặng hiện tại của bạn (kg)</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="number"
            step="0.1"
            min="1"
            placeholder="65.0"
            value={val}
            onChange={e => setVal(e.target.value)}
            autoFocus
            aria-label="Cân nặng theo kg"
            className="w-full bg-[var(--color-app-bg)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-xl font-bold text-center outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] transition-colors"
          />
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-[var(--color-card-bg)] border border-[var(--color-border)] font-semibold text-sm hover:bg-[var(--color-card-hover)] transition-colors">
              Hủy
            </button>
            <button type="submit" className="flex-1 py-3 rounded-xl bg-[var(--color-primary)] text-black font-bold text-sm hover:bg-[var(--color-primary-dark)] transition-colors">
              Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}