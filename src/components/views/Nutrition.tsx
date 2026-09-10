import { Plus, ChevronLeft, ChevronRight, Flame, Target, Zap, Droplets, Check, Edit2, Trash2, Clock, Sun, Moon } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { useAppStore } from '../../lib/store';
import { calculateCalorieAdherence, calculateNutritionHistory } from '../../lib/analytics';

export default function Nutrition() {
  const { user, foods, meals, mealItems, dailyWater, addWater, logMealItem, completeMeal } = useAppStore();
  
  const adherence = calculateCalorieAdherence(mealItems, user);
  const history = calculateNutritionHistory(mealItems);
  const todayMacros = history[history.length - 1];

  const percentHydration = Math.min(100, Math.round((dailyWater / 4000) * 100));
  const remainingWater = Math.max(0, 4000 - dailyWater);

  const activeMealId = meals.find(m => m.status === 'PLANNED')?.id || meals[meals.length - 1]?.id;

  const getMealIcon = (name: string) => {
    if (name.toLowerCase().includes('tối')) return Moon;
    if (name.toLowerCase().includes('trước')) return Zap;
    return Sun;
  };

  const getMealColor = (status: string) => {
    if (status === 'CONSUMED' || status === 'COMPLETED') return 'var(--color-primary)';
    if (status === 'PLANNED') return 'var(--color-text-muted)';
    return 'var(--color-border)';
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)] mb-2">
            HỆ THỐNG SINH TRẮC TỪ XA <span className="text-[var(--color-text-muted)]">• Giai Đoạn Tăng Cơ Nạc</span>
          </div>
          <h2 className="text-3xl font-bold">Quản Lý Dinh Dưỡng & Macro Trong Ngày</h2>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="flex items-center bg-[var(--color-panel-bg)] border border-[var(--color-border)] rounded-xl p-1">
             <button className="p-2 hover:bg-[var(--color-card-bg)] rounded-lg transition-colors"><ChevronLeft className="w-4 h-4" /></button>
             <div className="px-4 text-sm font-semibold flex items-center gap-2">
               <CalendarIcon className="w-4 h-4 text-[var(--color-primary)]" /> Hôm Nay
             </div>
             <button className="p-2 hover:bg-[var(--color-card-bg)] rounded-lg transition-colors"><ChevronRight className="w-4 h-4" /></button>
           </div>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="flex flex-col justify-center">
            <div className="flex items-center justify-between mb-4">
               <CardTitle>CHỈ SỐ TIÊU THỤ</CardTitle>
               <Flame className="w-4 h-4 text-[var(--color-primary)]" />
            </div>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-3xl font-bold text-[var(--color-primary)]">{adherence.actual.toLocaleString()}</span>
              <span className="text-sm text-[var(--color-text-muted)] font-medium uppercase tracking-wider">KCAL</span>
            </div>
            <div className="h-1.5 w-full bg-[var(--color-card-bg)] rounded-full overflow-hidden">
               <div className="h-full bg-[var(--color-primary)] rounded-full" style={{ width: `${adherence.percentage}%` }}></div>
            </div>
         </Card>
         <Card className="flex flex-col justify-center">
            <div className="flex items-center justify-between mb-4">
               <CardTitle>MỤC TIÊU CƠ SỞ</CardTitle>
               <Target className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-3xl font-bold">{user.target_calories.toLocaleString()}</span>
              <span className="text-sm text-[var(--color-text-muted)] font-medium uppercase tracking-wider">KCAL</span>
            </div>
            <div className="h-1.5 w-full bg-[var(--color-card-bg)] rounded-full overflow-hidden">
               <div className="h-full bg-blue-400 rounded-full" style={{ width: '100%' }}></div>
            </div>
         </Card>
         <Card className="flex flex-col justify-center">
            <div className="flex items-center justify-between mb-4">
               <CardTitle>THÂM HỤT CÒN LẠI</CardTitle>
               <Zap className="w-4 h-4 text-orange-400" />
            </div>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-3xl font-bold text-orange-400">{adherence.remaining.toLocaleString()}</span>
              <span className="text-sm text-[var(--color-text-muted)] font-medium uppercase tracking-wider">KCAL</span>
            </div>
         </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Adherence Status */}
        <Card className="lg:col-span-2">
           <CardHeader>
             <div>
                <CardTitle>PHÂN BỔ NHIÊN LIỆU TRAO ĐỔI CHẤT</CardTitle>
                <h4 className="text-lg font-semibold mt-1">Tình Trạng Tuân Thủ Mục Tiêu</h4>
             </div>
             <div className="flex items-center gap-1.5 bg-[var(--color-card-bg)] px-2 py-1 border border-[var(--color-border)] rounded text-[10px] text-[var(--color-primary)] font-semibold tracking-wider">
                <span className="w-1.5 h-1.5 bg-[var(--color-primary)] rounded-full"></span> Tỷ Lệ Động
             </div>
           </CardHeader>
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6">
              {[
                { label: 'ĐẠM', sub: 'TỔNG HỢP CƠ NẠC', percent: Math.round((todayMacros.pro / user.target_protein)*100), curr: todayMacros.pro, tgt: user.target_protein, color: 'var(--color-primary)' },
                { label: 'TINH BỘT', sub: 'NĂNG LƯỢNG TẬP LUYỆN', percent: Math.round((todayMacros.carb / user.target_carbs)*100), curr: todayMacros.carb, tgt: user.target_carbs, color: '#60a5fa' },
                { label: 'CHẤT BÉO TỐT', sub: 'CÂN BẰNG NỘI TIẾT TỐ', percent: Math.round((todayMacros.fat / user.target_fat)*100), curr: todayMacros.fat, tgt: user.target_fat, color: '#fb923c' },
              ].map(macro => (
                <div key={macro.label} className="bg-[var(--color-app-bg)] border border-[var(--color-border)] rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                   <div className="relative w-28 h-28 flex items-center justify-center mb-6">
                       <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="42" fill="transparent" stroke="var(--color-card-bg)" strokeWidth="10" />
                          <circle cx="50" cy="50" r="42" fill="transparent" stroke={macro.color} strokeWidth="10" strokeLinecap="round" strokeDasharray="263.89" strokeDashoffset={Math.max(0, 263.89 * (1 - (macro.percent > 100 ? 100 : macro.percent) / 100))} className="transition-all duration-1000 ease-out" />
                       </svg>
                       <div className="absolute inset-0 flex flex-col items-center justify-center">
                         <span className="text-2xl font-bold">{macro.percent}%</span>
                         <span className="text-[10px] font-semibold text-[var(--color-text-muted)] mt-1">{macro.curr}g / {macro.tgt}g</span>
                       </div>
                   </div>
                   <h5 className="font-bold tracking-widest">{macro.label}</h5>
                   <p className="text-[10px] text-[var(--color-text-muted)] mt-1" style={{ color: macro.color }}>{macro.sub}</p>
                </div>
              ))}
           </div>
        </Card>

        {/* Right Col: Hydration */}
        <Card>
           <CardHeader className="mb-4">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                 <Droplets className="w-5 h-5 text-blue-400" />
               </div>
               <div>
                  <h4 className="text-lg font-semibold leading-tight">Mục Tiêu<br/>Uống Nước</h4>
                  <p className="text-[10px] text-[var(--color-text-muted)]">Cơ sở hàng ngày: 4.0 Lít</p>
               </div>
             </div>
             <div className="text-right">
                <div className="text-xs text-blue-400 font-bold">{percentHydration}%</div>
                <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest">ĐÃ ĐẠT</div>
             </div>
           </CardHeader>
           
           <div className="flex items-center gap-6 mt-8">
              <div className="flex-1">
                 <div className="flex items-baseline gap-1">
                   <span className="text-4xl font-bold text-blue-400">{(dailyWater / 1000).toFixed(1)}</span>
                   <span className="text-sm font-semibold text-[var(--color-text-muted)]">/ 4.0L</span>
                 </div>
                 <p className="text-xs text-[var(--color-text-muted)] mt-1">Còn lại: {remainingWater} ml</p>
                 
                 <div className="mt-6 space-y-2">
                   <div className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">GHI NHANH THỂ TÍCH NƯỚC</div>
                   <div className="flex gap-2">
                      <button onClick={() => addWater(250)} className="flex-1 bg-[var(--color-app-bg)] border border-[var(--color-border)] hover:bg-[var(--color-card-hover)] py-2 rounded-lg text-xs font-semibold text-blue-400 transition-colors">+ 250 ml</button>
                      <button onClick={() => addWater(500)} className="flex-1 bg-[var(--color-app-bg)] border border-[var(--color-border)] hover:bg-[var(--color-card-hover)] py-2 rounded-lg text-xs font-semibold text-blue-400 transition-colors">+ 500 ml</button>
                   </div>
                 </div>
              </div>
              
              <div className="w-16 h-40 bg-[var(--color-app-bg)] border border-[var(--color-border)] rounded-full overflow-hidden relative p-1 shrink-0">
                 <div className="absolute bottom-1 left-1 right-1 bg-blue-500/20 rounded-full flex flex-col justify-end overflow-hidden" style={{ height: 'calc(100% - 8px)' }}>
                    <div className="w-full bg-blue-400 rounded-full transition-all duration-1000 ease-out" style={{ height: `${percentHydration}%` }}></div>
                 </div>
              </div>
           </div>
        </Card>
      </div>

      {/* Fuel Pills */}
      <div>
         <div className="flex items-center justify-between mb-3 text-xs">
            <div className="flex items-center gap-2 text-[var(--color-primary)] font-semibold uppercase tracking-widest">
               <Zap className="w-4 h-4 fill-current" /> VIÊN NĂNG LƯỢNG PHÌ ĐẠI CƠ TỨC THÌ
            </div>
            <div className="text-[var(--color-text-muted)]">Nhấp vào viên năng lượng để lưu vào bữa ăn gần nhất</div>
         </div>
         <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
            {foods.map(food => (
              <button key={food.id} onClick={() => logMealItem(activeMealId, food)} className="shrink-0 flex items-center gap-2 bg-[var(--color-panel-bg)] border border-[var(--color-border)] rounded-full pl-2 pr-4 py-1.5 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-colors group">
                 <div className="w-6 h-6 rounded-full bg-[var(--color-app-bg)] flex items-center justify-center group-hover:bg-[var(--color-primary)] group-hover:text-black transition-colors">
                   <Plus className="w-3 h-3" />
                 </div>
                 <span className="text-sm font-semibold">{food.name}</span>
                 <span className="text-[10px] text-[var(--color-primary)] font-semibold bg-[var(--color-app-bg)] px-2 py-0.5 rounded-full ml-1">{food.protein_per_serving}g P / {food.calories_per_serving} kcal</span>
              </button>
            ))}
         </div>
      </div>

      {/* Intake Chronology */}
      <div>
         <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-xl font-bold">
               <UtensilsIcon className="w-5 h-5 text-[var(--color-primary)]" />
               Lịch Trình Nạp Dinh Dưỡng
            </div>
            <div className="text-xs text-[var(--color-text-muted)]">{meals.length} Khung Giờ Ăn</div>
         </div>

         <div className="space-y-4">
            {meals.map((meal, index) => {
              const items = mealItems.filter(mi => mi.meal_id === meal.id);
              const mCals = items.reduce((a, i) => a + i.calories, 0);
              const mPro = items.reduce((a, i) => a + i.protein, 0);
              const mCarb = items.reduce((a, i) => a + i.carbs, 0);
              const mFat = items.reduce((a, i) => a + i.fat, 0);
              const Icon = getMealIcon(meal.name);
              const isActive = meal.id === activeMealId;

              return (
                <div key={meal.id} className={`bg-[var(--color-panel-bg)] rounded-xl border ${isActive ? 'border-[var(--color-primary)]/50 ring-1 ring-[var(--color-primary)]/20' : 'border-[var(--color-border)]'} overflow-hidden transition-all duration-300`}>
                   {/* Meal Header */}
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 lg:p-6 bg-[var(--color-card-bg)] border-b border-[var(--color-border)]">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-xl bg-[var(--color-app-bg)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
                           <Icon className="w-5 h-5 text-[var(--color-text-muted)]" />
                         </div>
                         <div>
                            <div className="flex items-center gap-2">
                               <span className="font-bold text-lg">{(index + 1).toString().padStart(2, '0')}. {meal.name}</span>
                               <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${meal.status.includes('COMPLETED') || meal.status.includes('CONSUMED') ? 'bg-[var(--color-primary)] text-black' : 'bg-[var(--color-app-bg)] text-[var(--color-text-muted)] border border-[var(--color-border)]'}`}>
                                 {meal.status}
                               </span>
                            </div>
                            <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest mt-1">{meal.scheduled_time}</p>
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-4 md:gap-8 text-sm font-semibold">
                         <>
                           <div><span className="text-white">{mCals}</span> <span className="text-[var(--color-text-muted)] text-[10px]">kcal</span></div>
                           <div>•</div>
                           <div><span className="text-[var(--color-primary)]">{mPro}g</span> <span className="text-[var(--color-text-muted)] text-[10px]">P</span></div>
                           <div>•</div>
                           <div><span className="text-blue-400">{mCarb}g</span> <span className="text-[var(--color-text-muted)] text-[10px]">C</span></div>
                           <div>•</div>
                           <div><span className="text-orange-400">{mFat}g</span> <span className="text-[var(--color-text-muted)] text-[10px]">F</span></div>
                         </>
                         
                         {meal.status === 'PLANNED' && (
                           <button onClick={() => completeMeal(meal.id)} className="flex items-center gap-1.5 text-xs bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-black py-1.5 px-3 rounded-lg transition-colors border border-[var(--color-primary)]/30 border-dashed">
                             <Check className="w-4 h-4" /> Ăn Xong
                           </button>
                         )}
                      </div>
                   </div>

                   {/* Meal Items Table */}
                   {items.length > 0 && (
                     <div className="w-full overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                          <thead>
                            <tr className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest border-b border-[var(--color-border)]">
                              <th className="py-3 px-6 font-semibold w-1/2">MÓN ĂN</th>
                              <th className="py-3 px-6 font-semibold text-center">CALO</th>
                              <th className="py-3 px-6 font-semibold text-center text-[var(--color-primary)]">ĐẠM</th>
                              <th className="py-3 px-6 font-semibold text-center text-blue-400">TINH BỘT</th>
                              <th className="py-3 px-6 font-semibold text-center text-orange-400">BÉO</th>
                              <th className="py-3 px-6 font-semibold text-right">THAO TÁC</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((item, i) => (
                              <tr key={i} className="border-b border-[var(--color-border)]/30 last:border-0 hover:bg-[var(--color-card-bg)]/50 transition-colors">
                                <td className="py-3 px-6">
                                   <div className="font-semibold text-sm">{item.name}</div>
                                </td>
                                <td className="py-3 px-6 text-center text-sm font-medium text-[var(--color-text-muted)]">{item.calories} kcal</td>
                                <td className="py-3 px-6 text-center text-sm font-medium text-[var(--color-primary)]">{item.protein}g</td>
                                <td className="py-3 px-6 text-center text-sm font-medium text-blue-400">{item.carbs}g</td>
                                <td className="py-3 px-6 text-center text-sm font-medium text-orange-400">{item.fat}g</td>
                                <td className="py-3 px-6 text-right">
                                   <div className="flex items-center justify-end gap-2 text-[var(--color-text-muted)]">
                                     <button className="p-1.5 hover:text-red-400 transition-colors rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                                   </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                     </div>
                   )}
                </div>
              );
            })}
         </div>
      </div>
    </div>
  );
}

// Temporary icon components since I can't import directly in the middle of a string block easily for everything if I missed them
function CalendarIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg> }
function UtensilsIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg> }
