import React from 'react';
import LanguageSelector from './LanguageSelector';
import { SUPPORTED_LANGUAGES } from '../constants';
import { PlayIcon, SmallLoadingSpinner } from './icons';
import { getComplexityAndOutput } from '../services/geminiService';
import type { AnalysisResult, DebuggerTrace } from '../types';
import { getLanguageFromFile } from '../utils';

interface CodeEditorProps {
  fileContent: string;
  onFileContentChange: (content: string) => void;
  fileName: string | null;
  language: string;
  onLanguageChange: (language: string) => void;
  model: string;
  onRunStart: () => void;
  onAnalyzeFile: () => void;
  highlightedLine: { lineNumber: number; filePath: string } | null;
  analysisResult: AnalysisResult | null;
  isDisabled: boolean;
  isDebuggerActive: boolean;
  debuggerTrace: DebuggerTrace | null | undefined;
  debuggerStep: number;
}

interface RunResult {
    output: string | null;
    timeComplexity: string | null;
    spaceComplexity: string | null;
    error: string | null;
    running: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ 
    fileContent, onFileContentChange, fileName, language, onLanguageChange, 
    model, onRunStart, onAnalyzeFile, highlightedLine, analysisResult, isDisabled,
    isDebuggerActive, debuggerTrace, debuggerStep
}) => {
  const codeLines = fileContent.split('\n');
  const [runResult, setRunResult] = React.useState<RunResult | null>(null);

  const fileErrors = analysisResult?.review?.errors.filter(e => !e.isFixed && e.filePath === fileName) ?? [];
  const currentDebugStep = isDebuggerActive && debuggerTrace?.steps?.[debuggerStep];

  const handleRunClick = async () => {
    const detectedLang = getLanguageFromFile(fileName);
    const selectedLangName = SUPPORTED_LANGUAGES.find(l => l.id === language)?.name;
    const detectedLangName = SUPPORTED_LANGUAGES.find(l => l.id === detectedLang)?.name || detectedLang;

    if (language !== 'all' && detectedLang && detectedLang !== language) {
        setRunResult({ running: false, output: null, timeComplexity: null, spaceComplexity: null, error: `Language Mismatch: Selected language is '${selectedLangName}', but this appears to be a '${detectedLangName}' file. Please switch the language or select 'All Languages'.` });
        return;
    }

    onRunStart();
    setRunResult({ running: true, output: null, timeComplexity: null, spaceComplexity: null, error: null });
    try {
        const result = await getComplexityAndOutput(fileContent, language, model);
        setRunResult({ ...result, running: false, error: null });
    } catch (e: any) {
        setRunResult({ running: false, output: null, timeComplexity: null, spaceComplexity: null, error: e.message || "Failed to run." });
    }
  };

  return (
    <div className="glass-panel rounded-xl h-full flex flex-col shadow-lg">
      <div className="flex items-center justify-between p-4 border-b border-slate-300/70 dark:border-indigo-800/50">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate" title={fileName || 'No file selected'}>
            {fileName || 'No file selected'}
          </p>
        </div>
        <div className="flex items-center ml-4 space-x-2">
            <div className="w-40">
                <LanguageSelector
                    languages={SUPPORTED_LANGUAGES}
                    selectedLanguage={language}
                    onLanguageChange={onLanguageChange}
                />
            </div>
          <button 
            onClick={onAnalyzeFile}
            disabled={isDisabled || runResult?.running}
            className="flex items-center gap-2 px-3 py-2.5 bg-indigo-500/80 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-500 transition disabled:opacity-60 text-sm"
            title="Analyze current file"
          >
            Analyze File
          </button>
          <button 
            onClick={handleRunClick}
            disabled={isDisabled || runResult?.running}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-500 transition disabled:opacity-60"
          >
            {runResult?.running ? <SmallLoadingSpinner className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
            Run
          </button>
        </div>
      </div>
      <div className="relative flex-grow font-mono text-sm group">
        {!isDisabled ? (
            <div className="absolute inset-0 overflow-auto custom-scrollbar">
              <div className="relative">
                <div className="p-4 pointer-events-none">
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {codeLines.map((line, index) => {
                        const lineNumber = index + 1;
                        const isHighlightedGreen = highlightedLine?.filePath === fileName && highlightedLine?.lineNumber === lineNumber;
                        const isHighlightedRed = fileErrors.some(e => e.lineNumber === lineNumber);

                        let highlightClass = '';
                        if (isHighlightedGreen) {
                            highlightClass = 'code-highlight-green';
                        } else if (isHighlightedRed) {
                            highlightClass = 'code-highlight-red';
                        }
                        
                        const showVars = currentDebugStep && currentDebugStep.filePath === fileName && currentDebugStep.lineNumber === lineNumber && currentDebugStep.state.variables.length > 0;

                        return (
                          <div key={index} className={`flex items-start group relative ${highlightClass}`}>
                            <span className="text-right pr-4 text-slate-500 dark:text-slate-600 group-hover:text-slate-400 dark:group-hover:text-slate-400 select-none flex-shrink-0 w-12 transition-colors">{lineNumber}</span>
                            <div className="flex-grow flex justify-between items-baseline pr-4">
                                <code className="text-slate-800 dark:text-slate-300">{line || ' '}</code>
                                {showVars && (
                                  <div className="text-xs text-sky-600 dark:text-sky-400 font-mono bg-sky-100/50 dark:bg-sky-900/30 px-2 rounded animate-fade-in whitespace-nowrap">
                                    <span className="opacity-70">// </span> {currentDebugStep.state.variables.map(v => `${v.name}: ${v.value}`).join(', ')}
                                  </div>
                                )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                </div>
                <textarea
                    value={fileContent}
                    onChange={(e) => onFileContentChange(e.target.value)}
                    className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-slate-800 dark:caret-slate-200 p-4 pl-20 resize-none leading-relaxed focus:outline-none overflow-hidden"
                    spellCheck="false"
                    style={{font: 'inherit', letterSpacing: 'inherit'}}
                  />
              </div>
            </div>
        ) : (
            <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400">
                Select a file to view its content or upload a folder.
            </div>
        )}
      </div>
      
      {runResult && (
          <div className="flex-shrink-0 border-t border-slate-300/70 dark:border-indigo-800/50">
              <div className="p-4">
                <label htmlFor="output-box" className="text-sm font-semibold text-slate-600 dark:text-indigo-300 mb-2 block">Output</label>
                <div id="output-box" className="font-mono text-xs bg-slate-100 dark:bg-indigo-950/50 p-3 rounded-md whitespace-pre-wrap min-h-[4rem] text-slate-800 dark:text-slate-300">
                    {runResult.running && <div className="flex items-center gap-2 text-slate-500"><SmallLoadingSpinner/><span>Executing...</span></div>}
                    {runResult.error && <span className="text-rose-500">{runResult.error}</span>}
                    {runResult.output}
                </div>
              </div>
              
              {(runResult.timeComplexity || runResult.spaceComplexity) && !runResult.running && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border-t border-slate-300/70 dark:border-indigo-800/50 text-sm">
                    <div>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Time Complexity: </span>
                        <span className="font-mono bg-slate-200/50 dark:bg-indigo-900/40 px-2 py-1 rounded-md text-xs">{runResult.timeComplexity}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Space Complexity: </span>
                        <span className="font-mono bg-slate-200/50 dark:bg-indigo-900/40 px-2 py-1 rounded-md text-xs">{runResult.spaceComplexity}</span>
                    </div>
                </div>
              )}
          </div>
      )}
    </div>
  );
};