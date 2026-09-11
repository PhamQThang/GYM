import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Scale } from 'lucide-react';

interface OverviewWeightChartProps {
  weightLogs: { date: string; weight: number }[];
  targetWeight: number;
  currentWeight: number;
}

export default function OverviewWeightChart({ weightLogs, targetWeight, currentWeight }: OverviewWeightChartProps) {
  if (weightLogs.length <= 1) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center gap-2">
        <Scale className="w-8 h-8 text-[var(--color-text-muted)] opacity-30" />
        <p className="text-sm text-[var(--color-text-muted)]">Chưa có dữ liệu cân nặng</p>
        <p className="text-xs text-[var(--color-text-muted)] opacity-60">Ghi nhận cân nặng để xem xu hướng</p>
      </div>
    );
  }

  return (
    <>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={weightLogs} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} dy={10} />
          <YAxis domain={[(dataMin: number) => Math.min(dataMin, targetWeight) - 1, (dataMax: number) => Math.max(dataMax, targetWeight) + 1]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
          <Tooltip
            contentStyle={{ backgroundColor: 'var(--color-card-bg)', borderColor: 'var(--color-border)', borderRadius: '8px', fontSize: '12px' }}
            itemStyle={{ color: 'var(--color-primary)' }}
          />
          <ReferenceLine y={targetWeight} stroke="var(--color-primary)" strokeDasharray="3 3" strokeWidth={1.5} strokeOpacity={0.8} />
          <Line type="monotone" dataKey="weight" stroke="var(--color-primary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--color-primary)', strokeWidth: 2, stroke: 'var(--color-panel-bg)' }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
      <div className="absolute top-2 left-4 text-[8px] text-[var(--color-primary)] uppercase font-bold tracking-wider">MỤC TIÊU: {targetWeight.toFixed(1)} KG</div>
      <div className="absolute bottom-10 right-4 bg-[var(--color-card-bg)] border border-[var(--color-border)] px-2 py-1 rounded text-center">
        <div className="text-[10px] font-bold text-[var(--color-primary)]">{currentWeight.toFixed(1)} kg</div>
        <div className="text-[8px] text-[var(--color-text-muted)]">Hôm Nay</div>
      </div>
    </>
  );
}
