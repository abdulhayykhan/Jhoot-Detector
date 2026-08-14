import React, { useState } from 'react';
import { 
  AlertCircle, 
  CheckCircle2, 
  Copy, 
  Check, 
  Quote, 
  ShieldAlert, 
  ShieldCheck, 
  Info
} from 'lucide-react';
import { AnalysisResult } from '../types';
import { RiskBadge } from './RiskBadge';
import { useTheme } from '../context/ThemeContext';

interface AnalysisResultsProps {
  result: AnalysisResult;
  onReset: () => void;
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({ result, onReset }) => {
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const handleCopy = () => {
    const flagsText = result.flags.length > 0
      ? result.flags.map((f, i) => `${i + 1}. [${f.issue}] "${f.detail}" -> ${f.explanation}`).join('\n')
      : 'No significant red flags detected.';

    const legText = result.legitimate_signals && result.legitimate_signals.length > 0
      ? `\n\nLegitimate Signals:\n` + result.legitimate_signals.map(s => `- ${s}`).join('\n')
      : '';

    const textToCopy = `🕵️ Jhoot Detector Scam Analysis Report
━━━━━━━━━━━━━━━━━━━━
Risk Verdict: ${result.risk_level} RISK
Summary: ${result.summary}

Red Flags Found (${result.flags.length}):
${flagsText}${legText}

Analyzed via Jhoot Detector - Pakistani Job Scam Post Analyzer`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getContainerStyles = () => {
    if (isDark) {
      switch (result.risk_level) {
        case 'HIGH':
          return 'bg-slate-900 border-rose-900/50 shadow-rose-950/20 text-slate-100';
        case 'MEDIUM':
          return 'bg-slate-900 border-amber-900/50 shadow-amber-950/20 text-slate-100';
        case 'LOW':
        default:
          return 'bg-slate-900 border-emerald-900/50 shadow-emerald-950/20 text-slate-100';
      }
    } else {
      switch (result.risk_level) {
        case 'HIGH':
          return 'bg-white border-rose-300 shadow-xl shadow-rose-900/5 text-slate-900';
        case 'MEDIUM':
          return 'bg-white border-amber-300 shadow-xl shadow-amber-900/5 text-slate-900';
        case 'LOW':
        default:
          return 'bg-white border-emerald-300 shadow-xl shadow-emerald-900/5 text-slate-900';
      }
    }
  };

  return (
    <section id="analysis-results" className="mt-8 scroll-mt-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className={`rounded-2xl border p-6 sm:p-8 shadow-xl transition-colors duration-200 ${getContainerStyles()}`}>
        
        {/* Top Verdict Bar */}
        <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <RiskBadge level={result.risk_level} />

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border transition ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
              }`}
              title="Copy analysis summary to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Report</span>
                </>
              )}
            </button>
            <button
              onClick={onReset}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition ${
                isDark
                  ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
            >
              Analyze Another
            </button>
          </div>
        </div>

        {/* Verdict Summary */}
        <div className="py-5">
          <h3 className={`text-xs font-bold uppercase tracking-wider mb-1.5 ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            Verdict Summary
          </h3>
          <p className={`text-lg sm:text-xl font-medium leading-snug ${
            isDark ? 'text-slate-100' : 'text-slate-900'
          }`}>
            {result.summary}
          </p>
        </div>

        {/* Red Flags Section */}
        {result.flags.length > 0 && (
          <div className={`mt-4 pt-4 border-t ${
            isDark ? 'border-slate-800/80' : 'border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className={`w-5 h-5 ${
                  result.risk_level === 'HIGH' 
                    ? (isDark ? 'text-rose-400' : 'text-rose-600') 
                    : (isDark ? 'text-amber-400' : 'text-amber-600')
                }`} />
                <h4 className={`text-base font-bold ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  Identified Red Flags ({result.flags.length})
                </h4>
              </div>
              <span className={`text-xs ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                Suspicious patterns detected
              </span>
            </div>

            <div className="space-y-3">
              {result.flags.map((flag, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-xl border transition-colors ${
                    isDark
                      ? (result.risk_level === 'HIGH'
                          ? 'bg-rose-950/20 border-rose-900/40 text-slate-200'
                          : 'bg-amber-950/20 border-amber-900/40 text-slate-200')
                      : (result.risk_level === 'HIGH'
                          ? 'bg-rose-50/80 border-rose-200 text-slate-900'
                          : 'bg-amber-50/80 border-amber-200 text-slate-900')
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 p-1 rounded-md border shrink-0 ${
                      isDark 
                        ? 'bg-slate-800/80 border-slate-700' 
                        : 'bg-white border-slate-300'
                    }`}>
                      <AlertCircle className={`w-4 h-4 ${
                        result.risk_level === 'HIGH' 
                          ? (isDark ? 'text-rose-400' : 'text-rose-600') 
                          : (isDark ? 'text-amber-400' : 'text-amber-600')
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className={`text-sm font-bold ${
                          isDark ? 'text-slate-100' : 'text-slate-900'
                        }`}>
                          {flag.issue}
                        </span>
                      </div>

                      {flag.detail && (
                        <div className={`mb-2 p-2 rounded-lg border text-xs font-mono flex items-start gap-2 ${
                          isDark 
                            ? 'bg-slate-900/80 border-slate-800 text-slate-300' 
                            : 'bg-white border-slate-300 text-slate-800'
                        }`}>
                          <Quote className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="italic break-words">"{flag.detail}"</span>
                        </div>
                      )}

                      <p className={`text-sm leading-relaxed ${
                        isDark ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        <span className={`font-semibold ${
                          isDark ? 'text-slate-200' : 'text-slate-900'
                        }`}>
                          Why it's suspicious:{' '}
                        </span>
                        {flag.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legitimate Signals Section */}
        {result.legitimate_signals && result.legitimate_signals.length > 0 && (
          <div className={`mt-6 pt-5 border-t ${
            isDark ? 'border-slate-800/80' : 'border-slate-200'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className={`w-5 h-5 ${
                isDark ? 'text-emerald-400' : 'text-emerald-600'
              }`} />
              <h4 className={`text-base font-bold ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                {result.risk_level === 'LOW' ? 'What Made This Look Legitimate' : 'Legitimate / Positive Signals Observed'}
              </h4>
            </div>

            <div className={`p-4 rounded-xl border space-y-2 ${
              isDark 
                ? 'bg-emerald-950/20 border-emerald-900/40' 
                : 'bg-emerald-50/80 border-emerald-200'
            }`}>
              {result.legitimate_signals.map((signal, index) => (
                <div key={index} className={`flex items-start gap-2.5 text-sm ${
                  isDark ? 'text-slate-200' : 'text-slate-800'
                }`}>
                  <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${
                    isDark ? 'text-emerald-400' : 'text-emerald-600'
                  }`} />
                  <span>{signal}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actionable Advice Box for Pakistani Job Seekers */}
        <div className={`mt-6 pt-5 border-t text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl border ${
          isDark 
            ? 'border-slate-800/80 bg-slate-950/40 border-slate-800 text-slate-400' 
            : 'border-slate-200 bg-slate-50 border-slate-200 text-slate-700'
        }`}>
          <div className="flex items-center gap-2">
            <Info className={`w-4 h-4 shrink-0 ${
              isDark ? 'text-emerald-400' : 'text-emerald-600'
            }`} />
            <span>
              <strong>Golden Rule:</strong> Real Pakistani employers never demand fees via Easypaisa/JazzCash or ask for CNIC copies before formal interviews.
            </span>
          </div>
        </div>

      </div>
    </section>
  );
};
