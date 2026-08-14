import React from 'react';
import { ShieldCheck, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <header
      className={`border-b transition-colors duration-200 shadow-sm ${
        isDark
          ? 'bg-slate-900 border-emerald-900/40 text-slate-100'
          : 'bg-white border-slate-200 text-slate-900'
      }`}
    >
      <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-inner transition-colors ${
                isDark
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                  : 'bg-emerald-50 border border-emerald-300 text-emerald-700'
              }`}
            >
              <span className="text-2xl" role="img" aria-label="detective">
                🕵️
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1
                  className={`text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-1.5 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  Jhoot Detector
                </h1>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border transition-colors ${
                    isDark
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}
                >
                  AI Scam Shield
                </span>
              </div>
              <p
                className={`text-xs sm:text-sm font-normal mt-0.5 transition-colors ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                Paste a job post. We'll tell you if it's{' '}
                <span
                  className={`font-semibold ${
                    isDark ? 'text-emerald-400' : 'text-emerald-700'
                  }`}
                >
                  jhooṭ
                </span>{' '}
                (fraudulent).
              </p>
            </div>
          </div>

          {/* Actions: Info Chip & Theme Toggle */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <div
              className={`hidden md:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                isDark
                  ? 'text-slate-400 bg-slate-800/80 border-slate-700/60'
                  : 'text-slate-600 bg-slate-100 border-slate-200'
              }`}
            >
              <ShieldCheck
                className={`w-4 h-4 ${
                  isDark ? 'text-emerald-400' : 'text-emerald-600'
                }`}
              />
              <span>Pakistani job scam detector</span>
            </div>

            {/* Theme Toggle Button */}
            <button
              id="theme-toggle-btn"
              type="button"
              onClick={toggleTheme}
              className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700 hover:border-slate-600 shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 hover:border-slate-400 shadow-sm'
              }`}
              title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
              aria-label={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
            >
              {isDark ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline text-slate-200 text-xs">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-slate-700" />
                  <span className="hidden sm:inline text-slate-700 text-xs">Dark</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
