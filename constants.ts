
import type { ProgrammingLanguage, AiModel } from './types';

export const SUPPORTED_LANGUAGES: ProgrammingLanguage[] = [
  { id: 'all', name: 'All Languages' },
  { id: 'javascript', name: 'JavaScript' },
  { id: 'python', name: 'Python' },
  { id: 'typescript', name: 'TypeScript' },
  { id: 'java', name: 'Java' },
  { id: 'csharp', name: 'C#' },
  { id: 'go', name: 'Go' },
  { id: 'rust', name: 'Rust' },
  { id: 'cpp', name: 'C++' },
];

export const SUPPORTED_MODELS: AiModel[] = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  // Future approved models for text-based tasks can be added here.
];
