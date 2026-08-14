import React, { useState, useRef } from 'react';
import { 
  Search, 
  Trash2, 
  Clipboard, 
  AlertCircle, 
  Loader2, 
  ShieldAlert, 
  FileText
} from 'lucide-react';
import { Header } from './components/Header';
import { AnalysisResults } from './components/AnalysisResults';
import { SAMPLE_POSTS } from './data/samples';
import { AnalysisResult, SamplePost } from './types';
import { ThemeProvider, useTheme } from './context/ThemeContext';

function JhootDetectorApp() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [jobText, setJobText] = useState('');
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleSelectSample = (sample: SamplePost) => {
    setJobText(sample.text);
    setSelectedSampleId(sample.id);
    setError(null);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setJobText(text);
        setSelectedSampleId(null);
        setError(null);
      }
    } catch {
      // Fallback if clipboard API is restricted in iframe
      textareaRef.current?.focus();
    }
  };

  const handleClear = () => {
    setJobText('');
    setSelectedSampleId(null);
    setError(null);
    setResult(null);
    textareaRef.current?.focus();
  };

  const handleAnalyze = async () => {
    if (!jobText || jobText.trim().length === 0) {
      setError('Please paste a job posting or select one of the sample posts below.');
      textareaRef.current?.focus();
      return;
    }

    if (jobText.trim().length < 15) {
      setError('The job post text is too short. Please paste the full job posting description.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: jobText }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${response.status}`);
      }

      const data: AnalysisResult = await response.json();
      setResult(data);

      // Smooth scroll to results
      setTimeout(() => {
        const resultsEl = document.getElementById('analysis-results');
        if (resultsEl) {
          resultsEl.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (err: any) {
      console.error('Analysis failed:', err);
      setError(err.message || 'Could not analyze the job posting. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleAnalyze();
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-200 selection:bg-emerald-500/30 selection:text-emerald-300 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* 1. Header */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:px-6">
        
        {/* Intro banner */}
        <div className="mb-6 text-center sm:text-left">
          <h2
            className={`text-xl sm:text-2xl font-bold tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            Job Posting Authenticity Scanner
          </h2>
          <p
            className={`text-sm mt-1 max-w-2xl ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            Detect fake Pakistani job offers, upfront Easypaisa registration fees, unverified Gmail recruiters, and identity theft traps before you apply.
          </p>
        </div>

        {/* 2. Job Post Input Card */}
        <div
          className={`rounded-2xl p-4 sm:p-6 shadow-xl border transition-colors duration-200 relative ${
            isDark
              ? 'bg-slate-900 border-slate-800'
              : 'bg-white border-slate-200'
          }`}
        >
          {/* Card Top Bar */}
          <div
            className={`flex items-center justify-between pb-3 border-b mb-3 text-xs ${
              isDark
                ? 'border-slate-800 text-slate-400'
                : 'border-slate-200 text-slate-600'
            }`}
          >
            <span
              className={`font-semibold flex items-center gap-1.5 ${
                isDark ? 'text-slate-300' : 'text-slate-800'
              }`}
            >
              <FileText
                className={`w-4 h-4 ${
                  isDark ? 'text-emerald-400' : 'text-emerald-600'
                }`}
              />
              Job Post Text
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePaste}
                className={`flex items-center gap-1 transition px-2.5 py-1 rounded text-xs font-medium ${
                  isDark
                    ? 'hover:text-emerald-400 text-slate-400 hover:bg-slate-800'
                    : 'hover:text-emerald-700 text-slate-600 hover:bg-slate-100'
                }`}
                title="Paste from clipboard"
              >
                <Clipboard className="w-3.5 h-3.5" />
                <span>Paste</span>
              </button>
              {jobText && (
                <button
                  type="button"
                  onClick={handleClear}
                  className={`flex items-center gap-1 transition px-2.5 py-1 rounded text-xs font-medium ${
                    isDark
                      ? 'hover:text-rose-400 text-slate-400 hover:bg-slate-800'
                      : 'hover:text-rose-600 text-slate-600 hover:bg-slate-100'
                  }`}
                  title="Clear text"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* Textarea */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              id="job-text-input"
              rows={8}
              value={jobText}
              onChange={(e) => {
                setJobText(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Paste the job posting here... (e.g. from WhatsApp, Facebook Groups, Rozee.pk, OLX, LinkedIn, SMS)"
              className={`w-full rounded-xl p-4 text-sm sm:text-base font-mono leading-relaxed transition resize-y focus:outline-none focus:ring-2 ${
                isDark
                  ? 'bg-slate-950/70 border border-slate-700/70 text-slate-100 placeholder-slate-500 focus:border-emerald-500/80 focus:ring-emerald-500/20'
                  : 'bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-emerald-500/30'
              }`}
            />
          </div>

          {/* Character and Keyboard shortcut hint */}
          <div
            className={`flex items-center justify-between mt-2 text-xs ${
              isDark ? 'text-slate-500' : 'text-slate-500'
            }`}
          >
            <span>
              {jobText.trim().length > 0
                ? `${jobText.trim().split(/\s+/).length} words · ${jobText.length} characters`
                : '0 words'}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1">
              Press{' '}
              <kbd
                className={`px-1.5 py-0.5 rounded font-mono text-[10px] border ${
                  isDark
                    ? 'bg-slate-800 text-slate-300 border-slate-700'
                    : 'bg-slate-200 text-slate-700 border-slate-300'
                }`}
              >
                Ctrl + Enter
              </kbd>{' '}
              to analyze
            </span>
          </div>

          {/* 3. Three Clickable Example Buttons */}
          <div
            className={`mt-5 pt-4 border-t ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-2.5">
              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                Or test with sample posts:
              </span>
              <span
                className={`text-[11px] ${
                  isDark ? 'text-slate-500' : 'text-slate-500'
                }`}
              >
                (Click to instant-fill)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {SAMPLE_POSTS.map((sample) => {
                const isSelected = selectedSampleId === sample.id;

                const badgeColor = isDark
                  ? sample.riskHint === 'HIGH'
                    ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                    : sample.riskHint === 'MEDIUM'
                    ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                    : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                  : sample.riskHint === 'HIGH'
                  ? 'text-rose-800 bg-rose-100 border-rose-300 font-bold'
                  : sample.riskHint === 'MEDIUM'
                  ? 'text-amber-900 bg-amber-100 border-amber-300 font-bold'
                  : 'text-emerald-800 bg-emerald-100 border-emerald-300 font-bold';

                return (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => handleSelectSample(sample)}
                    className={`text-left p-3 rounded-xl border transition flex flex-col justify-between ${
                      isSelected
                        ? isDark
                          ? 'bg-slate-800 border-emerald-500/60 ring-1 ring-emerald-500/40 shadow-md'
                          : 'bg-emerald-50/80 border-emerald-600 ring-1 ring-emerald-600/40 shadow-sm'
                        : isDark
                        ? 'bg-slate-950/50 hover:bg-slate-800/70 border-slate-800 hover:border-slate-700'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5 mb-1.5">
                      <span
                        className={`text-xs font-bold truncate ${
                          isDark ? 'text-slate-200' : 'text-slate-900'
                        }`}
                      >
                        {sample.title}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${badgeColor}`}
                      >
                        {sample.riskHint}
                      </span>
                    </div>
                    <p
                      className={`text-[11px] line-clamp-2 leading-tight ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}
                    >
                      {sample.tag}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div
              className={`mt-4 p-3.5 rounded-xl border text-xs sm:text-sm flex items-start gap-2.5 ${
                isDark
                  ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}
            >
              <AlertCircle
                className={`w-4 h-4 shrink-0 mt-0.5 ${
                  isDark ? 'text-rose-400' : 'text-rose-600'
                }`}
              />
              <span>{error}</span>
            </div>
          )}

          {/* 4. Action Button */}
          <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
            <button
              id="analyze-button"
              type="button"
              disabled={isLoading || !jobText.trim()}
              onClick={handleAnalyze}
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 transition duration-150"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Scanning for Jhooṭ & Red Flags...</span>
                </>
              ) : (
                <>
                  <Search className="w-5 h-5 stroke-[2.5]" />
                  <span>Analyze Job Post</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* 5. Results Section */}
        {result && (
          <div ref={resultsRef}>
            <AnalysisResults result={result} onReset={handleClear} />
          </div>
        )}

        {/* Informative Guidance Card for Job Seekers */}
        <div
          className={`mt-10 p-5 rounded-2xl border transition-colors ${
            isDark
              ? 'bg-slate-900/60 border-slate-800/80 text-slate-400'
              : 'bg-white border-slate-200 shadow-sm text-slate-600'
          }`}
        >
          <h3
            className={`font-bold text-sm mb-3 flex items-center gap-2 ${
              isDark ? 'text-slate-200' : 'text-slate-900'
            }`}
          >
            <ShieldAlert
              className={`w-4 h-4 ${
                isDark ? 'text-emerald-400' : 'text-emerald-600'
              }`}
            />
            Common Pakistani Job Scam Red Flags to Avoid:
          </h3>
          <ul
            className={`grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-sm ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}
          >
            <li className="flex items-start gap-2">
              <span className={isDark ? 'text-rose-400 font-bold' : 'text-rose-600 font-bold'}>
                ✕
              </span>
              <span>
                <strong className={isDark ? 'text-slate-200' : 'text-slate-900'}>
                  Registration / Training Fee:
                </strong>{' '}
                Demanding PKR 1,500–5,000 via Easypaisa/JazzCash before test/interview.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className={isDark ? 'text-rose-400 font-bold' : 'text-rose-600 font-bold'}>
                ✕
              </span>
              <span>
                <strong className={isDark ? 'text-slate-200' : 'text-slate-900'}>
                  Immediate CNIC & Photo Demand:
                </strong>{' '}
                Collecting national identity cards before any formal interview.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className={isDark ? 'text-rose-400 font-bold' : 'text-rose-600 font-bold'}>
                ✕
              </span>
              <span>
                <strong className={isDark ? 'text-slate-200' : 'text-slate-900'}>
                  Unrealistic 80k-150k for Data Entry:
                </strong>{' '}
                Promising executive salaries for basic smartphone typing.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className={isDark ? 'text-rose-400 font-bold' : 'text-rose-600 font-bold'}>
                ✕
              </span>
              <span>
                <strong className={isDark ? 'text-slate-200' : 'text-slate-900'}>
                  Generic Gmail Recruiters:
                </strong>{' '}
                Claiming to represent multinational firms using @gmail.com or @outlook.com.
              </span>
            </li>
          </ul>
        </div>

      </main>

      {/* Footer */}
      <footer
        className={`border-t py-5 px-4 text-center text-xs sm:text-sm transition-colors ${
          isDark
            ? 'border-slate-900 bg-slate-950 text-slate-400'
            : 'border-slate-200 bg-slate-100 text-slate-600'
        }`}
      >
        <p className="max-w-2xl mx-auto leading-relaxed">
          Made with <span className="text-rose-500" aria-label="love">❤️</span> by{' '}
          <a
            href="https://www.linkedin.com/in/abdulhayykhan/"
            target="_blank"
            rel="noopener noreferrer"
            className={`font-semibold underline underline-offset-2 transition-colors ${
              isDark
                ? 'text-emerald-400 hover:text-emerald-300'
                : 'text-emerald-700 hover:text-emerald-800'
            }`}
          >
            Abdul Hayy Khan
          </a>{' '}
          for Chai aur Code by GDG Live Pakistan
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <JhootDetectorApp />
    </ThemeProvider>
  );
}
