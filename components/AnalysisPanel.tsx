import React, { useEffect, useState } from 'react';
import type { AnalysisResult, TabName } from '../types';
import { 
    LoadingSpinner, ExclamationCircleIcon, BrainCircuitIcon, TabIcons
} from './icons';
import ReviewPanel from './ReviewPanel';
import DebuggerPanel from './DebuggerPanel';
import PerformancePanel from './PerformancePanel';
import TestCasesPanel from './TestCasesPanel';
import SolutionsPanel from './SolutionsPanel';

interface AnalysisPanelProps {
  analysisResult: AnalysisResult | null;
  analysisTitle: string | null;
  isLoading: boolean;
  error: string | null;
  onApplySuggestion: (lineNumber: number, suggestion: string, filePath?: string) => void;
  onApplyFix: (lineNumber: number, suggestedFix: string, filePath?: string) => void;
  onHighlightLine: (lineData: { lineNumber: number; filePath: string; } | null) => void;
  activeTab: TabName;
  setActiveTab: (tab: TabName) => void;
  debuggerStep: number;
  setDebuggerStep: (step: number | ((prev: number) => number)) => void;
}

const loadingMessages = [
    "Analyzing structure...",
    "Thinking...",
    "Reviewing for errors...",
    "Building debugger trace...",
    "Profiling performance...",
    "Generating test cases...",
    "Crafting solutions...",
];

const messageDurations = [1500, 2000, 2500, 3000, 2500, 2500]; // Durations for first 6 messages.

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ 
    analysisResult, analysisTitle, isLoading, error, 
    onApplySuggestion, onApplyFix, onHighlightLine,
    activeTab, setActiveTab, debuggerStep, setDebuggerStep 
}) => {
    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

    useEffect(() => {
        // When switching away from the debugger, clear any line highlights.
        if (activeTab !== 'Debugger') {
            onHighlightLine(null);
        }
    }, [activeTab, onHighlightLine]);

    useEffect(() => {
        let timeouts: ReturnType<typeof setTimeout>[] = [];
        if (isLoading) {
            setLoadingMessageIndex(0); // Reset on new analysis

            const scheduleNextMessage = (index: number) => {
                if (index < loadingMessages.length) {
                    setLoadingMessageIndex(index);
                    
                    // Don't schedule a timeout for the last message, it should persist.
                    if (index < loadingMessages.length - 1) {
                        const timeoutId = setTimeout(() => {
                            scheduleNextMessage(index + 1);
                        }, messageDurations[index]);
                        timeouts.push(timeoutId);
                    }
                }
            };
            
            scheduleNextMessage(0);
        }
        return () => {
            timeouts.forEach(clearTimeout);
        };
    }, [isLoading]);


    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <LoadingSpinner className="w-8 h-8 text-indigo-500" />
                    <p className="mt-4 text-lg font-medium text-slate-700 dark:text-slate-300 min-h-[1.75rem]">
                         <span key={loadingMessageIndex} className="inline-block animate-fade-in">
                            {loadingMessages[loadingMessageIndex]}
                        </span>
                    </p>
                    {analysisTitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{analysisTitle}</p>}
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                     <div className="w-12 h-12 bg-rose-500/10 rounded-full flex items-center justify-center mb-4">
                        <ExclamationCircleIcon className="w-8 h-8" />
                    </div>
                    <p className="mt-2 text-lg font-semibold text-rose-500">An Error Occurred</p>
                    <p className="text-sm text-rose-500/80">{error}</p>
                </div>
            );
        }

        if (!analysisResult) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                     <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center mb-4">
                        <BrainCircuitIcon className="w-8 h-8" />
                    </div>
                    <p className="mt-2 text-lg font-medium text-slate-600 dark:text-slate-400">AI Analysis Panel</p>
                    <p className="text-sm">Your code's analysis will appear here.</p>
                </div>
            );
        }

        const TABS: { name: TabName; data: any }[] = [
            { name: 'Review', data: analysisResult.review },
            { name: 'Debugger', data: analysisResult.debuggerTrace },
            { name: 'Performance', data: analysisResult.performanceProfile },
            { name: 'TestCases', data: analysisResult.testCases },
            { name: 'Solutions', data: analysisResult.alternativeSolutions },
        ];

        const panelMap: Record<TabName, React.ReactNode> = {
            'Review': <ReviewPanel review={analysisResult.review} onApplySuggestion={onApplySuggestion} onApplyFix={onApplyFix} />,
            'Debugger': <DebuggerPanel trace={analysisResult.debuggerTrace} onHighlightLine={onHighlightLine} debuggerStep={debuggerStep} setDebuggerStep={setDebuggerStep} />,
            'Performance': <PerformancePanel profile={analysisResult.performanceProfile} />,
            'TestCases': <TestCasesPanel cases={analysisResult.testCases} />,
            'Solutions': <SolutionsPanel solutionsData={analysisResult.alternativeSolutions} />,
        };

        return (
            <div className="flex flex-col h-full">
                 <div className="flex-shrink-0 border-b border-slate-300/70 dark:border-indigo-800/50 mb-4">
                     {analysisTitle && <h3 className="px-1 pt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">{analysisTitle}</h3>}
                    <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Tabs">
                        {TABS.map(tab => {
                            const Icon = TabIcons[tab.name];
                            const isDisabled = !tab.data || (tab.name === 'Debugger' && tab.data.steps.length === 0);
                            const isActive = activeTab === tab.name;
                            const buttonClass = `flex items-center whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-all ${
                                isDisabled 
                                ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed' 
                                : isActive 
                                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' 
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-400 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-500'
                            }`;
                            const tabDisplayName = tab.name === 'TestCases' ? 'Test Cases' : tab.name;
                            return (
                                <button key={tab.name} onClick={() => !isDisabled && setActiveTab(tab.name)} className={buttonClass} disabled={isDisabled}>
                                    <Icon className={`w-5 h-5 mr-2 ${isActive ? 'text-indigo-500' : 'text-slate-400'}`} />
                                    {tabDisplayName}
                                </button>
                            );
                        })}
                    </nav>
                </div>
                <div className="flex-grow overflow-y-auto custom-scrollbar -mr-4 pr-4 pb-4">
                    {panelMap[activeTab]}
                </div>
            </div>
        );
    };

    return (
        <div className="glass-panel rounded-xl h-full p-4 shadow-lg overflow-hidden">
            {renderContent()}
        </div>
    );
};

export default AnalysisPanel;