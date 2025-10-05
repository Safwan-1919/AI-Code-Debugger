import React, { useState, useCallback, useEffect } from 'react';
import { CodeEditor } from './components/CodeEditor';
import AnalysisPanel from './components/AnalysisPanel';
import FileExplorer from './components/FileExplorer';
import { analyzeCode, analyzeProject } from './services/geminiService';
import type { AnalysisResult, TabName } from './types';
import { SUPPORTED_LANGUAGES, SUPPORTED_MODELS } from './constants';
import { BrainCircuitIcon, LoadingSpinner, ChevronsLeftIcon } from './components/icons';
import ThemeToggle from './components/ThemeToggle';
import ModelSelector from './components/ModelSelector';
import { getLanguageFromFile, languageIdToExtension } from './utils';

type Theme = 'light' | 'dark';

interface CodeFile {
  name: string;
  content: string;
}

const initialCode = `function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Analyze for n=4 for a shorter trace
console.log(fibonacci(4));`;

/**
 * Cleans a code suggestion string by removing markdown fences, returning only the code.
 * This allows multi-line code suggestions to be applied correctly.
 * @param rawText The raw string from the AI, which may be wrapped in ```.
 * @returns The raw code content, trimmed.
 */
const sanitizeCode = (rawText: string): string => {
    const trimmedText = rawText.trim();

    // Regex to capture content within ```...```, ignoring the language specifier.
    const match = trimmedText.match(/^```(?:\w+)?\s*\n?([\s\S]+?)\n?```$/);
    
    if (match && match[1]) {
        // If markdown fences are found, return only the content within them.
        return match[1].trim();
    }
    
    // If no fences are found, return the original text, assuming it's pure code.
    return trimmedText;
};


