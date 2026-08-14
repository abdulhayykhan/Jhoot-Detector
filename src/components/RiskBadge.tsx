import React from 'react';
import { AlertTriangle, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { RiskLevel } from '../types';
import { useTheme } from '../context/ThemeContext';

interface RiskBadgeProps {
  level: RiskLevel;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (level === 'HIGH') {
    return (
      <div
        className={`inline-flex items-center gap-3 px-5 py-3 rounded-xl border-2 shadow-lg transition-all ${
          isDark
            ? 'bg-rose-500/15 border-rose-500/60 text-rose-300 shadow-rose-950/20'
            : 'bg-rose-50 border-rose-600 text-rose-950 shadow-rose-900/10'
        }`}
      >
        <div
          className={`p-2 rounded-lg border ${
            isDark
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
              : 'bg-rose-100 border-rose-300 text-rose-700'
          }`}
        >
          <AlertOctagon className="w-7 h-7 stroke-[2.5]" />
        </div>
        <div>
          <span
            className={`block text-xs font-bold uppercase tracking-wider ${
              isDark ? 'text-rose-400' : 'text-rose-800'
            }`}
          >
            Overall Assessment
          </span>
          <span
            className={`text-xl sm:text-2xl font-black tracking-wide ${
              isDark ? 'text-rose-200' : 'text-rose-950'
            }`}
          >
            HIGH RISK (خطرناک فراڈ)
          </span>
        </div>
      </div>
    );
  }

  if (level === 'MEDIUM') {
    return (
      <div
        className={`inline-flex items-center gap-3 px-5 py-3 rounded-xl border-2 shadow-lg transition-all ${
          isDark
            ? 'bg-amber-500/15 border-amber-500/60 text-amber-300 shadow-amber-950/20'
            : 'bg-amber-50 border-amber-600 text-amber-950 shadow-amber-900/10'
        }`}
      >
        <div
          className={`p-2 rounded-lg border ${
            isDark
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
              : 'bg-amber-100 border-amber-300 text-amber-800'
          }`}
        >
          <AlertTriangle className="w-7 h-7 stroke-[2.5]" />
        </div>
        <div>
          <span
            className={`block text-xs font-bold uppercase tracking-wider ${
              isDark ? 'text-amber-400' : 'text-amber-800'
            }`}
          >
            Overall Assessment
          </span>
          <span
            className={`text-xl sm:text-2xl font-black tracking-wide ${
              isDark ? 'text-amber-200' : 'text-amber-950'
            }`}
          >
            MEDIUM RISK (مشتبہ اشتہار)
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-3 px-5 py-3 rounded-xl border-2 shadow-lg transition-all ${
        isDark
          ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-300 shadow-emerald-950/20'
          : 'bg-emerald-50 border-emerald-600 text-emerald-950 shadow-emerald-900/10'
      }`}
    >
      <div
        className={`p-2 rounded-lg border ${
          isDark
            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
            : 'bg-emerald-100 border-emerald-300 text-emerald-800'
        }`}
      >
        <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
      </div>
      <div>
        <span
          className={`block text-xs font-bold uppercase tracking-wider ${
            isDark ? 'text-emerald-400' : 'text-emerald-800'
          }`}
        >
          Overall Assessment
        </span>
        <span
          className={`text-xl sm:text-2xl font-black tracking-wide ${
            isDark ? 'text-emerald-200' : 'text-emerald-950'
          }`}
        >
          LOW RISK (محفوظ / جائز)
        </span>
      </div>
    </div>
  );
};
