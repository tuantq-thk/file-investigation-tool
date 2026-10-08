export type SearchMode =
  | 'text'
  | 'regex'
  | 'filename'
  | 'extension'
  | 'php_symbol'
  | 'images'
  | 'large_files'
  | 'recent_files'
  | 'empty_files'
  | 'todo';

export interface SearchRequest {
  root: string;
  mode: SearchMode;
  query: string;
  extensions: string[];
  ignoredDirs: string[];
  caseSensitive: boolean;
  exactMatch: boolean;
  contextLines: number;
  minSizeMb?: number;
  recentDays?: number;
}

export interface SearchMatch {
  path: string;
  relativePath: string;
  lineNumber?: number;
  line?: string;
  before: string[];
  after: string[];
  fileSize: number;
  modifiedAt?: string;
}

export interface SearchResponse {
  root: string;
  mode: SearchMode;
  query: string;
  filesScanned: number;
  filesSkipped: number;
  skippedReasons: Record<string, number>;
  scanIssues: Array<{ reason: string; path: string; message: string }>;
  scanIssuesTruncated: boolean;
  filesMatched: number;
  matches: SearchMatch[];
  elapsedMs: number;
  truncated: boolean;
  perFileTruncated: number;
}

export interface ExportRequest {
  outputPath: string;
  format: 'txt' | 'md';
  search: SearchRequest;
  result: SearchResponse;
  includeContext: boolean;
}
