export interface Language {
  id: 'javascript' | 'python' | 'java' | 'cpp' | 'go' | 'typescript' | 'c';
  name: string;
  alias?: string;
  extension: string;
}

export type ExecutionMode = 'manual' | 'competitive';

export type Theme = 'light' | 'dark' | 'system';
