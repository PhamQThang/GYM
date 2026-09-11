import React, { useState, useRef } from 'react';
import { useAppStore } from '../../lib/store';
import { exportData, validateImportPayload } from '../../lib/data-management';
import { Save, Download, Upload, AlertTriangle, CheckCircle, RefreshCcw, UserCircle, Target, Database } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

export default function Settings() {
  const user = useAppStore((s) => s.user);
  const updateUser = useAppStore((s) => s.updateUser);
  const importState = useAppStore((s) => s.importState);
  const resetApp = useAppStore((s) => s.resetApp);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local buffering for UI text inputs
  const [localName, setLocalName] = useState(user.name);
  const [localHeight, setLocalHeight] = useState<string | number>(user.height ?? '');
  const [localTargetWeight, setLocalTargetWeight] = useState<string | number>(user.target_weight);
  const [localGoal, setLocalGoal] = useState(user.goal_type || 'Maintain');

  const [localCals, setLocalCals] = useState<string | number>(user.target_calories);
  const [localPro, setLocalPro] = useState<string | number>(user.target_protein);
  const [localCarbs, setLocalCarbs] = useState<string | number>(user.target_carbs);
  const [localFat, setLocalFat] = useState<string | number>(user.target_fat);

  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleSaveProfile = () => {
    const h = Number(localHeight);
    const tw = Number(localTargetWeight);
    if (!localName.trim()) return showMsg('error', 'Tên không được để trống.');
    if (isNaN(h) || h <= 0) return showMsg('error', 'Chiều cao phải là số dương.');
    if (isNaN(tw) || tw <= 0) return showMsg('error', 'Cân nặng mục tiêu phải là số dương.');

    updateUser({ 
      name: localName, 
      height: h, 
      target_weight: tw, 
      goal_type: localGoal as any 
    });
    showMsg('success', 'Đã lưu cấu hình tài khoản.');
  };

  const handleSaveNutrition = () => {
    const cal = Number(localCals);
    const p = Number(localPro);
    const c = Number(localCarbs);
    const f = Number(localFat);

    if ([cal, p, c, f].some(v => isNaN(v) || v < 0)) {
      return showMsg('error', 'Chỉ được nhập số không âm vào bảng dinh dưỡng.');
    }

    updateUser({ 
      target_calories: cal, 
      target_protein: p, 
      target_carbs: c, 
      target_fat: f 
    });
    showMsg('success', 'Đã lưu cấu hình dinh dưỡng.');
  };

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const txt = event.target?.result as string;
      const res = validateImportPayload(txt);
      if (res.success && res.data) {
        importState(res.data);
        showMsg('success', 'Khôi phục dữ liệu thành công!');
      } else {
        showMsg('error', res.error || 'Lỗi khối phục.');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.onerror = () => {
      showMsg('error', 'Truy xuất file thất bại.');
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    resetApp();
    setShowResetConfirm(false);
    showMsg('success', 'Đã reset ứng dụng về mặc định.');
    window.location.reload();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20">
      <div className="flex justify-between items-center bg-[var(--color-panel-bg)] border border-[var(--color-border)] p-6 rounded-2xl">
         <div>
           <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Cài Đặt Hệ Thống</h2>
           <p className="text-sm text-[var(--color-text-muted)] mt-1">Cá nhân hoá trải nghiệm và sao lưu dữ liệu bộ nhớ cục bộ.</p>
         </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
           {message.type === 'success' ? <CheckCircle className="w-5 h-5"/> : <AlertTriangle className="w-5 h-5"/>}
           <span className="font-semibold text-sm">{message.text}</span>
        </div>
      )}

      {/* Profile Section */}
      <Card>
        <CardHeader className="border-b border-[var(--color-border)] mb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
             <UserCircle className="w-5 h-5 text-[var(--color-primary)]" />
             Hồ Sơ Cá Nhân
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <label className="block text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] mb-1 font-semibold">Tên Gọi</label>
               <input value={localName} onChange={e => setLocalName(e.target.value)} className="w-full bg-[var(--color-panel-bg)] border border-[var(--color-border)] px-4 py-2 rounded-xl focus:border-[var(--color-primary)] outline-none" />
             </div>
             <div>
               <label className="block text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] mb-1 font-semibold">Chiều Cao (cm)</label>
               <input type="number" value={localHeight} onChange={e => setLocalHeight(e.target.value)} className="w-full bg-[var(--color-panel-bg)] border border-[var(--color-border)] px-4 py-2 rounded-xl focus:border-[var(--color-primary)] outline-none" />
             </div>
             <div>
               <label className="block text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] mb-1 font-semibold">Mục Tiêu (Cân Nặng)</label>
               <input type="number" value={localTargetWeight} onChange={e => setLocalTargetWeight(e.target.value)} className="w-full bg-[var(--color-panel-bg)] border border-[var(--color-border)] px-4 py-2 rounded-xl focus:border-[var(--color-primary)] outline-none" />
             </div>
             <div>
               <label className="block text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] mb-1 font-semibold">Chu Kỳ Hiện Tại</label>
               <select value={localGoal} onChange={e => setLocalGoal(e.target.value)} className="w-full bg-[var(--color-panel-bg)] border border-[var(--color-border)] px-4 py-2 rounded-xl focus:border-[var(--color-primary)] outline-none appearance-none">
                 <option value="Cut">Cut (Giảm Mỡ)</option>
                 <option value="Maintenance">Maintain (Duy Trì)</option>
                 <option value="Lean Bulk">Bulk (Tăng Cơ)</option>
               </select>
             </div>
          </div>
          <div className="flex justify-end pt-2">
            <button onClick={handleSaveProfile} className="flex items-center gap-2 bg-[var(--color-app-bg)] hover:bg-[var(--color-primary)]/10 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/30 px-6 py-2 rounded-xl text-sm font-semibold transition-all">
              <Save className="w-4 h-4" /> Lưu Hồ Sơ
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Nutrition Section */}
      <Card>
        <CardHeader className="border-b border-[var(--color-border)] mb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
             <Target className="w-5 h-5 text-orange-400" />
             Chỉ Tiêu Dinh Dưỡng
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div>
               <label className="block text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] mb-1 font-semibold">Calories (kcal)</label>
               <input type="number" value={localCals} onChange={e => setLocalCals(e.target.value)} className="w-full bg-[var(--color-panel-bg)] border border-[var(--color-border)] px-4 py-2 rounded-xl focus:border-[var(--color-primary)] outline-none" />
             </div>
             <div>
               <label className="block text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] mb-1 font-semibold">Protein (g)</label>
               <input type="number" value={localPro} onChange={e => setLocalPro(e.target.value)} className="w-full bg-[var(--color-panel-bg)] border border-[var(--color-border)] px-4 py-2 rounded-xl focus:border-blue-400 outline-none" />
             </div>
             <div>
               <label className="block text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] mb-1 font-semibold">Carbs (g)</label>
               <input type="number" value={localCarbs} onChange={e => setLocalCarbs(e.target.value)} className="w-full bg-[var(--color-panel-bg)] border border-[var(--color-border)] px-4 py-2 rounded-xl focus:border-orange-400 outline-none" />
             </div>
             <div>
               <label className="block text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] mb-1 font-semibold">Fat (g)</label>
               <input type="number" value={localFat} onChange={e => setLocalFat(e.target.value)} className="w-full bg-[var(--color-panel-bg)] border border-[var(--color-border)] px-4 py-2 rounded-xl focus:border-yellow-400 outline-none" />
             </div>
          </div>
          <div className="flex justify-end pt-2">
             <button onClick={handleSaveNutrition} className="flex items-center gap-2 bg-[var(--color-app-bg)] hover:bg-orange-500/10 text-[var(--color-text-muted)] hover:text-orange-400 border border-[var(--color-border)] hover:border-orange-500/30 px-6 py-2 rounded-xl text-sm font-semibold transition-all">
                <Save className="w-4 h-4" /> Lưu Macros
             </button>
          </div>
        </CardContent>
      </Card>

      {/* App Definitions (Read-Only Version) */}
      <Card>
        <CardHeader className="border-b border-[var(--color-border)] mb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
             <Database className="w-5 h-5 text-purple-400" />
             Cấu Hình & Lưu Trữ
          </CardTitle>
        </CardHeader>
        <CardContent>
           <div className="flex items-center gap-8 mb-8 text-sm font-medium text-[var(--color-text-muted)]">
              <div>Hệ Mét: <span className="text-white ml-2">{user.weight_unit?.toUpperCase() || 'KG'}</span></div>
              <div>Năng Lượng: <span className="text-white ml-2">{user.energy_unit?.toUpperCase() || 'KCAL'}</span></div>
              <div>Phiên Bản: <span className="text-white ml-2">V1.0.8</span></div>
           </div>

           <div className="flex flex-col gap-4 max-w-sm">
             <button onClick={exportData} className="flex items-center justify-between bg-[var(--color-app-bg)] border border-[var(--color-border)] hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400 transition-colors p-4 rounded-xl text-sm font-bold text-left group">
                <div className="flex flex-col">
                   <span>Sao Lưu (Export)</span>
                   <span className="text-[10px] text-[var(--color-text-muted)] mt-0.5 group-hover:text-emerald-400/70 font-normal">Tải xuống tệp .json toàn bộ hệ thống</span>
                </div>
                <Download className="w-5 h-5 text-[var(--color-text-muted)] group-hover:text-emerald-400" />
             </button>

             <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-between bg-[var(--color-app-bg)] border border-[var(--color-border)] hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-400 transition-colors p-4 rounded-xl text-sm font-bold text-left group">
                <div className="flex flex-col">
                   <span>Khôi Phục (Import)</span>
                   <span className="text-[10px] text-[var(--color-text-muted)] mt-0.5 group-hover:text-blue-400/70 font-normal">Dùng tệp .json để ghi đè dữ liệu</span>
                </div>
                <Upload className="w-5 h-5 text-[var(--color-text-muted)] group-hover:text-blue-400" />
             </button>
             <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />

             <button onClick={() => setShowResetConfirm(true)} className="flex items-center justify-between bg-[var(--color-app-bg)] border border-red-500/20 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400 transition-colors p-4 rounded-xl text-sm font-bold text-left group mt-4">
                <div className="flex flex-col text-red-500">
                   <span>Khôi Phục Mặc Định</span>
                   <span className="text-[10px] mt-0.5 font-normal">Xóa sạch toàn bộ dữ liệu lịch sử</span>
                </div>
                <RefreshCcw className="w-5 h-5 text-red-400" />
             </button>
           </div>
        </CardContent>
      </Card>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
           <div className="bg-[var(--color-card-bg)] border border-red-500/30 rounded-3xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-200">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/30 mb-4 mx-auto">
                 <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-center mb-2">Cảnh Báo Nguy Hiểm</h3>
              <p className="text-sm text-[var(--color-text-muted)] text-center mb-6 leading-relaxed">
                 Thao tác này sẽ <span className="text-red-400 font-bold">xóa vĩnh viễn</span> toàn bộ lịch sử tập luyện, dinh dưỡng, thiết lập cá nhân và biến thể bài tập của bạn. Hệ thống sẽ trở lại như mới.
              </p>
              <div className="flex flex-col gap-2">
                 <button onClick={handleReset} className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors">XÓA TOÀN BỘ</button>
                 <button onClick={() => setShowResetConfirm(false)} className="w-full bg-[var(--color-app-bg)] hover:bg-[var(--color-panel-bg)] border border-[var(--color-border)] text-white font-semibold py-3 rounded-xl transition-colors">Hủy Bỏ</button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}