const App: React.FC = () => {
    const [files, setFiles] = useState<CodeFile[]>([{ name: 'fibonacci.js', content: initialCode }]);
    const [activeFileName, setActiveFileName] = useState<string | null>('fibonacci.js');
    
    const [language, setLanguage] = useState<string>(SUPPORTED_LANGUAGES[1].id);
    const [model, setModel] = useState<string>(SUPPORTED_MODELS[0].id);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [analysisTitle, setAnalysisTitle] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [theme, setTheme] = useState<Theme>('dark');
    const [highlightedLine, setHighlightedLine] = useState<{lineNumber: number; filePath: string} | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    const [activeAnalysisTab, setActiveAnalysisTab] = useState<TabName>('Review');
    const [debuggerStep, setDebuggerStep] = useState<number>(0);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    const handleFileSelect = (fileName: string) => {
        handleReset();
        setActiveFileName(fileName);
        const detectedLanguage = getLanguageFromFile(fileName);
        // If a language is detected, update the language dropdown.
        // Otherwise, set to 'all' to avoid mismatches with generic files.
        setLanguage(detectedLanguage || 'all');
    };

    const handleFileContentChange = (newContent: string) => {
        if (!activeFileName) return;
        setFiles(prevFiles => 
            prevFiles.map(file => 
                file.name === activeFileName ? { ...file, content: newContent } : file
            )
        );
    };

    const handleLanguageChange = (newLanguageId: string) => {
        setLanguage(newLanguageId);

        const currentActiveFile = activeFileName; // Capture at the start
        if (newLanguageId === 'all' || !currentActiveFile) {
            return;
        }

        const extension = languageIdToExtension[newLanguageId];
        if (!extension) {
            console.warn(`No extension found for language ID: ${newLanguageId}`);
            return;
        }
        
        // Generate unique name based on current state
        let newFileName = `main.${extension}`;
        let counter = 1;
        while (files.some(f => f.name === newFileName && f.name !== currentActiveFile)) {
            newFileName = `main-${counter}.${extension}`;
            counter++;
        }
        
        setActiveFileName(newFileName); // Update active name state
        setFiles(prevFiles => { // Update files array state
            const activeFileIndex = prevFiles.findIndex(f => f.name === currentActiveFile);
            if (activeFileIndex === -1) {
                return prevFiles;
            }
            const updatedFiles = [...prevFiles];
            updatedFiles[activeFileIndex] = {
                ...updatedFiles[activeFileIndex],
                name: newFileName,
            };
            return updatedFiles;
        });
    };

    const handleFolderUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFiles = event.target.files;
        if (!uploadedFiles || uploadedFiles.length === 0) return;

        const filePromises: Promise<CodeFile>[] = Array.from(uploadedFiles).map((file: File) => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const content = e.target?.result as string;
                    resolve({ name: (file as any).webkitRelativePath || file.name, content });
                };
                reader.onerror = (e) => reject(e);
                reader.readAsText(file);
            });
        });

        Promise.all(filePromises).then(newFiles => {
            setFiles(newFiles);
            setActiveFileName(newFiles[0]?.name || null);
            setIsSidebarOpen(true);
            handleReset();
            setLanguage('all');
        });
    };
    
    const analyze = async (analysisFn: () => Promise<AnalysisResult>) => {
        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);
        setHighlightedLine(null);
        setDebuggerStep(0);
        setActiveAnalysisTab('Review');
        try {
            const result = await analysisFn();
            setAnalysisResult(result);
        } catch (e: any) {
            setError(e.message || "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnalyzeFile = useCallback(async () => {
        const activeFile = files.find(f => f.name === activeFileName);
        if (!activeFile || !activeFile.content.trim()) {
            setError("The active file is empty.");
            return;
        }

        const detectedLang = getLanguageFromFile(activeFile.name);
        if (language !== 'all' && detectedLang && detectedLang !== language) {
            const selectedLangName = SUPPORTED_LANGUAGES.find(l => l.id === language)?.name;
            const detectedLangName = SUPPORTED_LANGUAGES.find(l => l.id === detectedLang)?.name || detectedLang;
            setError(`Language Mismatch: Selected language is '${selectedLangName}', but this appears to be a '${detectedLangName}' file. Please switch the language or select 'All Languages'.`);
            return;
        }

        setAnalysisTitle(`Analysis for: ${activeFile.name}`);
        await analyze(() => analyzeCode(activeFile.content, activeFile.name, language, model));
    }, [files, activeFileName, language, model]);


    const handleAnalyzeProject = useCallback(async () => {
        if (files.length === 0) {
            setError("No files to analyze. Please upload a folder.");
            return;
        }
        setAnalysisTitle("Project-Wide Analysis");
        await analyze(() => analyzeProject(files, language, model));
    }, [files, language, model]);

    const handleApplySuggestion = (lineNumber: number, suggestion: string, filePath?: string) => {
        const targetFile = filePath || activeFileName;
        if (!targetFile) return;

        setFiles(prevFiles => prevFiles.map(file => {
            if (file.name === targetFile) {
                const lines = file.content.split('\n');
                const originalLine = lines[lineNumber - 1];
                const indentationMatch = originalLine.match(/^\s*/);
                const indentation = indentationMatch ? indentationMatch[0] : '';
                
                const cleanCode = sanitizeCode(suggestion);
                const indentedCode = cleanCode
                    .split('\n')
                    .map(line => indentation + line)
                    .join('\n');

                lines[lineNumber - 1] = indentedCode;
                return { ...file, content: lines.join('\n') };
            }
            return file;
        }));

        if (analysisResult?.review) {
            const updatedSuggestions = analysisResult.review.suggestions.map(sugg =>
                sugg.lineNumber === lineNumber && (sugg.filePath || activeFileName) === targetFile 
                ? { ...sugg, isApplied: true } 
                : sugg
            );
            setAnalysisResult(prev => {
                if (!prev) return null;
                return { 
                    ...prev, 
                    review: { ...prev.review, suggestions: updatedSuggestions } 
                };
            });
        }
        setHighlightedLine({ lineNumber, filePath: targetFile });
        setTimeout(() => setHighlightedLine(null), 2500);
    };
    
    const handleApplyFix = (lineNumber: number, suggestedFix: string, filePath?: string) => {
        const targetFile = filePath || activeFileName;
        if (!targetFile) return;

        setFiles(prevFiles => prevFiles.map(file => {
            if (file.name === targetFile) {
                const lines = file.content.split('\n');
                const originalLine = lines[lineNumber - 1];
                const indentationMatch = originalLine.match(/^\s*/);
                const indentation = indentationMatch ? indentationMatch[0] : '';

                const cleanCode = sanitizeCode(suggestedFix);
                const indentedCode = cleanCode
                    .split('\n')
                    .map(line => indentation + line)
                    .join('\n');
                
                lines[lineNumber - 1] = indentedCode;
                return { ...file, content: lines.join('\n') };
            }
            return file;
        }));

        if (analysisResult?.review) {
            const updatedErrors = analysisResult.review.errors.map(err =>
                err.lineNumber === lineNumber && (err.filePath || activeFileName) === targetFile
                ? { ...err, isFixed: true }
                : err
            );
            setAnalysisResult(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    review: { ...prev.review, errors: updatedErrors }
                };
            });
        }
        setHighlightedLine({ lineNumber, filePath: targetFile });
        setTimeout(() => setHighlightedLine(null), 2500);
    };

    const handleReset = () => {
        setAnalysisResult(null);
        setAnalysisTitle(null);
        setError(null);
        setHighlightedLine(null);
        setDebuggerStep(0);
        setActiveAnalysisTab('Review');
    };

    const activeFile = files.find(f => f.name === activeFileName);

    return (
        <div className="flex h-screen w-full font-sans text-slate-800 dark:text-slate-200 overflow-hidden">
            <FileExplorer 
                files={files}
                activeFileName={activeFileName}
                onSelectFile={handleFileSelect}
                onFolderUpload={handleFolderUpload}
                isOpen={isSidebarOpen}
            />
            <div className="flex-1 flex flex-col min-w-0">
                <header className="flex-shrink-0 flex items-center justify-between border-b border-slate-300/70 dark:border-white/10 p-4 sm:p-6">
                     <div className="flex items-center">
                        <button 
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-indigo-950/50 mr-2"
                            title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
                        >
                            <ChevronsLeftIcon className={`w-6 h-6 text-slate-600 dark:text-slate-300 transition-transform duration-300 ${!isSidebarOpen && 'rotate-180'}`}/>
                        </button>
                        <BrainCircuitIcon />
                        <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">
                            DeLearner
                        </h1>
                     </div>
                     <div className="flex items-center gap-4">
                        <div className="w-48">
                            <ModelSelector
                                models={SUPPORTED_MODELS}
                                selectedModel={model}
                                onModelChange={setModel}
                            />
                        </div>
                        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
                     </div>
                </header>
                
                <main className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 overflow-y-auto p-4 sm:p-6 lg:p-8" style={{minHeight: 0}}>
                    <div className="flex flex-col min-h-0">
                        <CodeEditor
                            fileContent={activeFile?.content ?? ''}
                            onFileContentChange={handleFileContentChange}
                            fileName={activeFile?.name || null}
                            language={language}
                            onLanguageChange={handleLanguageChange}
                            model={model}
                            onRunStart={handleReset}
                            onAnalyzeFile={handleAnalyzeFile}
                            highlightedLine={highlightedLine}
                            analysisResult={analysisResult}
                            isDisabled={!activeFile}
                            isDebuggerActive={activeAnalysisTab === 'Debugger'}
                            debuggerTrace={analysisResult?.debuggerTrace}
                            debuggerStep={debuggerStep}
                        />
                    </div>
                    <div className="flex flex-col min-h-0">
                        <AnalysisPanel
                            analysisResult={analysisResult}
                            analysisTitle={analysisTitle}
                            isLoading={isLoading}
                            error={error}
                            onApplySuggestion={handleApplySuggestion}
                            onApplyFix={handleApplyFix}
                            onHighlightLine={setHighlightedLine}
                            activeTab={activeAnalysisTab}
                            setActiveTab={setActiveAnalysisTab}
                            debuggerStep={debuggerStep}
                            setDebuggerStep={setDebuggerStep}
                        />
                    </div>
                </main>

                <footer className="flex-shrink-0 mt-auto border-t border-slate-300/70 dark:border-white/10 p-4 flex justify-center items-center">
                    <button
                        onClick={handleAnalyzeProject}
                        disabled={isLoading || files.length === 0}
                        className="flex items-center justify-center px-8 py-3 w-64 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-lg shadow-lg transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-100 dark:focus:ring-offset-slate-900"
                    >
                        {isLoading ? <LoadingSpinner /> : 'Analyze Project'}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default App;