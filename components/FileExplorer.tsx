import React, { useRef } from 'react';
import { FolderIcon, FileIcon } from './icons';

interface CodeFile {
  name: string;
  content: string;
}

interface FileExplorerProps {
  files: CodeFile[];
  activeFileName: string | null;
  onSelectFile: (fileName: string) => void;
  onFolderUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isOpen: boolean;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ files, activeFileName, onSelectFile, onFolderUpload, isOpen }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <aside className={`bg-slate-100 dark:bg-gray-900/50 flex flex-col h-screen border-r border-slate-300/70 dark:border-white/10 flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'w-64' : 'w-0'}`}>
            <div className="p-4 border-b border-slate-300/70 dark:border-white/10 flex-shrink-0">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center whitespace-nowrap">
                    <FolderIcon className="h-5 w-5 mr-2 text-amber-500" /> 
                    Project Files
                </h2>
            </div>
            <div className="flex-grow overflow-y-auto custom-scrollbar p-2">
                <ul className="space-y-1">
                    {files.map(file => (
                        <li key={file.name}>
                            <button 
                                onClick={() => onSelectFile(file.name)}
                                className={`w-full text-left flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                                    activeFileName === file.name 
                                    ? 'bg-indigo-200/50 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 font-semibold' 
                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-indigo-950/50'
                                }`}
                                title={file.name}
                            >
                                <FileIcon className="h-4 w-4 mr-2 text-slate-500 flex-shrink-0" />
                                <span className="truncate">{file.name}</span>
                            </button>
                        </li>
                    ))}
                </ul>
                {files.length === 0 && (
                     <div className="text-center text-sm text-slate-500 dark:text-slate-400 p-4 whitespace-nowrap">
                        Click below to upload a folder.
                     </div>
                )}
            </div>
            <div className="p-4 border-t border-slate-300/70 dark:border-white/10 flex-shrink-0">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={onFolderUpload}
                    className="hidden"
                    // @ts-ignore
                    webkitdirectory="" 
                    directory="" 
                    multiple
                />
                <button
                    onClick={handleUploadClick}
                    className="w-full text-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-500 transition whitespace-nowrap"
                >
                    Upload Folder
                </button>
            </div>
        </aside>
    );
};

export default FileExplorer;