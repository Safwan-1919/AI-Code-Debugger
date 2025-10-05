// --- GENERIC TYPES ---
export interface ProgrammingLanguage {
  id: string;
  name: string;
}

export interface AiModel {
  id: string;
  name: string;
}

// --- CODE REVIEW TYPES ---
export interface CodeError {
  filePath?: string;
  lineNumber: number;
  errorDescription: string;
  suggestedFix: string;
  fixExplanation: string;
  isFixed?: boolean;
}

export interface CodeSuggestion {
  filePath?: string;
  lineNumber: number;
  suggestion: string;
  explanation: string;
  isApplied?: boolean;
}

export interface Review {
  overallExplanation: string;
  errors: CodeError[];
  suggestions: CodeSuggestion[];
}

// --- DEBUGGER TRACE TYPES ---
export interface DebuggerVariable {
  name: string;
  /** JSON string representation of the variable's value (e.g., '4', '"hello"', '[1, 2]'). */
  value: string;
}

export interface DebuggerState {
  execution: string;
  variables: DebuggerVariable[];
  callStack: string[];
}

export interface DebuggerStep {
  filePath: string;
  lineNumber: number;
  state: DebuggerState;
}

export interface DebuggerTrace {
  steps: DebuggerStep[];
}

// --- PERFORMANCE PROFILE TYPES ---
export interface Bottleneck {
  filePath?: string;
  lineNumber: number;
  functionName: string;
  calls: number;
  reason: string;
}

export interface Optimization {
  title: string;
  description: string;
}

export interface PerformanceProfile {
  summary: string;
  bottlenecks: Bottleneck[];
  optimizations: Optimization[];
}

// --- TEST CASE TYPES ---
export interface TestCase {
  input: string;
  expectedOutput: string;
  description: string;
}

export interface TestCases {
  generated: TestCase[];
  edgeCases: TestCase[];
}

// --- ALTERNATIVE SOLUTION TYPES ---
export interface Complexity {
  time: string;
  space: string;
}

export interface Solution {
  title: string;
  complexity: Complexity;
  explanation: string;
  code: string;
}

export interface AlternativeSolutions {
  solutions: Solution[];
}

// --- TOP-LEVEL ANALYSIS RESULT ---
export interface AnalysisResult {
  review: Review;
  debuggerTrace: DebuggerTrace;
  performanceProfile: PerformanceProfile;
  testCases: TestCases;
  alternativeSolutions: AlternativeSolutions;
}

export type TabName = 'Review' | 'Debugger' | 'Performance' | 'TestCases' | 'Solutions';