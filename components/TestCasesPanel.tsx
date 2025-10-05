import React, { useState } from 'react';
import type { TestCase, TestCases } from '../types';
import { PlayIcon, SmallLoadingSpinner } from './icons';

interface TestCasesPanelProps {
    cases: TestCases;
}

const InfoCard: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
    <div className={`bg-white/60 dark:bg-indigo-900/20 p-4 rounded-xl shadow-sm ${className}`}>
        <h4 className="font-semibold mb-2 text-indigo-600 dark:text-indigo-300 text-sm">{title}</h4>
        {children}
    </div>
);

const TestRow: React.FC<{ testCase: TestCase }> = ({ testCase }) => {
    const [result, setResult] = useState<{ status: 'running' | 'passed' | 'failed' } | null>(null);

    const runTest = () => {
        setResult({ status: 'running' });
        setTimeout(() => {
            setResult({ status: Math.random() > 0.4 ? 'passed' : 'failed' });
        }, 1000);
    };

    return (
        <div className="text-xs flex items-center justify-between py-2.5 border-b border-slate-300/70 dark:border-indigo-800/50 last:border-b-0">
            <div className="flex-grow">
                <p className="font-mono font-medium text-slate-800 dark:text-slate-200">{testCase.input} ➜ {testCase.expectedOutput}</p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">{testCase.description}</p>
            </div>
            <div className="flex items-center gap-3 w-32 justify-end">
                {result && result.status !== 'running' && (
                    <span className={`font-bold text-xs px-2 py-1 rounded-full ${result.status === 'passed' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400'}`}>
                        {result.status.charAt(0).toUpperCase() + result.status.slice(1)}
                    </span>
                )}
                <button onClick={runTest} disabled={result?.status === 'running'} className="px-2 py-1 rounded bg-slate-200 dark:bg-indigo-900/40 hover:bg-slate-300 dark:hover:bg-indigo-900/70 flex items-center gap-1.5 disabled:opacity-50 font-medium">
                    {result?.status === 'running' ? <SmallLoadingSpinner className="w-4 h-4 text-slate-500" /> : <PlayIcon className="w-3 h-3" />}
                    Run
                </button>
            </div>
        </div>
    );
};


const TestCasesPanel: React.FC<TestCasesPanelProps> = ({ cases }) => {
    return (
        <div className="space-y-4 text-sm">
            <InfoCard title="Generated Test Cases">
                {cases.generated.map((c, i) => <TestRow key={`g-${i}`} testCase={c} />)}
            </InfoCard>
            <InfoCard title="Edge Cases to Consider">
                {cases.edgeCases.map((c, i) => <TestRow key={`e-${i}`} testCase={c} />)}
            </InfoCard>
        </div>
    );
};

export default TestCasesPanel;
