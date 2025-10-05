import React from 'react';
import type { Review } from '../types';
import { ExclamationCircleIcon, LightBulbIcon } from './icons';

interface ReviewPanelProps {
    review: Review;
    onApplySuggestion: (lineNumber: number, suggestion: string, filePath?: string) => void;
    onApplyFix: (lineNumber: number, suggestedFix: string, filePath?: string) => void;
}

const InfoCard: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
    <div className={`bg-white/60 dark:bg-indigo-900/20 p-4 rounded-xl shadow-sm ${className}`}>
        <h4 className="font-semibold mb-2 text-indigo-600 dark:text-indigo-300 text-sm">{title}</h4>
        {children}
    </div>
);

const ReviewPanel: React.FC<ReviewPanelProps> = ({ review, onApplySuggestion, onApplyFix }) => {
    return (
        <div className="space-y-4">
            <InfoCard title="Code Analysis">
                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{review.overallExplanation}</p>
            </InfoCard>

            {review.errors?.length === 0 && review.suggestions?.length === 0 && (
                <InfoCard title="All Clear!">
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">No critical errors or suggestions found. Great work!</p>
                </InfoCard>
            )}

            {review.errors?.map((e, i) => (
                <div key={`e-${i}`} className={`p-4 rounded-lg border-l-4 ${e.isFixed ? 'border-green-500 bg-green-500/10' : 'border-rose-500 bg-rose-500/10'}`}>
                    <div className="flex items-center justify-between mb-2">
                        <p className="font-mono text-xs text-rose-800 dark:text-rose-300 flex items-center">
                            <ExclamationCircleIcon className="w-4 h-4 mr-2"/>
                            <span className="font-sans font-bold mr-2">Error:</span>
                            Line {e.lineNumber}{e.filePath && <span className="ml-1 font-sans font-normal text-slate-500 dark:text-slate-400 truncate" title={e.filePath}> in {e.filePath}</span>}
                        </p>
                        {e.isFixed && <span className="text-green-600 dark:text-green-400 text-xs font-bold px-2 py-0.5 rounded-full bg-green-500/10">FIXED</span>}
                    </div>
                    <h5 className="font-semibold mb-1 text-slate-800 dark:text-slate-200 text-sm">{e.errorDescription}</h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">{e.fixExplanation}</p>
                    {!e.isFixed && (
                        <div>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Suggested Fix:</p>
                            <pre className="text-xs bg-slate-200/50 dark:bg-indigo-900/40 p-2 rounded-md custom-scrollbar overflow-x-auto mb-3"><code>{e.suggestedFix}</code></pre>
                            <button 
                                onClick={() => onApplyFix(e.lineNumber, e.suggestedFix, e.filePath)} 
                                className="text-xs px-3 py-1.5 bg-rose-600 text-white font-semibold rounded-md hover:bg-rose-500 transition"
                            >
                                Apply Fix
                            </button>
                        </div>
                    )}
                </div>
            ))}

            {review.suggestions?.map((s, i) => (
                <div key={`s-${i}`} className={`p-4 rounded-lg border-l-4 ${s.isApplied ? 'border-green-500 bg-green-500/10' : 'border-amber-500 bg-amber-500/10'}`}>
                    <div className="flex items-center justify-between mb-2">
                        <p className="font-mono text-xs text-amber-800 dark:text-amber-300 flex items-center">
                            <LightBulbIcon className="w-4 h-4 mr-2"/>
                             <span className="font-sans font-bold mr-2">Suggestion:</span>
                            Line {s.lineNumber}{s.filePath && <span className="ml-1 font-sans font-normal text-slate-500 dark:text-slate-400 truncate" title={s.filePath}> in {s.filePath}</span>}
                        </p>
                        {s.isApplied && <span className="text-green-600 dark:text-green-400 text-xs font-bold px-2 py-0.5 rounded-full bg-green-500/10">APPLIED</span>}
                    </div>
                    <h5 className="font-semibold mb-1 text-slate-800 dark:text-slate-200 text-sm">{s.explanation}</h5>
                    {!s.isApplied && (
                        <div>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Suggested Code:</p>
                            <pre className="text-xs bg-slate-200/50 dark:bg-indigo-900/40 p-2 rounded-md custom-scrollbar overflow-x-auto mb-3"><code>{s.suggestion}</code></pre>
                            <button 
                                onClick={() => onApplySuggestion(s.lineNumber, s.suggestion, s.filePath)} 
                                className="text-xs px-3 py-1.5 bg-amber-600 text-white font-semibold rounded-md hover:bg-amber-500 transition"
                            >
                                Apply Suggestion
                            </button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default ReviewPanel;