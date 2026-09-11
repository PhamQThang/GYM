import { useState } from 'react';
import { useAppStore } from '../../../lib/store';
import { Plus, Settings2, Trash2, ChevronDown, ChevronUp, Check, FolderPlus, ArrowUp, ArrowDown } from 'lucide-react';
import { Card } from '../../ui/Card';

export default function ProgramEditor() {
  const programs = useAppStore((s) => s.programs);
  const workoutDays = useAppStore((s) => s.workoutDays);
  const workoutExercises = useAppStore((s) => s.workoutExercises);
  const exercises = useAppStore((s) => s.exercises);
  const addWorkoutDay = useAppStore((s) => s.addWorkoutDay);
  const removeExerciseFromDay = useAppStore((s) => s.removeExerciseFromDay);
  const updateWorkoutExercise = useAppStore((s) => s.updateWorkoutExercise);
  const reorderExercises = useAppStore((s) => s.reorderExercises);
  const program = programs[0];
  const pDays = workoutDays.filter(d => d.program_id === program?.id && d.is_active !== false);

  const [expandedDay, setExpandedDay] = useState<string | null>(pDays[0]?.id || null);
  const [editingExId, setEditingExId] = useState<string | null>(null);

  // States for adding a new exercise to a day
  const [addPickerDayId, setAddPickerDayId] = useState<string | null>(null);

  if (!program) return <div>No program active</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20">
       <div className="flex justify-between items-center bg-[var(--color-panel-bg)] border border-[var(--color-border)] p-6 rounded-2xl">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">{program.name}</h2>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">{program.phase}</p>
          </div>
          <button 
             onClick={() => addWorkoutDay('Ngày Tập Mới', 'Tổng Hợp')}
             className="flex items-center gap-2 bg-[var(--color-app-bg)] border border-[var(--color-border)] hover:bg-[var(--color-card-hover)] px-4 py-2 rounded-xl transition-colors text-sm font-semibold"
          >
             <FolderPlus className="w-4 h-4 text-[var(--color-primary)]" />
             Thêm Ngày
          </button>
       </div>

       <div className="space-y-4">
          {pDays.map((day, idx) => {
             const dayExercises = workoutExercises
               .filter(we => we.workout_day_id === day.id && we.is_active !== false)
               .sort((a, b) => a.order_index - b.order_index);

             const isExpanded = expandedDay === day.id;

             return (
               <Card key={day.id} className="overflow-hidden p-0 border-[var(--color-border)]">
                 <button 
                    onClick={() => setExpandedDay(isExpanded ? null : day.id)}
                    className="w-full flex items-center justify-between p-6 bg-[var(--color-card-bg)] hover:bg-[var(--color-card-hover)] focus:outline-none transition-colors"
                 >
                    <div className="flex items-center gap-4">
                       <span className="w-8 h-8 rounded-lg bg-[var(--color-app-bg)] border border-[var(--color-border)] flex items-center justify-center font-bold text-sm text-[var(--color-text-muted)]">
                         {(idx + 1).toString().padStart(2, '0')}
                       </span>
                       <div className="text-left">
                          <h3 className="font-bold text-lg">{day.name}</h3>
                          <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-2">
                             <span>Tiêu điểm: <span className="text-[var(--color-primary)]">{day.focus}</span></span>
                             <span>•</span>
                             <span>{dayExercises.length} bài tập</span>
                          </div>
                       </div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-[var(--color-text-muted)]" /> : <ChevronDown className="w-5 h-5 text-[var(--color-text-muted)]" />}
                 </button>

                 {isExpanded && (
                   <div className="p-6 border-t border-[var(--color-border)] bg-[var(--color-panel-bg)] space-y-3">
                      {dayExercises.map((we, index) => {
                         const ex = exercises.find(e => e.id === we.exercise_id);
                         if (!ex) return null;
                         
                         const moveUp = () => {
                           if (index === 0) return;
                           const arr = [...dayExercises];
                           const t1 = arr[index-1];
                           const t2 = arr[index];
                           if (!t1 || !t2) return;
                           [arr[index-1], arr[index]] = [t2, t1];
                           reorderExercises(day.id, arr.map(a => a.id));
                         };

                         const moveDown = () => {
                           if (index === dayExercises.length - 1) return;
                           const arr = [...dayExercises];
                           const t1 = arr[index+1];
                           const t2 = arr[index];
                           if (!t1 || !t2) return;
                           [arr[index+1], arr[index]] = [t2, t1];
                           reorderExercises(day.id, arr.map(a => a.id));
                         };

                         const isEditing = editingExId === we.id;

                         return (
                           <div key={we.id} className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${isEditing ? 'bg-[var(--color-card-bg)] border-[var(--color-primary)]/50 ring-1 ring-[var(--color-primary)]/20' : 'bg-[var(--color-app-bg)] border-[var(--color-border)] hover:border-[var(--color-card-hover)]'}`}>
                              <div className="flex flex-col gap-1 mt-1 shrink-0">
                                <button onClick={moveUp} disabled={index===0} className="p-1 text-[var(--color-text-muted)] hover:text-white disabled:opacity-30 disabled:hover:text-[var(--color-text-muted)] rounded"><ArrowUp className="w-3.5 h-3.5" /></button>
                                <button onClick={moveDown} disabled={index===dayExercises.length-1} className="p-1 text-[var(--color-text-muted)] hover:text-white disabled:opacity-30 disabled:hover:text-[var(--color-text-muted)] rounded"><ArrowDown className="w-3.5 h-3.5" /></button>
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                {!isEditing ? (
                                  <>
                                     <h4 className="font-bold text-sm flex items-center gap-2 flex-wrap">
                                        <span className="truncate">{ex.name}</span>
                                        {ex.is_custom && <span className="text-[8px] bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-1.5 py-0.5 rounded uppercase tracking-widest border border-[var(--color-primary)]/20 shrink-0">Tùy Chỉnh</span>}
                                     </h4>
                                     <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] uppercase tracking-wider font-semibold">
                                        <span className="text-[var(--color-primary)]">{we.planned_sets} Hiệp</span>
                                        <span className="text-blue-400">{we.rep_range_min}-{we.rep_range_max} Reps</span>
                                        <span className="text-orange-400">{we.rest_seconds}s Nghỉ</span>
                                     </div>
                                  </>
                                ) : (
                                  <div className="space-y-4">
                                     <h4 className="font-bold text-sm flex items-center gap-2 flex-wrap">
                                        <span className="truncate">{ex.name} (Chỉnh Sửa)</span>
                                        {ex.is_custom && <span className="text-[8px] bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-1.5 py-0.5 rounded uppercase tracking-widest border border-[var(--color-primary)]/20 shrink-0">Tùy Chỉnh</span>}
                                     </h4>
                                     <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <div>
                                           <label className="block text-[10px] text-[var(--color-text-muted)] uppercase mb-1">Số Hiệp</label>
                                           <input type="number" min="1" max="10" defaultValue={we.planned_sets} onChange={e => updateWorkoutExercise(we.id, { planned_sets: Number(e.target.value) })} className="w-full bg-[var(--color-panel-bg)] border border-[var(--color-border)] px-3 py-1.5 rounded-lg text-sm" />
                                        </div>
                                        <div>
                                           <label className="block text-[10px] text-[var(--color-text-muted)] uppercase mb-1">Reps Nhỏ Nhất</label>
                                           <input type="number" min="1" defaultValue={we.rep_range_min} onChange={e => updateWorkoutExercise(we.id, { rep_range_min: Number(e.target.value) })} className="w-full bg-[var(--color-panel-bg)] border border-[var(--color-border)] px-3 py-1.5 rounded-lg text-sm" />
                                        </div>
                                        <div>
                                           <label className="block text-[10px] text-[var(--color-text-muted)] uppercase mb-1">Reps Lớn Nhất</label>
                                           <input type="number" min="1" defaultValue={we.rep_range_max} onChange={e => updateWorkoutExercise(we.id, { rep_range_max: Number(e.target.value) })} className="w-full bg-[var(--color-panel-bg)] border border-[var(--color-border)] px-3 py-1.5 rounded-lg text-sm" />
                                        </div>
                                        <div>
                                           <label className="block text-[10px] text-[var(--color-text-muted)] uppercase mb-1">Nghỉ (Giây)</label>
                                           <select defaultValue={we.rest_seconds} onChange={e => updateWorkoutExercise(we.id, { rest_seconds: Number(e.target.value) })} className="w-full bg-[var(--color-panel-bg)] border border-[var(--color-border)] px-3 py-1.5 rounded-lg text-sm">
                                             <option value="45">45s</option><option value="60">60s</option><option value="90">90s</option><option value="120">120s</option><option value="180">180s</option>
                                           </select>
                                        </div>
                                     </div>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                 {isEditing ? (
                                    <button onClick={() => setEditingExId(null)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--color-primary)] text-black"><Check className="w-4 h-4" /></button>
                                 ) : (
                                    <button onClick={() => setEditingExId(we.id)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-card-bg)] text-[var(--color-text-muted)] hover:text-white"><Settings2 className="w-4 h-4" /></button>
                                 )}
                                 
                                 <button 
                                   onClick={() => {
                                     if(confirm('Bạn có chắc muốn xóa bài tập này khỏi lịch? Dữ liệu lịch sử sẽ không bị ảnh hưởng.')) {
                                        removeExerciseFromDay(we.id);
                                     }
                                   }}
                                   className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--color-border)] hover:bg-red-500/20 text-[var(--color-text-muted)] hover:text-red-400"
                                 >
                                    <Trash2 className="w-4 h-4" />
                                 </button>
                              </div>
                           </div>
                         );
                      })}
                      
                      {dayExercises.length === 0 && (
                        <div className="text-center py-6 text-sm text-[var(--color-text-muted)]">Ngày này chưa có bài tập nào.</div>
                      )}

                      <button 
                        onClick={() => setAddPickerDayId(day.id)}
                        className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-primary)]/50 rounded-xl text-sm font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors mt-4"
                      >
                         <Plus className="w-4 h-4" />
                         Thêm Bài Tập
                      </button>
                   </div>
                 )}
               </Card>
             );
          })}
       </div>

       {addPickerDayId && (
         <AddExerciseToDayModal dayId={addPickerDayId} onClose={() => setAddPickerDayId(null)} />
       )}
    </div>
  );
}

function AddExerciseToDayModal({ dayId, onClose }: { dayId: string, onClose: () => void }) {
  const exercises = useAppStore((s) => s.exercises);
  const addExerciseToDay = useAppStore((s) => s.addExerciseToDay);
  const [search, setSearch] = useState('');
  
  const activeExs = exercises.filter(e => e.is_active !== false && e.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
       <div className="bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[80vh]">
          <div className="p-6 border-b border-[var(--color-border)] flex flex-col gap-4">
             <h3 className="text-xl font-bold">Trích Xuất Thư Viện</h3>
             <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm bài tập..." className="w-full bg-[var(--color-app-bg)] border border-[var(--color-border)] px-4 py-2.5 rounded-xl text-sm focus:border-[var(--color-primary)] outline-none" />
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
             {activeExs.map(ex => (
                <button 
                  key={ex.id}
                  onClick={() => {
                    addExerciseToDay(dayId, { exercise_id: ex.id });
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-[var(--color-panel-bg)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/5 transition-colors text-left"
                >
                   <div>
                     <h4 className="font-bold text-sm flex items-center gap-2">
                        {ex.name}
                        {ex.is_custom && <span className="text-[8px] bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-1.5 py-0.5 rounded uppercase tracking-widest border border-[var(--color-primary)]/20">Tùy Chỉnh</span>}
                     </h4>
                     <p className="text-[10px] text-[var(--color-text-muted)] mt-1">{ex.primary_muscle}</p>
                   </div>
                   <Plus className="w-4 h-4 text-[var(--color-text-muted)]" />
                </button>
             ))}
          </div>
          <div className="p-4 border-t border-[var(--color-border)] flex justify-end">
             <button onClick={onClose} className="px-4 py-2 rounded-lg font-semibold text-[var(--color-text-muted)] hover:text-white transition-colors">Đóng</button>
          </div>
       </div>
    </div>
  );
}
