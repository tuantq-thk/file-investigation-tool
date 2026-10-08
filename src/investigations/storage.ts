import type { Investigation } from '../investigation';

export const STORAGE_KEY = 'fit-investigations-v1';
const MAX_SESSIONS = 20;
const MAX_STORAGE_CHARS = 2_000_000;
export const BACKUP_KEY = `${STORAGE_KEY}-backup`;

export function parseInvestigations(raw: string): Investigation[] {
  const data: unknown = JSON.parse(raw);
  if (!Array.isArray(data)) throw new Error('Investigation storage must contain an array.');
  if (data.length > MAX_SESSIONS) throw new Error('Investigation storage exceeds the supported session count.');
  if (!data.every((s) => s && typeof s.id === 'string' && typeof s.sourceRoot === 'string' && typeof s.title === 'string' && Array.isArray(s.evidence) && Array.isArray(s.runs))) {
    throw new Error('Investigation storage contains invalid session data.');
  }
  return data as Investigation[];
}

export function readInvestigations(): Investigation[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) return [];
  return parseInvestigations(raw);
}

export function persistInvestigations(sessions: Investigation[]): void {
  if (sessions.length > MAX_SESSIONS) throw new Error(`Maximum ${MAX_SESSIONS} investigations.`);
  const serialized = JSON.stringify(sessions);
  if (serialized.length > MAX_STORAGE_CHARS) throw new Error('Investigation storage limit reached. Export or back up your investigations first.');
  const previous = localStorage.getItem(STORAGE_KEY);
  // Never replace an invalid snapshot: allow the user to recover it manually.
  if (previous !== null) parseInvestigations(previous);
  if (previous !== null) localStorage.setItem(BACKUP_KEY, previous);
  localStorage.setItem(STORAGE_KEY, serialized);
}

export function restoreInvestigationBackup(): Investigation[] {
  const backup = localStorage.getItem(BACKUP_KEY);
  if (backup === null) throw new Error('No investigation backup is available.');
  const sessions = parseInvestigations(backup);
  localStorage.setItem(STORAGE_KEY, backup);
  return sessions;
}
