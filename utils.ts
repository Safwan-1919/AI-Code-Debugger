

const extensionToLanguageId: { [key: string]: string } = {
  'js': 'javascript',
  'jsx': 'javascript',
  'py': 'python',
  'ts': 'typescript',
  'tsx': 'typescript',
  'java': 'java',
  'cs': 'csharp',
  'go': 'go',
  'rs': 'rust',
  'cpp': 'cpp',
  'cxx': 'cpp',
  'h': 'cpp',
  'hpp': 'cpp',
};

export const languageIdToExtension: { [key: string]: string } = {
  'javascript': 'js',
  'python': 'py',
  'typescript': 'ts',
  'java': 'java',
  'csharp': 'cs',
  'go': 'go',
  'rust': 'rs',
  'cpp': 'cpp',
};

/**
 * Detects the programming language from a file name based on its extension.
 * @param fileName The name of the file (e.g., 'main.js').
 * @returns The language ID (e.g., 'javascript') or null if not found.
 */
export const getLanguageFromFile = (fileName: string | null): string | null => {
  if (!fileName) return null;
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (!extension) return null;
  return extensionToLanguageId[extension] || null;
};