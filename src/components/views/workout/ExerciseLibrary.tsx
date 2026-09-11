import { useState } from 'react';
import { useAppStore } from '../../../lib/store';
import { Search, Plus, Dumbbell, Trash2 } from 'lucide-react';
import { Card } from '../../ui/Card';
import { Exercise } from '../../../lib/types';

export default function ExerciseLibrary() {
  const exercises = useAppStore((s) => s.exercises);
  const addCustomExercise = useAppStore((s) => s.addCustomExercise);
  const hideExercise = useAppStore((s) => s.hideExercise);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Only show active exercises
  const activeExercises = exercises.filter(e => e.is_active !== false);
  
  // Filter by search
  const filtered = activeExercises.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Placeholder for add modal state
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
       <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative flex-1 w-full max-w-md">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
             <input 
               type="text" 
               placeholder="Tìm kiếm bài tập..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full bg-[var(--color-panel-bg)] border border-[var(--color-border)] rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] transition-colors"
             />
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-[var(--color-primary)] text-black font-semibold px-4 py-2.5 rounded-xl hover:bg-[var(--color-primary-dark)] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tạo Bài Tập Mới
          </button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(ex => (
            <Card key={ex.id} className="flex flex-col">
               <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--color-app-bg)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
                    <Dumbbell className="w-5 h-5 text-[var(--color-primary)]" />
                  </div>
                  {ex.is_custom && (
                    <span className="text-[9px] font-bold bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-2 py-0.5 rounded uppercase tracking-wider">
                      TÙY CHỈNH
                    </span>
                  )}
               </div>
               <h4 className="font-bold text-lg mb-1">{ex.name}</h4>
               <p className="text-xs text-[var(--color-text-muted)] mb-4">{ex.primary_muscle} {ex.equipment ? `• ${ex.equipment}` : ''}</p>
               
               <div className="mt-auto pt-4 border-t border-[var(--color-border)] flex gap-2 justify-end">
                 {ex.is_custom && (
                   <button 
                     onClick={() => {
                        if (confirm('Bạn có chắc muốn xóa bài tập này? Lịch sử tập sẽ không bị mất.')) {
                           hideExercise(ex.id);
                        }
                     }}
                     className="w-8 h-8 rounded-lg bg-[var(--color-app-bg)] hover:bg-red-500/20 text-[var(--color-text-muted)] hover:text-red-400 flex items-center justify-center transition-colors"
                   >
                      <Trash2 className="w-4 h-4" />
                   </button>
                 )}
               </div>
            </Card>
          ))}
       </div>
       
       {filtered.length === 0 && (
         <div className="text-center py-20 text-[var(--color-text-muted)]">
           <p>Không tìm thấy bài tập nào chứa "{searchTerm}".</p>
         </div>
       )}

       {showAddModal && (
         <AddExerciseModal onClose={() => setShowAddModal(false)} onAdd={(ex) => {
           addCustomExercise(ex);
           setShowAddModal(false);
         }} />
       )}
    </div>
  );
}

function AddExerciseModal({ onClose, onAdd }: { onClose: () => void, onAdd: (ex: Omit<Exercise, 'id'>) => void }) {
  const [name, setName] = useState('');
  const [muscle, setMuscle] = useState('');

  return (
      <div role="dialog" aria-labelledby="custom-exercise-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in" onClick={onClose}>
         <div className="bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 id="custom-exercise-title" className="text-xl font-bold mb-6">Tạo Bài Tập Tùy Chỉnh</h3>
          <div className="space-y-4">
             <div>
                <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">TÊN BÀI TẬP</label>
                <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-[var(--color-app-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:border-[var(--color-primary)] outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]" />
             </div>
             <div>
                <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">NHÓM CƠ CHÍNH</label>
                <input value={muscle} onChange={e => setMuscle(e.target.value)} className="w-full bg-[var(--color-app-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:border-[var(--color-primary)] outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]" placeholder="VD: Ngực, Lưng, Đùi" />
             </div>
          </div>
          <div className="flex justify-end gap-3 mt-8">
             <button onClick={onClose} className="px-4 py-2 rounded-lg font-semibold text-[var(--color-text-muted)] hover:text-white transition-colors">Hủy</button>
             <button 
               onClick={() => {
                  if (!name || !muscle) return;
                  onAdd({ name, primary_muscle: muscle, secondary_muscles: [], type: 'strength', is_custom: true, is_active: true, is_system: false, is_modified: true });
               }}
               className="bg-[var(--color-primary)] text-black font-semibold px-6 py-2 rounded-lg hover:bg-[var(--color-primary-dark)] transition-colors"
             >
               Lưu Bài Tập
             </button>
          </div>
       </div>
    </div>
  );
}
