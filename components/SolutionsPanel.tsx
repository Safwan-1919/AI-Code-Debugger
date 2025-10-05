import React, { useState } from 'react';
import type { AlternativeSolutions } from '../types';
import { CheckIcon, CopyIcon } from './icons';

interface SolutionsPanelProps {
    solutionsData: AlternativeSolutions;
}

const InfoCard: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
    <div className={`bg-white/60 dark:bg-indigo-900/20 p-4 rounded-xl shadow-sm ${className}`}>
        <h4 className="font-semibold mb-2 text-indigo-600 dark:text-indigo-300 text-sm">{title}</h4>
        {children}
    </div>
);

const CopyButton: React.FC<{ code: string }> = ({ code }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button onClick={handleCopy} className="absolute top-3 right-3 p-1.5 bg-slate-200/50 dark:bg-indigo-900/50 rounded-md hover:bg-slate-300 dark:hover:bg-indigo-900/80 transition">
            {copied ? <CheckIcon className="w-4 h-4 text-emerald-500" /> : <CopyIcon className="w-4 h-4 text-slate-500" />}
        </button>
    );
};

const SolutionsPanel: React.FC<SolutionsPanelProps> = ({ solutionsData }) => {
    const { solutions } = solutionsData;
    return (
        <div className="space-y-4 text-sm">
            <InfoCard title="Solution Comparison">
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono p-2 bg-slate-100 dark:bg-indigo-900/20 rounded-lg">
                    <div className="font-bold text-left">Approach</div>
                    <div className="font-bold">Time</div>
                    <div className="font-bold">Space</div>
                    {solutions.map((s, i) => (
                        <React.Fragment key={`s-${i}`}>
                            <div className="p-2 rounded bg-white dark:bg-indigo-900/40 text-left font-sans font-medium text-xs">{s.title}</div>
                            <div className="p-2 rounded bg-white dark:bg-indigo-900/40 flex items-center justify-center">{s.complexity.time}</div>
                            <div className="p-2 rounded bg-white dark:bg-indigo-900/40 flex items-center justify-center">{s.complexity.space}</div>
                        </React.Fragment>
                    ))}
                </div>
            </InfoCard>
            {solutions.map((s, i) => (
                <InfoCard key={`sol-${i}`} title={s.title} className="relative">
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">{s.explanation}</p>
                    <pre className="text-xs bg-slate-200/50 dark:bg-indigo-900/40 p-3 pr-10 rounded-md custom-scrollbar overflow-x-auto"><code>{s.code}</code></pre>
                    <CopyButton code={s.code} />
                </InfoCard>
            ))}
        </div>
    );
};

export default SolutionsPanel;
