import { md, fenced } from './investigations/markdown';
import type { SearchMatch, SearchRequest, SearchResponse, SearchMode } from './types';

export type EvidenceStatus = 'confirmed' | 'possible' | 'excluded';
export interface Evidence {
  id: string;
  match: SearchMatch;
  mode: SearchMode;
  query: string;
  status: EvidenceStatus;
  note: string;
  capturedAt: string;
}
export interface SearchRun {
  mode: SearchMode;
  query: string;
  filesScanned: number;
  filesSkipped: number;
  skippedReasons: Record<string, number>;
  truncated: boolean;
  perFileTruncated?: number;
  elapsedMs: number;
  matches: number;
  capturedAt: string;
  ignoredDirs: string[];
  extensions: string[];
}
export interface Investigation {
  id: string;
  title: string;
  objective: string;
  sourceRoot: string;
  createdAt: string;
  evidence: Evidence[];
  runs: SearchRun[];
  conclusion: string;
}
const MAX_EVIDENCE = 300;
const MAX_RUNS = 100;

export function newInvestigation(root: string, title: string): Investigation {
  return { id: crypto.randomUUID(), title: title.trim(), objective: '', sourceRoot: root, createdAt: new Date().toISOString(), evidence: [], runs: [], conclusion: '' };
}
export function evidenceId(match: SearchMatch, mode: SearchMode, query: string): string {
  return JSON.stringify([match.relativePath, match.lineNumber ?? null, match.line ?? null, mode, query]);
}
export function captureEvidence(session: Investigation, match: SearchMatch, mode: SearchMode, query: string): Investigation {
  if (session.evidence.length >= MAX_EVIDENCE) throw new Error(`Maximum ${MAX_EVIDENCE} evidence items per investigation.`);
  if (session.evidence.some(e => e.id === evidenceId(match, mode, query))) return session;
  return { ...session, evidence: [...session.evidence, { id: evidenceId(match, mode, query), match: { ...match, before: match.before.slice(0, 10), after: match.after.slice(0, 10) }, mode, query, status: 'possible', note: '', capturedAt: new Date().toISOString() }] };
}
export function recordRun(session: Investigation, request: SearchRequest, result: SearchResponse): Investigation {
  const run: SearchRun = { mode: request.mode, query: request.query, filesScanned: result.filesScanned, filesSkipped: result.filesSkipped, skippedReasons: result.skippedReasons, truncated: result.truncated, perFileTruncated: result.perFileTruncated, elapsedMs: result.elapsedMs, matches: result.matches.length, capturedAt: new Date().toISOString(), ignoredDirs: request.ignoredDirs, extensions: request.extensions };
  return { ...session, runs: [...session.runs, run].slice(-MAX_RUNS) };
}
export { STORAGE_KEY, readInvestigations, persistInvestigations } from './investigations/storage';
export function renderInvestigationReport(session: Investigation): string {
  const lines: string[] = [
    '# Investigation Report', '', `**Title:** ${md(session.title)}`, `**Objective:** ${md(session.objective || 'Not specified')}`,
    `**Source:** \`${md(session.sourceRoot)}\``, `**Created:** ${session.createdAt}`, `**Exported:** ${new Date().toISOString()}`, '',
    '## Search coverage', '',
  ];
  if (!session.runs.length) lines.push('No searches recorded.');
  session.runs.forEach((r, i) => {
    lines.push(`### Run ${i + 1}: ${md(r.mode)} — ${md(r.query || '(no query)')}`, '',
      `- Time: ${r.capturedAt}`, `- Scanned: ${r.filesScanned}; skipped: ${r.filesSkipped}; matches: ${r.matches}; elapsed: ${r.elapsedMs} ms`,
      `- Extensions: ${md(r.extensions.join(', ') || '(all)')}; ignored directories: ${md(r.ignoredDirs.join(', ') || '(none)')}`,
      `- Files with per-file truncation: ${r.perFileTruncated ?? 0}`,
      `- Truncated: ${r.truncated ? 'YES — incomplete results' : 'No reported result-limit truncation'}`,
      `- Skipped reasons: ${md(JSON.stringify(r.skippedReasons))}`, '');
  });
  lines.push('## Collected evidence', '', `Total: ${session.evidence.length}`, '');
  if (!session.evidence.length) lines.push('No evidence collected.');
  session.evidence.forEach((e, i) => {
    lines.push(`### ${i + 1}. ${md(e.match.relativePath)}${e.match.lineNumber ? `:${e.match.lineNumber}` : ''}`, '',
      `- Status: **${e.status}**`, `- Search: ${md(e.mode)} / ${md(e.query)}`, `- Captured: ${e.capturedAt}`,
      `- Note: ${md(e.note || '(not reviewed)')}`, '', fenced([...e.match.before, ...(e.match.line ? [e.match.line] : []), ...e.match.after].join('\n')), '');
  });
  lines.push('## Findings and next steps', '', session.conclusion || 'Not yet assessed.', '',
    '## Limitations', '', '- Evidence is a snapshot of search results, not a verified dependency graph.',
    '- Search coverage depends on extensions, ignored directories, file-size limits, unreadable files, and result truncation.',
    '- A missing match does not prove the absence of a dependency.', '- Re-check evidence against the source revision before changing production code.', '');
  return lines.join('\n');
}
