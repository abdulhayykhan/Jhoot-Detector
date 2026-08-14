export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface RedFlag {
  issue: string;
  detail: string;
  explanation: string;
}

export interface AnalysisResult {
  risk_level: RiskLevel;
  summary: string;
  flags: RedFlag[];
  legitimate_signals: string[];
}

export interface SamplePost {
  id: string;
  title: string;
  tag: string;
  riskHint: RiskLevel;
  text: string;
}
