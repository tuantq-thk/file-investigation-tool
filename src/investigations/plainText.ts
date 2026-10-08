import type { Investigation } from '../investigation';

/** Standalone plain-text report: no Markdown syntax required to read it. */
export function renderInvestigationText(session: Investigation): string {
  const lines = [
    'INVESTIGATION REPORT',
    `Title: ${session.title}`,
    `Objective: ${session.objective || 'Not specified'}`,
    `Source: ${session.sourceRoot}`,
    `Created: ${session.createdAt}`,
    `Exported: ${new Date().toISOString()}`,
    '', 'SEARCH COVERAGE',
  ];
  if (!session.runs.length) lines.push('No searches recorded.');
  session.runs.forEach((run, index) => {
    lines.push('', `Run ${index + 1}: ${run.mode} / ${run.query || '(no query)'}`,
      `  Scanned: ${run.filesScanned}; skipped: ${run.filesSkipped}; matches: ${run.matches}`,
      `  Duration: ${run.elapsedMs} ms; truncated: ${run.truncated ? 'YES' : 'no'}`,
      `  Per-file limits: ${run.perFileTruncated ?? 0}`,
      `  Skipped reasons: ${JSON.stringify(run.skippedReasons)}`);
  });
  lines.push('', 'EVIDENCE');
  if (!session.evidence.length) lines.push('No evidence captured.');
  session.evidence.forEach((e, index) => {
    lines.push('', `${index + 1}. ${e.match.relativePath}${e.match.lineNumber ? ':' + e.match.lineNumber : ''}`,
      `  Status: ${e.status}; search: ${e.mode} / ${e.query}`,
      `  Captured: ${e.capturedAt}`, `  Note: ${e.note || '(not reviewed)'}`,
      ...[...e.match.before, ...(e.match.line ? [e.match.line] : []), ...e.match.after].map(line => '    ' + line));
  });
  lines.push('', 'FINDINGS AND NEXT STEPS', session.conclusion || '(not provided)', '');
  return lines.join('\n');
}
