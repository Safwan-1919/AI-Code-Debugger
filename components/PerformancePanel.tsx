import React from 'react';
import type { PerformanceProfile } from '../types';

interface PerformancePanelProps {
    profile: PerformanceProfile;
}

const InfoCard: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
    <div className={`bg-white/60 dark:bg-indigo-900/20 p-4 rounded-xl shadow-sm ${className}`}>
        <h4 className="font-semibold mb-2 text-indigo-600 dark:text-indigo-300 text-sm">{title}</h4>
        {children}
    </div>
);

const PerformancePanel: React.FC<PerformancePanelProps> = ({ profile }) => {
    return (
        <div className="space-y-4 text-sm">
            <InfoCard title="Performance Summary">
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">{profile.summary}</p>
            </InfoCard>
            <InfoCard title="Bottlenecks">
                {profile.bottlenecks.map((item, i) => (
                    <div key={i} className="text-xs border-b border-slate-300/70 dark:border-indigo-800/50 py-2 last:border-b-0">
                        <p className="font-mono font-semibold">L{item.lineNumber}{item.filePath && <span className="ml-1 font-sans" title={item.filePath}> in {item.filePath}</span>}: {item.functionName} ({item.calls} calls)</p>
                        <p className="text-slate-500 mt-1">{item.reason}</p>
                    </div>
                ))}
            </InfoCard>
            <InfoCard title="Optimization Hints">
                {profile.optimizations.map((opt, i) => (
                    <div key={i} className="text-xs py-2 border-b border-slate-300/70 dark:border-indigo-800/50 last:border-b-0">
                        <p className="font-semibold text-indigo-700 dark:text-indigo-300">{opt.title}</p>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">{opt.description}</p>
                    </div>
                ))}
            </InfoCard>
        </div>
    );
};

export default PerformancePanel;
