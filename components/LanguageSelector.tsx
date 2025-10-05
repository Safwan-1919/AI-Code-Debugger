import React from 'react';
import type { ProgrammingLanguage } from '../types';

interface LanguageSelectorProps {
  languages: ProgrammingLanguage[];
  selectedLanguage: string;
  onLanguageChange: (languageId: string) => void;
}

const ChevronDownIcon = () => (
    <svg className="w-5 h-5 text-slate-500 dark:text-slate-400" xmlns="http://www.w.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);


const LanguageSelector: React.FC<LanguageSelectorProps> = ({ languages, selectedLanguage, onLanguageChange }) => {
  return (
    <div className="relative">
      <label htmlFor="language-select" className="sr-only">Select Language</label>
      <select
        id="language-select"
        value={selectedLanguage}
        onChange={(e) => onLanguageChange(e.target.value)}
        className="w-full appearance-none bg-white/50 dark:bg-indigo-900/50 border border-slate-300 dark:border-indigo-700 rounded-lg pl-4 pr-10 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 transition-colors"
      >
        {languages.map((lang) => (
          <option key={lang.id} value={lang.id}>
            {lang.name}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
        <ChevronDownIcon />
      </div>
    </div>
  );
};

export default LanguageSelector;
