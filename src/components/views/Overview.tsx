import { Play, Scale, Target, Activity, Flame, Dumbbell, Check, CheckCircle2, TrendingUp, Timer } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppStore } from '../../lib/store';
import { calculateCalorieAdherence, calculateNutritionHistory } from '../../lib/analytics';


export default function Overview() {
  const { user, mealItems, weightLogs } = useAppStore();

  // Derived calorie & macro totals using shared utility (Hôm Nay)
  const nutritionHistory = calculateNutritionHistory(mealItems);
  const todayMacros = nutritionHistory[nutritionHistory.length - 1];
  const adherence = calculateCalorieAdherence(mealItems, user);

  // Derived weight progress percentage
  const targetWeight = user.target_weight;
  const startingWeight = weightLogs.length > 0 ? weightLogs[0].weight : user.current_weight;
  const currentWeight = user.current_weight;
  const weightChange = currentWeight - startingWeight;
  const weightDelta = targetWeight - currentWeight;
  const weightChangePercent = startingWeight > 0 ? (weightChange / startingWeight) * 100 : 0;

  // Dual-directional progression (Bulk vs Cut)
  let weightProgressPct = 0;
  if (targetWeight > startingWeight) {
     // Bulking
     weightProgressPct = ((currentWeight - startingWeight) / (targetWeight - startingWeight)) * 100;
  } else if (targetWeight < startingWeight) {
     // Cutting
     weightProgressPct = ((startingWeight - currentWeight) / (startingWeight - targetWeight)) * 100;
  }
  // Clamp to 0-100% safely, handling division by zero/missing
  if (!isFinite(weightProgressPct) || isNaN(weightProgressPct)) weightProgressPct = 0;
  weightProgressPct = Math.max(0, Math.min(100, Math.round(weightProgressPct)));



  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-[var(--color-panel-bg)] rounded-2xl p-8 border border-[var(--color-border)] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)] mb-2">
            <span className="w-1.5 h-1.5 bg-[var(--color-primary)] rounded-full"></span>
            Hệ Thống Trực Tuyến • Thứ Hai, 28 Th10 • Giai Đoạn II
          </div>
          <h2 className="text-4xl font-bold mb-4">Chào buổi sáng, {user.name.split(' ')[0]}</h2>
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <Target className="w-4 h-4 text-[var(--color-primary)]" />
            <p>
              Mục Tiêu Tăng Cơ Nạc:  <span className="font-semibold text-white">{user.current_weight.toFixed(1)} kg</span> → <span className="font-semibold text-[var(--color-primary)]">{user.target_weight.toFixed(1)} kg</span> (+{(user.target_weight - user.current_weight).toFixed(1)} kg)
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
           <div className="flex w-full gap-3">
             <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[var(--color-card-bg)] border border-[var(--color-border)] hover:bg-[var(--color-card-hover)] px-5 py-3 rounded-xl font-medium transition-colors">
               <Scale className="w-4 h-4 text-blue-400" />
               Ghi Nhận Cân Nặng
             </button>
             <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[var(--color-card-bg)] border border-[var(--color-border)] hover:bg-[var(--color-card-hover)] px-5 py-3 rounded-xl font-medium transition-colors">
               <Flame className="w-4 h-4 text-orange-400" />
               Ghi Nhanh Đồ Ăn
             </button>
           </div>
           <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[var(--color-primary)] text-black hover:bg-[var(--color-primary-dark)] px-8 py-3 rounded-xl font-bold transition-colors">
             <Play className="w-4 h-4 fill-black" />
             Bắt Đầu Tập Đẩy
           </button>
        </div>
      </div>

      {/* Grid 1: Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>CHỈ SỐ SINH TRẮC</CardTitle>
              <h4 className="text-xl font-semibold mt-1">Cân Nặng Cơ Thể</h4>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[var(--color-card-bg)] border border-[var(--color-border)] flex items-center justify-center">
               <Scale className="w-5 h-5 text-blue-400" />
            </div>
          </CardHeader>
          <div className="mt-4 flex items-end justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">{user.current_weight.toFixed(1)}</span>
              <span className="text-xl text-[var(--color-text-muted)] font-medium">kg</span>
            </div>
            <div className="bg-[rgba(74,222,128,0.1)] text-[var(--color-primary)] px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +0.4 kg tuần này
            </div>
          </div>
          <div className="mt-8">
                <div>
                   <div className="flex justify-between text-xs mb-1 font-semibold">
                     <span>Đạm (Protein)</span>
                     <span className="text-[var(--color-primary)]">{todayMacros.pro} / {user.target_protein}g</span>
                   </div>
                   <div className="h-1.5 w-full bg-[var(--color-app-bg)] rounded-full overflow-hidden">
                     <div className="h-full bg-[var(--color-primary)] rounded-full" style={{ width: `${Math.min(100, (todayMacros.pro / user.target_protein) * 100)}%` }}></div>
                   </div>
                </div>
                <div>
                   <div className="flex justify-between text-xs mb-1 font-semibold">
                     <span>Tinh Bột (Carb)</span>
                     <span className="text-[#60a5fa]">{todayMacros.carb} / {user.target_carbs}g</span>
                   </div>
                   <div className="h-1.5 w-full bg-[var(--color-app-bg)] rounded-full overflow-hidden">
                     <div className="h-full bg-[#60a5fa] rounded-full" style={{ width: `${Math.min(100, (todayMacros.carb / user.target_carbs) * 100)}%` }}></div>
                   </div>
                </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>CÂN BẰNG NĂNG LƯỢNG</CardTitle>
              <h4 className="text-xl font-semibold mt-1">Calo Hàng Ngày</h4>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[var(--color-card-bg)] border border-[var(--color-border)] flex items-center justify-center">
               <Flame className="w-5 h-5 text-orange-400" />
            </div>
          </CardHeader>
          <div className="mt-4 flex items-center gap-6">
            <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
               <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="transparent" stroke="var(--color-card-bg)" strokeWidth="10" />
                  <circle cx="50" cy="50" r="45" fill="transparent" stroke="var(--color-primary)" strokeWidth="10" strokeDasharray="282.7" strokeDashoffset={282.7 * (1 - adherence.percentage / 100)} className="transition-all duration-1000 ease-out" />
               </svg>
               <div className="absolute inset-0 flex flex-col items-center justify-center">
                 <span className="text-xl font-bold">{adherence.percentage}%</span>
                 <span className="text-[10px] text-[var(--color-text-muted)] uppercase">đã đạt</span>
               </div>
            </div>
            <div>
               <div className="flex items-baseline gap-1">
                 <span className="text-3xl font-bold">{adherence.actual.toLocaleString()}</span>
                 <span className="text-sm text-[var(--color-text-muted)] font-medium">/ {user.target_calories.toLocaleString()}</span>
               </div>
               <div className="text-xs font-semibold text-[var(--color-primary)] mt-1">
                 {adherence.remaining.toLocaleString()} KCAL CÒN LẠI
               </div>
               <p className="text-xs text-[var(--color-text-muted)] mt-1 leading-snug">
                 Thặng dư năng lượng
               </p>
            </div>
          </div>
          <div className="mt-6 flex justify-between text-xs">
            <div>
              <div className="text-[var(--color-text-muted)] uppercase tracking-wider mb-1">PRO</div>
              <div><span className="font-semibold text-white">{todayMacros.pro}g</span> <span className="text-[var(--color-text-muted)]">/{user.target_protein}</span></div>
            </div>
            <div>
              <div className="text-[var(--color-text-muted)] uppercase tracking-wider mb-1">CARB</div>
              <div><span className="font-semibold text-blue-400">{todayMacros.carb}g</span> <span className="text-[var(--color-text-muted)]">/{user.target_carbs}</span></div>
            </div>
            <div>
              <div className="text-[var(--color-text-muted)] uppercase tracking-wider mb-1">FAT</div>
              <div><span className="font-semibold text-orange-400">{todayMacros.fat}g</span> <span className="text-[var(--color-text-muted)]">/{user.target_fat}</span></div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>NGÀY HIỆN TẠI</CardTitle>
              <h4 className="text-xl font-semibold mt-1">Buổi Tập Hôm Nay</h4>
            </div>
            <div className="bg-[var(--color-card-bg)] border border-[var(--color-border)] px-2 py-1 rounded text-[10px] font-semibold text-[var(--color-text-muted)] tracking-widest uppercase">
              SẴN SÀNG
            </div>
          </CardHeader>
          <div className="mt-2">
            <h3 className="text-2xl font-bold leading-tight">Ngày Push (Ngực, Vai, Tay Sau)</h3>
            <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)] mt-3">
               <span className="flex items-center gap-1"><Timer className="w-3 h-3" /> 75 phút</span>
               <span>•</span>
               <span className="flex items-center gap-1"><Dumbbell className="w-3 h-3" /> 6 bài tập</span>
               <span>•</span>
               <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> 18 hiệp</span>
            </div>
          </div>
          <div className="mt-8">
            <button className="w-full flex items-center justify-center gap-2 bg-[var(--color-primary)] text-black hover:bg-[var(--color-primary-dark)] px-6 py-3.5 rounded-xl font-bold transition-colors">
              <Play className="w-4 h-4 fill-black" />
              Bắt Đầu
            </button>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Workout Routine */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[rgba(74,222,128,0.1)] border border-[var(--color-primary)]/20 flex items-center justify-center">
                 <Dumbbell className="w-4 h-4 text-[var(--color-primary)]" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Danh Sách Bài Đang Chờ</h3>
                <p className="text-xs text-[var(--color-text-muted)]">Tăng cơ phì đại • Thiết lập tiến trình đã sẵn sàng</p>
              </div>
            </div>
            <div className="bg-[var(--color-panel-bg)] border border-[var(--color-border)] px-3 py-1.5 rounded-md text-[10px] font-semibold text-[var(--color-text-muted)] tracking-widest uppercase">
              CHỜ DO THỰC HIỆN
            </div>
          </div>

          <div className="space-y-3">
            {[
              { id: '01', name: 'Đẩy Ngực Trên Máy Smith', tags: ['Ngực Trên', 'Vai Trước'], sets: '4 Hiệp • 8-10 Reps', pr: '60 kg × 10' },
              { id: '02', name: 'Kéo Xô Rộng Tay', tags: ['Xô / Lưng'], sets: '4 Hiệp • 10-12 Reps', pr: '55 kg × 12' },
              { id: '03', name: 'Ép Ngực Máy', tags: ['Ngực Giữa'], sets: '3 Hiệp • 12-15 Reps', pr: '45 kg × 12' },
              { id: '04', name: 'Cuốn Cáp Thanh Chữ V', tags: ['Tay Trước'], sets: '3 Hiệp • 10-12 Reps', pr: '22.5 kg × 10' },
              { id: '05', name: 'Kéo Cáp Tay Sau', tags: ['Tay Sau'], sets: '3 Hiệp • 12-15 Reps', pr: '25 kg × 12' },
              { id: '06', name: 'Bài Tập Chèo Thuyền', tags: ['Kéo Lưng / Cầu Vai'], sets: '3 Hiệp • 10-12 Reps', pr: '50 kg × 10' },
            ].map((exercise) => (
              <div key={exercise.id} className="bg-[var(--color-panel-bg)] border border-[var(--color-border)] rounded-xl p-4 flex items-center gap-4 hover:border-[var(--color-card-hover)] transition-colors group">
                <div className="w-12 h-12 rounded-lg bg-[var(--color-app-bg)] border border-[var(--color-border)] flex flex-col items-center justify-center shrink-0">
                  <span className="text-[10px] text-[var(--color-text-muted)] font-bold"></span>
                  <span className="text-sm font-bold text-[var(--color-primary)]">{exercise.id}</span>
                </div>
                <div className="flex-1 min-w-0">
                   <h4 className="font-semibold text-[15px] truncate">{exercise.name}</h4>
                   <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {exercise.tags.map(tag => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded bg-[var(--color-app-bg)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
                          {tag}
                        </span>
                      ))}
                      <span className="text-[10px] text-[var(--color-text-muted)] ml-2">{exercise.sets}</span>
                   </div>
                </div>
                <div className="text-right hidden sm:block shrink-0">
                  <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-0.5">KỶ LỤC TRƯỚC</div>
                  <div className="text-sm font-bold">{exercise.pr}</div>
                </div>
                <button className="w-10 h-10 shrink-0 rounded-lg bg-[var(--color-app-bg)] border border-[var(--color-border)] flex items-center justify-center hover:bg-[var(--color-card-hover)] text-[var(--color-text-muted)] hover:text-white transition-colors ml-2">
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          
          <div className="bg-[var(--color-panel-bg)] border border-[var(--color-border)] rounded-xl p-4 mt-2 flex items-start gap-3">
             <div className="mt-0.5"><Activity className="w-4 h-4 text-[var(--color-primary)]" /></div>
             <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
               Giữ RPE từ 8.5 đến 9 trên những hiệp sau cùng. Thời gian giãn cách yêu cầu phải đúng 90 giây.
             </p>
          </div>
        </div>

        {/* Right Col */}
        <div className="space-y-6">
          <Card>
             <CardHeader className="mb-8">
               <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[var(--color-primary)]" />
                  <CardTitle className="text-sm text-white">Mục Tiêu<br/>Vĩ Mô</CardTitle>
               </div>
               <div className="text-right">
                  <div className="text-sm font-semibold">{adherence.actual.toLocaleString()} <span className="text-[var(--color-text-muted)]">/ {user.target_calories.toLocaleString()}</span></div>
                  <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest mt-0.5">KCAL</div>
               </div>
             </CardHeader>
             
             <div className="flex justify-between items-center mb-10 px-2">
                {[
                  { label: 'ĐẠM', current: todayMacros.pro, target: user.target_protein, color: 'var(--color-primary)' },
                  { label: 'TINH BỘT', current: todayMacros.carb, target: user.target_carbs, color: '#60a5fa' },
                  { label: 'CHẤT BÉO', current: todayMacros.fat, target: user.target_fat, color: '#fb923c' },
                ].map((macro) => {
                  const percent = Math.round((macro.current / macro.target) * 100);
                  return (
                    <div key={macro.label} className="flex flex-col items-center">
                      <div className="relative w-16 h-16 flex items-center justify-center mb-3">
                         <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="42" fill="transparent" stroke="var(--color-app-bg)" strokeWidth="8" />
                            <circle cx="50" cy="50" r="42" fill="transparent" stroke={macro.color} strokeWidth="8" strokeDasharray="263.89" strokeDashoffset={263.89 * (1 - percent / 100)} className="transition-all duration-1000 ease-out" />
                         </svg>
                         <span className="absolute text-xs font-bold">{percent}%</span>
                      </div>
                      <div className="text-[10px] font-semibold tracking-widest text-[var(--color-text-muted)] mb-1">{macro.label}</div>
                      <div className="text-[10px] font-bold"><span style={{ color: macro.color }}>{macro.current}</span> / <span className="text-[var(--color-text-muted)]">{macro.target}g</span></div>
                    </div>
                  )
                })}
             </div>

             <div className="border-t border-[var(--color-border)] pt-6">
                <div className="flex justify-between items-center mb-3 text-xs">
                   <span className="text-[var(--color-text-muted)] uppercase tracking-widest font-semibold">PHÂN BỔ BỮA ĂN</span>
                   <span className="text-[var(--color-primary)] font-semibold">4 / 5 Cữ Điểm</span>
                </div>
                <div className="flex gap-1 h-2 mb-4">
                   <div className="h-full rounded-full bg-[var(--color-primary)]" style={{ flex: 1.5 }}></div>
                   <div className="h-full rounded-full bg-[#60a5fa]" style={{ flex: 2 }}></div>
                   <div className="h-full rounded-full bg-[#fb923c]" style={{ flex: 1 }}></div>
                   <div className="h-full rounded-full bg-[var(--color-primary)]" style={{ flex: 1.5 }}></div>
                   <div className="h-full rounded-full bg-[var(--color-app-bg)] border border-[var(--color-border)]" style={{ flex: 1 }}></div>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-[var(--color-text-muted)]">
                   <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[var(--color-primary)]"></span> Bữa Sáng (620)</div>
                   <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#60a5fa]"></span> Bữa Trưa (780)</div>
                   <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#fb923c]"></span> Trước Tập (380)</div>
                   <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[var(--color-primary)]"></span> Bữa Tối (560)</div>
                </div>
             </div>
          </Card>

          <Card className="flex flex-col h-72">
             <CardHeader className="mb-0">
               <div>
                  <CardTitle>QŨY ĐẠO SINH TRẮC</CardTitle>
                  <h4 className="text-lg font-semibold mt-1">Sơ Đồ Vector<br/>Nhịp Phát Triển</h4>
               </div>
               <div className="flex gap-1 bg-[var(--color-app-bg)] p-1 rounded-lg border border-[var(--color-border)] text-[10px] font-semibold">
                  <button className="px-2 py-1 rounded">7 Ngày</button>
                  <button className="px-2 py-1 rounded bg-[var(--color-card-bg)] text-[var(--color-primary)]">30 Ngày</button>
                  <button className="px-2 py-1 rounded">3 Tháng</button>
                  <button className="px-2 py-1 rounded">6 Tháng</button>
               </div>
             </CardHeader>
             
             <div className="flex-1 mt-4 relative min-h-0">
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={weightLogs} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                   <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} dy={10} />
                   <YAxis domain={['dataMin - 1', 'dataMax + 1']} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
                   <Tooltip 
                     contentStyle={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-border)', borderRadius: '8px', fontSize: '12px' }}
                     itemStyle={{ color: 'var(--color-primary)' }}
                   />
                   <Line type="monotone" dataKey="weight" stroke="var(--color-primary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--color-primary)', strokeWidth: 2, stroke: 'var(--color-panel-bg)' }} activeDot={{ r: 6 }} />
                 </LineChart>
               </ResponsiveContainer>
               
               {/* Target Line Overlay */}
               <div className="absolute top-4 left-8 right-2 border-t border-dashed border-[var(--color-text-muted)] opacity-50 z-0"></div>
               <div className="absolute top-0 right-2 text-[8px] text-[var(--color-primary)] uppercase font-bold tracking-wider">MỤC TIÊU: {user.target_weight.toFixed(1)} KG</div>
               
               <div className="absolute bottom-10 right-4 bg-[var(--color-card-bg)] border border-[var(--color-border)] px-2 py-1 rounded text-center">
                 <div className="text-[10px] font-bold text-[var(--color-primary)]">{user.current_weight.toFixed(1)} kg</div>
                 <div className="text-[8px] text-[var(--color-text-muted)]">Hôm Nay</div>
               </div>
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
