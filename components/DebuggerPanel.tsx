import React, { useEffect } from 'react';
import type { DebuggerTrace } from '../types';
import { ArrowLeftIcon, ArrowRightIcon } from './icons';

interface DebuggerPanelProps {
    trace: DebuggerTrace;
    onHighlightLine: (lineData: { lineNumber: number; filePath: string; } | null) => void;
    debuggerStep: number;
    setDebuggerStep: (step: number | ((prev: number) => number)) => void;
}

const InfoCard: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
    <div className={`bg-white/60 dark:bg-indigo-900/20 p-4 rounded-xl shadow-sm ${className}`}>
        <h4 className="font-semibold mb-2 text-indigo-600 dark:text-indigo-300 text-sm">{title}</h4>
        {children}
    </div>
);

const DebuggerPanel: React.FC<DebuggerPanelProps> = ({ trace, onHighlightLine, debuggerStep, setDebuggerStep }) => {
    const currentStep = trace.steps[debuggerStep];

    useEffect(() => {
        if (currentStep) {
            onHighlightLine({ lineNumber: currentStep.lineNumber, filePath: currentStep.filePath });
        }
        // Cleanup highlight when component unmounts or trace changes
        return () => onHighlightLine(null);
    }, [debuggerStep, currentStep, onHighlightLine]);

    const nextStep = () => setDebuggerStep(prev => Math.min(prev + 1, trace.steps.length - 1));
    const prevStep = () => setDebuggerStep(prev => Math.max(prev - 1, 0));

    if (!currentStep) {
        return <p className="text-sm text-slate-500 dark:text-slate-400">No debugger trace available for this code.</p>;
    }

    return (
        <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between bg-white/60 dark:bg-indigo-900/20 p-3 rounded-xl">
                <h3 className="font-semibold text-base text-slate-800 dark:text-slate-200">Visual Debugger</h3>
                <div className="flex items-center gap-2">
                    <button onClick={prevStep} disabled={debuggerStep === 0} className="p-2 rounded-full bg-slate-200/70 dark:bg-indigo-900/40 disabled:opacity-50 hover:bg-slate-300 dark:hover:bg-indigo-900/70 transition"><ArrowLeftIcon /></button>
                    <span className="text-xs font-mono px-2">Step {debuggerStep + 1}/{trace.steps.length}</span>
                    <button onClick={nextStep} disabled={debuggerStep === trace.steps.length - 1} className="p-2 rounded-full bg-slate-200/70 dark:bg-indigo-900/40 disabled:opacity-50 hover:bg-slate-300 dark:hover:bg-indigo-900/70 transition"><ArrowRightIcon /></button>
                </div>
            </div>
            <InfoCard title="Execution">
                <p className="font-mono text-xs">{currentStep.state.execution}</p>
                 <p className="font-mono text-xs mt-2 text-slate-500 dark:text-slate-400">File: {currentStep.filePath}</p>
            </InfoCard>
            <InfoCard title="Variables">
                {currentStep.state.variables.length > 0 ? (
                    <div className="font-mono text-xs space-y-1">
                        {currentStep.state.variables.map((variable) => (
                            <div key={variable.name} className="grid grid-cols-[auto_1fr] gap-x-4 items-start">
                                <span className="font-medium text-slate-800 dark:text-slate-300 whitespace-nowrap">{variable.name}:</span>
                                <span className="text-slate-600 dark:text-slate-400 break-all">{variable.value}</span>
                            </div>
                        ))}
                    </div>
                ) : <p className="text-xs text-slate-500">No variables in scope.</p>}
            </InfoCard>
            <InfoCard title="Call Stack">
                <div className="space-y-1">
                    {currentStep.state.callStack.map((call, index) => (
                        <pre key={index} className="text-xs bg-slate-200/50 dark:bg-indigo-900/40 p-2 rounded">{call}</pre>
                    ))}
                </div>
            </InfoCard>
        </div>
    );
};

export default DebuggerPanel;
