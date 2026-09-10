import React from 'react';
import { Check, X, Copy, Trash2, History, Plus } from 'lucide-react';
import { useAppStore } from '../../../lib/store';
import { WorkoutSet, Exercise } from '../../../lib/types';

interface SetRowProps {
  workoutSet: WorkoutSet;
  exercise: Exercise;
  key?: React.Key;
}

export default function SetRow({ workoutSet, exercise }: SetRowProps) {
  const { updateSet, completeSet, removeSet, duplicateSet, getPreviousPerformance } = useAppStore();

  const prevPerf = getPreviousPerformance(exercise.id);
  const isCompleted = workoutSet.status === 'COMPLETED';

  // UI Buffers to allow empty string edits without pushing NaN to domain state
  const [localWeight, setLocalWeight] = React.useState<string | number>(workoutSet.weight || '');
  const [localReps, setLocalReps] = React.useState<string | number>(workoutSet.reps || '');

  React.useEffect(() => {
    setLocalWeight(workoutSet.weight || '');
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
    setLocalWeight(workoutSet.weight || '');
    setLocalReps(workoutSet.reps || '');
  };

  return (
    <div className={`grid grid-cols-[1fr_2fr_1fr] md:grid-cols-[1fr_2fr_1fr_0.5fr] gap-4 items-center bg-[var(--color-app-bg)] rounded-xl p-4 border transition-colors ${
      isCompleted 
        ? 'border-[var(--color-primary)]/30 ring-1 ring-[var(--color-primary)]/20' 
        : 'border-[var(--color-border)] hover:border-[var(--color-text-muted)]'
    }`}>
      {/* Set Number & Previous */}
      <div className="flex flex-col">
         <span className="font-bold text-sm tracking-wider">HIỆP {workoutSet.set_number}</span>
         {prevPerf ? (
           <span className="text-[10px] text-[var(--color-text-muted)] mt-1 flex items-center gap-1"><History className="w-3 h-3" /> {prevPerf.weight}kg x {prevPerf.reps}</span>
         ) : (
           <span className="text-[10px] text-[var(--color-text-muted)] mt-1 flex items-center gap-1"><History className="w-3 h-3" /> Trống</span>
         )}
      </div>

      {/* Inputs */}
      <div className="flex items-center justify-center gap-4">
         <div className="flex flex-col items-center">
            <input 
              type="number" 
              value={localWeight}
              onChange={handleWeightChange}
              onBlur={handleBlur}
              className="w-16 md:w-20 bg-transparent text-center text-xl md:text-2xl font-bold border-b border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none transition-colors pb-1"
              disabled={isCompleted}
              placeholder="0"
            />
            <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest mt-2">KG</span>
         </div>
         <span className="text-xl text-[var(--color-text-muted)] font-light">×</span>
         <div className="flex flex-col items-center">
            <input 
              type="number" 
              value={localReps}
              onChange={handleRepsChange}
              onBlur={handleBlur}
              className="w-16 md:w-20 bg-transparent text-center text-xl md:text-2xl font-bold border-b border-[var(--color-border)] focus:border-blue-400 focus:outline-none transition-colors pb-1"
              disabled={isCompleted}
              placeholder="0"
            />
            <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest mt-2">REPS</span>
         </div>
      </div>

      {/* Complete Button */}
      <div className="flex justify-end pr-2 md:pr-0">
        {isCompleted ? (
           <div className="w-10 h-10 md:w-12 md:h-12 bg-[var(--color-primary)]/20 text-[var(--color-primary)] rounded-xl flex items-center justify-center">
             <Check className="w-5 h-5 md:w-6 md:h-6" />
           </div>
        ) : (
           <button 
             onClick={() => completeSet(workoutSet.id)}
             disabled={!workoutSet.weight || !workoutSet.reps}
             className="w-10 h-10 md:w-12 md:h-12 bg-[var(--color-card-bg)] hover:bg-[var(--color-primary)] text-[var(--color-text-muted)] hover:text-black rounded-xl border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed group"
           >
             <Check className="w-5 h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform" />
           </button>
        )}
      </div>

      {/* Actions (Hidden on mobile unless expanded, keeping simple for now) */}
      <div className="hidden md:flex flex-col gap-2 justify-center ml-2 border-l border-[var(--color-border)] pl-4">
         <button onClick={() => duplicateSet(workoutSet.id)} className="p-1.5 text-[var(--color-text-muted)] hover:text-white rounded hover:bg-[var(--color-card-bg)] transition-colors" title="Sao Chép">
           <Copy className="w-4 h-4" />
         </button>
         <button onClick={() => removeSet(workoutSet.id)} className="p-1.5 text-[var(--color-text-muted)] hover:text-red-400 rounded hover:bg-[var(--color-card-bg)] transition-colors" title="Xóa">
           <Trash2 className="w-4 h-4" />
         </button>
      </div>
    </div>
  );
}
