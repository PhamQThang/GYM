import { Download, Plus, Flame, Dumbbell, Activity, CheckCircle2, ChevronRight, History, Trophy } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAppStore } from '../../lib/store';
import { calculateWeeklyVolume, calculatePersonalRecords, formatVietnamShortDate, calculateNutritionHistory } from '../../lib/analytics';



export default function Progress() {
  const { user, weightLogs, mealItems, logWeight, workoutHistory, setHistory, workoutExercises, exercises } = useAppStore();

  const weightDelta = user.target_weight - user.current_weight;
  const startingWeight = weightLogs.length > 0 ? weightLogs[0].weight : user.current_weight;
  const weightChange = user.current_weight - startingWeight;
  const weightChangePercent = startingWeight > 0 ? (weightChange / startingWeight) * 100 : 0;

  // ── Weekly Volume (real data from completed sessions + sets) ──
  const weeklyVolumes = calculateWeeklyVolume(workoutHistory, setHistory);

  // ── Personal Records (real data from setHistory) ──
  const personalRecords = calculatePersonalRecords(setHistory, workoutHistory, workoutExercises, exercises);

  // ── 7-Day Nutrition History ──
  const nutritionHistory = calculateNutritionHistory(mealItems);
  const todayMacros = nutritionHistory[nutritionHistory.length - 1];

  const handleLogWeight = () => {
    const val = window.prompt('Nhập cân nặng mới (kg):', user.current_weight.toString());
    const wei = val ? parseFloat(val) : 0;
    if (wei > 0) logWeight(wei);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Header Panel */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)] mb-2">
            <span className="bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-2 py-0.5 rounded border border-[var(--color-primary)]/30">GIAI ĐOẠN II // MACROCYCLE</span>
            <span className="text-[var(--color-text-muted)]">• Đo Lường Theo Dõi v2.4</span>
          </div>
          <h2 className="text-3xl font-bold mb-2">Phân Tích & Tuyến Tiến Độ</h2>
          <p className="text-sm text-[var(--color-text-muted)] max-w-xl">
            Theo Dõi Mật Độ Cơ Thể • Giai Đoạn Meso II (Tăng Cơ Nạc) • {workoutHistory.filter(s => s.status === 'COMPLETED').length} buổi tập hoàn thành
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[var(--color-app-bg)] text-white border border-[var(--color-border)] hover:bg-[var(--color-card-hover)] px-5 py-2.5 rounded-xl text-xs font-bold transition-colors">
            <Download className="w-4 h-4" /> Xuất File CSV
          </button>
          <button onClick={handleLogWeight} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[var(--color-primary)] text-black hover:bg-[var(--color-primary-dark)] px-5 py-2.5 rounded-xl text-xs font-bold transition-colors">
            <Plus className="w-4 h-4" /> Ghi Cân Nặng
          </button>
        </div>
      </div>

      {/* Weight Chart */}
      <Card className="h-96 flex flex-col">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]"></span>
              <h3 className="text-xl font-bold">Biểu Đồ Phát Triển Cân Nặng</h3>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">Cân trọng lượng cơ thể hàng ngày với trung bình động 7 ngày</p>
          </div>

          <div className="flex gap-6 lg:gap-12">
            <div>
              <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest font-semibold mb-1">CÂN BAN ĐẦU</div>
              <div className="flex items-baseline gap-1"><span className="text-2xl font-bold text-white">{startingWeight.toFixed(1)}</span><span className="text-xs text-[var(--color-text-muted)]">kg</span></div>
            </div>
            <div>
              <div className="text-[10px] text-[var(--color-primary)] uppercase tracking-widest font-semibold mb-1">HIỆN TẠI</div>
              <div className="flex items-baseline gap-1"><span className="text-2xl font-bold text-[var(--color-primary)]">{user.current_weight.toFixed(1)}</span><span className="text-xs text-[var(--color-text-muted)]">kg</span></div>
              <div className="text-[10px] text-[var(--color-text-muted)]">{weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg ({weightChange > 0 ? '+' : ''}{weightChangePercent.toFixed(1)}%)</div>
            </div>
            <div>
              <div className="text-[10px] text-blue-400 uppercase tracking-widest font-semibold mb-1">MỤC TIÊU</div>
              <div className="flex items-baseline gap-1"><span className="text-2xl font-bold text-blue-400">{user.target_weight.toFixed(1)}</span><span className="text-xs text-[var(--color-text-muted)]">kg</span></div>
              <div className="text-[10px] text-[var(--color-text-muted)]">Còn {Math.abs(weightDelta).toFixed(1)} kg</div>
            </div>
          </div>
        </div>

        <div className="flex-1 relative min-h-0">
          {weightLogs.length < 2 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-[var(--color-text-muted)]">
              <div className="text-sm font-semibold">Cần tối thiểu 2 lần cân để hiển thị biểu đồ</div>
              <button onClick={handleLogWeight} className="mt-3 text-xs text-[var(--color-primary)] hover:underline">Ghi cân nặng ngay</button>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightLogs} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} dy={10} />
                <YAxis domain={['auto', 'auto']} hide={true} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-border)', borderRadius: '8px', fontSize: '12px' }} itemStyle={{ color: 'var(--color-primary)' }} />
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <Line type="monotone" dataKey="weight" stroke="var(--color-primary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--color-primary)', strokeWidth: 2, stroke: 'var(--color-panel-bg)' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
          <div className="absolute top-[10%] left-0 text-[10px] text-blue-400 font-bold uppercase tracking-widest">GIỚI HẠN MỤC TIÊU: {user.target_weight.toFixed(1)} KG</div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Tonnage — real data */}
        <Card>
          <CardHeader className="mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Dumbbell className="w-5 h-5 text-[var(--color-primary)]" />
                <h3 className="text-lg font-bold">Khối Lượng Tập Hàng Tuần</h3>
              </div>
              <p className="text-[10px] text-[var(--color-text-muted)]">Tổng tải (kg × lần) qua các buổi tập đã hoàn thành</p>
            </div>
            {weeklyVolumes.length > 1 && (
              <div className="bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/30 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-bold shrink-0">
                <Activity className="w-3 h-3" />
                {weeklyVolumes[weeklyVolumes.length - 1]?.change ?? 'Tuần Đầu'}
              </div>
            )}
          </CardHeader>

          {weeklyVolumes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-[var(--color-text-muted)]">
              <Dumbbell className="w-8 h-8 mb-3 opacity-30" />
              <p className="text-sm font-semibold">Chưa Có Dữ Liệu</p>
              <p className="text-xs mt-1">Hoàn thành buổi tập đầu tiên để xem khối lượng hàng tuần</p>
            </div>
          ) : (
            <div className="space-y-4">
              {weeklyVolumes.map((w, i) => (
                <div key={w.weekKey}>
                  <div className="flex justify-between items-center mb-2 text-[10px] font-semibold tracking-wider">
                    <span className={i === weeklyVolumes.length - 1 ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'}>
                      Tuần {i + 1} ({w.weekLabel})
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-white text-xs">{w.volume.toLocaleString()} kg</span>
                      {w.change && <span className="text-[var(--color-primary)]">({w.change})</span>}
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-[var(--color-app-bg)] rounded-full overflow-hidden border border-[var(--color-border)]">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${i === weeklyVolumes.length - 1 ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-card-bg)]'}`}
                      style={{ width: `${w.pctOfMax}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Calorie Chart — today only, limitation noted */}
        <Card className="flex flex-col">
          <CardHeader className="mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Flame className="w-5 h-5 text-[var(--color-primary)]" />
                <h3 className="text-lg font-bold">Lịch Sử Dinh Dưỡng</h3>
              </div>
              <p className="text-[10px] text-[var(--color-text-muted)]">
                Theo dõi Macro trong 7 ngày qua (Dữ liệu cũ tự động gộp vào hôm nay)
              </p>
            </div>
          </CardHeader>

          <div className="flex items-center justify-between text-[10px] text-[var(--color-text-muted)] font-semibold uppercase tracking-widest mb-4">
            <div className="flex gap-4">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[var(--color-primary)] rounded"></span> Đạm ({user.target_protein}g)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#60a5fa] rounded"></span> Tinh Bột ({user.target_carbs}g)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#fb923c] rounded"></span> Béo ({user.target_fat}g)</span>
            </div>
          </div>

          <div className="flex-1 min-h-[180px] w-full bg-[var(--color-app-bg)] rounded-xl border border-[var(--color-border)] p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={nutritionHistory} barSize={40}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} dy={5} />
                <Tooltip cursor={{ fill: 'var(--color-card-bg)' }} contentStyle={{ backgroundColor: 'var(--color-panel-bg)', borderColor: 'var(--color-border)' }} />
                <Bar dataKey="pro" stackId="a" fill="var(--color-primary)" />
                <Bar dataKey="carb" stackId="a" fill="#60a5fa" />
                <Bar dataKey="fat" stackId="a" fill="#fb923c" radius={[4, 4, 0, 0]}>
                  {nutritionHistory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fillOpacity={entry.active ? 1 : 0.4} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Personal Records — real data */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/20 text-[var(--color-primary)] flex items-center justify-center border border-[var(--color-primary)]/30">
              <Trophy className="w-4 h-4" />
            </div>
            <h3 className="text-xl font-bold">Kỷ Lục Cá Nhân</h3>
          </div>
          <span className="text-xs text-[var(--color-text-muted)]">{personalRecords.length} kỷ lục được ghi nhận</span>
        </div>

        {personalRecords.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-14 text-center">
            <Trophy className="w-10 h-10 text-[var(--color-text-muted)] mb-4 opacity-30" />
            <h4 className="text-base font-bold mb-2">Chưa Có Kỷ Lục</h4>
            <p className="text-sm text-[var(--color-text-muted)] max-w-xs">
              Hoàn thành buổi tập với các hiệp có tải trọng để bắt đầu ghi nhận kỷ lục.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {personalRecords.slice(0, 8).map((pr) => (
              <Card key={pr.exerciseId} className="flex flex-col h-full hover:border-[var(--color-primary)]/40 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] font-semibold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2 py-0.5 rounded border border-[var(--color-primary)]/20 uppercase tracking-wider">{pr.muscleGroup}</span>
                  <span className="text-[10px] text-[var(--color-text-muted)] flex items-center gap-1">
                    <History className="w-3 h-3" /> {formatVietnamShortDate(pr.achievedAt)}
                  </span>
                </div>
                <h4 className="text-sm font-bold mb-4 leading-snug">{pr.exerciseName}</h4>

                <div className="mt-auto">
                  <div className="flex items-end justify-between border-b border-[var(--color-border)] pb-3 mb-3">
                    <div>
                      <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Mức PR Hiện Tại</div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold">{pr.bestSet.weight} kg</span>
                        <span className="text-sm text-[var(--color-text-muted)]">× {pr.bestSet.reps}</span>
                      </div>
                    </div>
                    <div className="bg-[var(--color-app-bg)] text-[var(--color-primary)] text-[10px] font-bold px-2 py-1 rounded border border-[var(--color-border)] flex items-center gap-1">
                      <Trophy className="w-3 h-3" /> PR
                    </div>
                  </div>
                  <div className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider flex items-center justify-between">
                    <span>Khối lượng: {(pr.bestSet.weight * pr.bestSet.reps).toLocaleString()} kg</span>
                    <CheckCircle2 className="w-4 h-4 text-[var(--color-primary)]" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
