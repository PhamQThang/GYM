import React from 'react';
import { Check, Copy, Trash2, History, Trophy, MoreVertical } from 'lucide-react';
import { useAppStore } from '../../../lib/store';
import { WorkoutSet } from '../../../lib/types';

interface SetRowProps {
  workoutSet: WorkoutSet;
  prevPerf: WorkoutSet | null;
  isPr?: boolean;
}

const SetRow = React.memo(function SetRow({ workoutSet, prevPerf, isPr }: SetRowProps) {
  const updateSet = useAppStore((s) => s.updateSet);
  const completeSet = useAppStore((s) => s.completeSet);
  const uncompleteSet = useAppStore((s) => s.uncompleteSet);
  const removeSet = useAppStore((s) => s.removeSet);
  const duplicateSet = useAppStore((s) => s.duplicateSet);

  const isCompleted = workoutSet.status === 'COMPLETED';

  // UI Buffers to allow empty string edits without pushing NaN to domain state
  const getInitialWeight = () => workoutSet.weight === 0 && workoutSet.status === 'PLANNED' ? '' : workoutSet.weight;

  const DEFAULT_WEIGHT_STEP = 2.5;
  const DEFAULT_REPS_STEP = 1;

  const [localWeight, setLocalWeight] = React.useState<string | number>(getInitialWeight());
  const [localReps, setLocalReps] = React.useState<string | number>(workoutSet.reps || '');
  const [showMenu, setShowMenu] = React.useState(false);

  React.useEffect(() => {
    // Only resync if the user hasn't buffered '0' intentionally for an empty planned set
    let nextWeight: string | number = workoutSet.weight;
    if (workoutSet.weight === 0 && workoutSet.status === 'PLANNED') {
       if (localWeight !== '0' && localWeight !== 0) {
          nextWeight = '';
       } else {
          nextWeight = localWeight;
       }
    }
    setLocalWeight(nextWeight);
    setLocalReps(workoutSet.reps || '');
  }, [workoutSet.weight, workoutSet.reps, workoutSet.status]);

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalWeight(val);
    const num = Number(val);
    if (!isNaN(num) && num >= 0 && val.trim() !== '') {
       updateSet(workoutSet.id, num, workoutSet.reps);
    }
  };

  const handleRepsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalReps(val);
    const num = Number(val);
    if (!isNaN(num) && num >= 0 && val.trim() !== '') {
       updateSet(workoutSet.id, workoutSet.weight, num);
    }
  };

  const handleBlur = () => {
    // Revert visual to valid committed store state on blur if left empty/invalid
    setLocalWeight(workoutSet.weight === 0 && workoutSet.status === 'PLANNED' ? '' : workoutSet.weight);
    setLocalReps(workoutSet.reps || '');
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className={`grid grid-cols-[1fr_2fr_1fr] md:grid-cols-[1fr_2fr_1fr_0.5fr] gap-4 items-center bg-[var(--color-app-bg)] rounded-xl p-4 border transition-colors ${
        isCompleted
          ? 'border-[var(--color-primary)]/30 ring-1 ring-[var(--color-primary)]/20'
          : 'border-[var(--color-border)] hover:border-[var(--color-text-muted)]'
      }`}>
        {/* Set Number & Previous */}
        <div className="flex flex-col">
           <span className="font-bold text-sm tracking-wider">HIỆP {workoutSet.set_number}</span>
           {prevPerf ? (
             <span className="text-[10px] text-[var(--color-text-muted)] mt-1 flex items-center gap-1 min-w-[70px]"><History className="w-3 h-3 shrink-0" /> {prevPerf.weight}kg x {prevPerf.reps}</span>
           ) : (
             <span className="text-[10px] text-[var(--color-text-muted)] mt-1 flex items-center gap-1"><History className="w-3 h-3 shrink-0" /> Trống</span>
           )}
        </div>

        {/* Inputs */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4">
           {/* Weight Stepper */}
           <div className="flex flex-col items-center">
              <div className="flex items-center gap-1">
                <button
                  disabled={isCompleted}
                  onClick={() => updateSet(workoutSet.id, Math.max(0, workoutSet.weight - DEFAULT_WEIGHT_STEP), workoutSet.reps)}
                  className="w-11 h-11 flex shrink-0 items-center justify-center bg-[var(--color-panel-bg)] rounded-xl text-lg font-bold border border-[var(--color-border)] active:bg-[var(--color-border)] disabled:opacity-50"
                  aria-label={`Giảm tạ ${DEFAULT_WEIGHT_STEP} kg`}
                >
                  −
                </button>
                <input
                  type="number"
                  value={localWeight}
                  onChange={handleWeightChange}
                  onBlur={handleBlur}
                  className="w-16 md:w-20 bg-transparent text-center text-xl md:text-2xl font-bold border-b border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none transition-colors pb-1"
                  disabled={isCompleted}
                  placeholder="0"
                  min="0"
                  step={DEFAULT_WEIGHT_STEP}
                />
                <button
                  disabled={isCompleted}
                  onClick={() => updateSet(workoutSet.id, workoutSet.weight + DEFAULT_WEIGHT_STEP, workoutSet.reps)}
                  className="w-11 h-11 flex shrink-0 items-center justify-center bg-[var(--color-panel-bg)] rounded-xl text-lg font-bold border border-[var(--color-border)] active:bg-[var(--color-border)] disabled:opacity-50"
                  aria-label={`Tăng tạ ${DEFAULT_WEIGHT_STEP} kg`}
                >
                  +
                </button>
              </div>
              <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest mt-1 hidden md:block">KG</span>
           </div>

           <span className="text-xl text-[var(--color-text-muted)] font-light hidden md:block">×</span>

           {/* Reps Stepper */}
           <div className="flex flex-col items-center mt-2 md:mt-0">
              <div className="flex items-center gap-1">
                <button
                  disabled={isCompleted}
                  onClick={() => updateSet(workoutSet.id, workoutSet.weight, Math.max(0, workoutSet.reps - DEFAULT_REPS_STEP))}
                  className="w-11 h-11 flex shrink-0 items-center justify-center bg-[var(--color-panel-bg)] rounded-xl text-lg font-bold border border-[var(--color-border)] active:bg-[var(--color-border)] disabled:opacity-50"
                  aria-label={`Giảm ${DEFAULT_REPS_STEP} rep`}
                >
                  −
                </button>
                <input
                  type="number"
                  value={localReps}
                  onChange={handleRepsChange}
                  onBlur={handleBlur}
                  className="w-16 md:w-20 bg-transparent text-center text-xl md:text-2xl font-bold border-b border-[var(--color-border)] focus:border-blue-400 focus:outline-none transition-colors pb-1"
                  disabled={isCompleted}
                  placeholder="0"
                  min="0"
                  step={DEFAULT_REPS_STEP}
                />
                <button
                  disabled={isCompleted}
                  onClick={() => updateSet(workoutSet.id, workoutSet.weight, workoutSet.reps + DEFAULT_REPS_STEP)}
                  className="w-11 h-11 flex shrink-0 items-center justify-center bg-[var(--color-panel-bg)] rounded-xl text-lg font-bold border border-[var(--color-border)] active:bg-[var(--color-border)] disabled:opacity-50"
                  aria-label={`Tăng ${DEFAULT_REPS_STEP} rep`}
                >
                  +
                </button>
              </div>
              <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest mt-1 hidden md:block">REPS</span>
           </div>
        </div>

        {/* Complete Button & Menu Trigger */}
        <div className="flex items-center justify-end md:justify-center pr-2 md:pr-0 gap-2">
          {isCompleted ? (
             <div className="relative">
               {isPr && (
                  <div className="absolute -left-6 top-1/2 -translate-y-1/2 flex items-center justify-center text-[var(--color-primary)] bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 px-1 py-1 rounded" title="Personal Record">
                     <Trophy className="w-3 h-3" />
                  </div>
               )}
               <button
                 onClick={() => uncompleteSet(workoutSet.id)}
                 title="Bỏ hoàn thành"
                 className="w-11 h-11 md:w-12 md:h-12 bg-[var(--color-primary)]/20 text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-black rounded-xl flex items-center justify-center transition-colors group"
               >
                 <Check className="w-5 h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform" />
               </button>
             </div>
          ) : (
             <button
               onClick={() => completeSet(workoutSet.id)}
               disabled={workoutSet.reps <= 0 || isNaN(workoutSet.reps)}
               className="w-11 h-11 md:w-12 md:h-12 bg-[var(--color-card-bg)] hover:bg-[var(--color-primary)] text-[var(--color-text-muted)] hover:text-black rounded-xl border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed group"
             >
               <Check className="w-5 h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform" />
             </button>
          )}

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="md:hidden flex items-center justify-center w-11 h-11 text-[var(--color-text-muted)] active:bg-[var(--color-card-bg)] rounded-xl"
            aria-label="Tùy chọn hiệp"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        {/* Actions Desktop */}
        <div className="hidden md:flex flex-col gap-2 justify-center ml-2 border-l border-[var(--color-border)] pl-4">
           <button onClick={() => duplicateSet(workoutSet.id)} className="p-1.5 text-[var(--color-text-muted)] hover:text-white rounded hover:bg-[var(--color-card-bg)] transition-colors" title="Sao Chép">
             <Copy className="w-4 h-4" />
           </button>
           <button onClick={() => removeSet(workoutSet.id)} className="p-1.5 text-[var(--color-text-muted)] hover:text-red-400 rounded hover:bg-[var(--color-card-bg)] transition-colors" title="Xóa">
             <Trash2 className="w-4 h-4" />
           </button>
        </div>
      </div>

      {/* Actions Mobile (Inline Popover Equivalent) */}
      {showMenu && (
        <div className="md:hidden flex items-center gap-2 p-2 bg-[var(--color-panel-bg)] rounded-xl border border-[var(--color-border)] animate-in slide-in-from-top-2">
          <button
            onClick={() => { duplicateSet(workoutSet.id); setShowMenu(false); }}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-[var(--color-card-bg)] active:bg-[var(--color-border)] rounded-lg font-semibold border border-[var(--color-border)]"
          >
            <Copy className="w-4 h-4" /> Sao chép hiệp
          </button>
          <button
            onClick={() => { removeSet(workoutSet.id); setShowMenu(false); }}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-red-500/10 text-red-500 active:bg-red-500/20 rounded-lg font-semibold border border-red-500/20"
          >
            <Trash2 className="w-4 h-4" /> Xóa hiệp
          </button>
        </div>
      )}
    </div>
  );
});

export default SetRow;
