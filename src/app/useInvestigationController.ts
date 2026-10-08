import { useEffect, useMemo, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open, save } from '@tauri-apps/plugin-dialog';
import type { ExportRequest, SearchMode, SearchRequest, SearchResponse } from '../types';
import { renderInvestigationText } from '../investigations/plainText';
import { captureEvidence, newInvestigation, readInvestigations, persistInvestigations, recordRun, renderInvestigationReport } from '../investigation';
import type { Investigation } from '../investigation';
import { copy, modeCopy } from '../i18n/catalog';
import type { Language } from '../i18n/catalog';

import { DEFAULT_IGNORES } from '../search/constants';
import { restoreInvestigationBackup } from '../investigations/storage';

export function useInvestigationController() {
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('fit-language') === 'en' ? 'en' : 'vi'));
  const [root, setRoot] = useState('');
  const [validatedRoot, setValidatedRoot] = useState('');
  const [theme, setTheme] = useState<'light'|'dark'>(() => localStorage.getItem('fit-theme') === 'dark' ? 'dark' : 'light');
  const [help, setHelp] = useState(false);
  const [page, setPage] = useState<'explore'|'investigations'|'help'>('explore');
  const [initialStorage] = useState(() => {
    try { return { sessions: readInvestigations(), error: '' }; }
    catch (e) { return { sessions: [] as Investigation[], error: String(e) }; }
  });
  const [storageFailure, setStorageFailure] = useState(initialStorage.error);
  const [sessions, setSessions] = useState<Investigation[]>(initialStorage.sessions);
  const [activeSessionId, setActiveSessionId] = useState('');
  const [sessionError, setSessionError] = useState('');
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDialog, setSessionDialog] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);
  const [exportSuccess, setExportSuccess] = useState('');
  const [reportFormat, setReportFormat] = useState<'md' | 'txt'>('md');
  const [completedRequest, setCompletedRequest] = useState<SearchRequest | null>(null);
  const [fieldError, setFieldError] = useState<"root" | "query" | "general" | null>(null);
  const searchGeneration = useRef(0);
  const resultsRef = useRef<HTMLDivElement>(null);
  const pendingScroll = useRef(false);
  const [mode, setMode] = useState<SearchMode>('text');
  const [query, setQuery] = useState('');
  const [extensions, setExtensions] = useState('php,inc');
  const [ignored, setIgnored] = useState<string[]>(DEFAULT_IGNORES);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [exactMatch, setExactMatch] = useState(false);
  const [contextLines, setContextLines] = useState(2);
  const [minSizeMb, setMinSizeMb] = useState(10);
  const [recentDays, setRecentDays] = useState(7);
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [selectedPath, setSelectedPath] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [copyFeedback, setCopyFeedback] = useState('');

  const t = copy[language];
  const activeSession = sessions.find(s => s.id === activeSessionId && s.sourceRoot === validatedRoot);
  const updateSessions = (next: Investigation[]): boolean => {
    try { persistInvestigations(next); setSessions(next); setSessionError(''); return true; }
    catch (e) { setSessionError(String(e)); return false; }
  };
  const updateSession = (updated: Investigation) => updateSessions(sessions.map(s => s.id === updated.id ? updated : s));
  const createSession = async () => {
    if (creatingSession) return;
    if (!root.trim()) { setSessionError(language === 'vi' ? 'Chọn thư mục source trước.' : 'Choose a source folder first.'); return; }
    if (!sessionTitle.trim()) { setSessionError(language === 'vi' ? 'Nhập tên phiên điều tra.' : 'Enter an investigation title.'); return; }
    setCreatingSession(true);
    try {
      const sourceRoot = await invoke<string>('validate_source_folder', { path: root.trim() });
      const session = newInvestigation(sourceRoot, sessionTitle.trim());
      if (!updateSessions([session, ...sessions])) return;
      setRoot(sourceRoot); setValidatedRoot(sourceRoot);
      setActiveSessionId(session.id);
      setSessionDialog(false); setSessionTitle(''); setSessionError('');
    } catch (e) { setSessionError(String(e)); }
    finally { setCreatingSession(false); }
  };
  const showCreateSession = () => { setSessionError(''); setSessionTitle(query.trim() || 'Source investigation'); setSessionDialog(true); };
  const pinEvidence = (match: SearchResponse['matches'][number]) => {
    if (!activeSession || !result) { setSessionError(language === 'vi' ? 'Tạo hoặc chọn phiên điều tra cùng source trước.' : 'Select an investigation for this source first.'); return; }
    try { updateSession(captureEvidence(activeSession, match, result.mode, result.query)); }
    catch(e) { setSessionError(String(e)); }
  };
  const exportInvestigation = async () => {
    if (!activeSession) return;
    const outputPath = await save({ title: 'Investigation Report', defaultPath: `investigation-evidence.${reportFormat}`, filters: [{ name: reportFormat === 'md' ? 'Markdown' : 'Text', extensions: [reportFormat] }] });
    if (!outputPath) return;
    try { await invoke('export_investigation', { root: activeSession.sourceRoot, outputPath, body: reportFormat === 'md' ? renderInvestigationReport(activeSession) : renderInvestigationText(activeSession) }); setExportSuccess(outputPath); setSessionError(''); }
    catch(e) { setSessionError(String(e)); }
  };
  const [selectedModeLabel, selectedModeDescription, selectedModePlaceholder] = modeCopy[mode][language];

  const grouped = useMemo(() => {
    const map = new Map<string, SearchResponse['matches']>();
    for (const match of result?.matches ?? []) {
      const current = map.get(match.relativePath) ?? [];
      current.push(match);
      map.set(match.relativePath, current);
    }
    return [...map.entries()];
  }, [result]);

  useEffect(() => {
    if (result && pendingScroll.current) {
      pendingScroll.current = false;
      resultsRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    }
  }, [result]);

  const filteredGroups = useMemo(() => grouped.filter(([path]) => path.toLocaleLowerCase().includes(resultFilter.trim().toLocaleLowerCase())), [grouped, resultFilter]);
  const selectedMatches = filteredGroups.find(([path]) => path === selectedPath)?.[1] ?? filteredGroups[0]?.[1] ?? [];
  const selectedFile = filteredGroups.some(([path]) => path === selectedPath) ? selectedPath : filteredGroups[0]?.[0] || '';
  const copyPath = async (value: string) => {
    try { await navigator.clipboard.writeText(value); setCopyFeedback(value); }
    catch { setFieldError('general'); setError(language === 'vi' ? 'Không thể sao chép đường dẫn.' : 'Could not copy path.'); }
  };

  const resetResultState = () => {
    searchGeneration.current += 1;
    pendingScroll.current = false;
    setResult(null); setCompletedRequest(null);
    setSelectedPath('');
    setResultFilter('');
    setExpanded({});
    setLoading(false);
    setError('');
  };

  const switchMode = (next: SearchMode) => {
    if (next === mode) return;
    setMode(next);
    setQuery(''); setExtensions(next === 'php_symbol' ? 'php,inc' : ''); setCaseSensitive(false); setExactMatch(false); setContextLines(2); setMinSizeMb(10); setRecentDays(7); setFieldError(null);
    resetResultState();
  };

  const switchLanguage = (next: Language) => {
    setLanguage(next);
    localStorage.setItem('fit-language', next);
    setError('');
  };

  const request = (): SearchRequest => ({
    root,
    mode,
    query,
    extensions: extensions.split(',').map((x) => x.trim().replace(/^\./, '')).filter(Boolean),
    ignoredDirs: ignored,
    caseSensitive,
    exactMatch,
    contextLines,
    minSizeMb,
    recentDays,
  });

  const chooseFolder = async () => {
    try {
      const picked = await open({ directory: true, multiple: false, title: t.chooseFolderTitle });
      if (typeof picked !== 'string') return;
      resetResultState(); setRoot(picked); setValidatedRoot(''); setActiveSessionId(''); setSessionError('');
      setValidating(true);
      try { const canonical = await invoke<string>('validate_source_folder', { path: picked }); setRoot(canonical); setValidatedRoot(canonical); }
      catch (e) { setFieldError('root'); setError(String(e)); }
      finally { setValidating(false); }
    } catch (e) { setFieldError('root'); setError(String(e)); }
  };

  const validateFolder = async () => {
    setError(''); setFieldError(null); setValidatedRoot(''); resetResultState(); setValidating(true);
    try { const canonical = await invoke<string>('validate_source_folder', { path: root }); setRoot(canonical); setValidatedRoot(canonical); }
    catch(e) { setFieldError('root'); setError(String(e)); setSessionError(String(e)); }
    finally { setValidating(false); }
  };

  const restoreBackup = () => {
    try { const recovered = restoreInvestigationBackup(); setSessions(recovered); setStorageFailure(''); setSessionError(''); }
    catch (e) { setStorageFailure(String(e)); }
  };
  const runSearch = async () => {
    if (!root || root !== validatedRoot) { setFieldError('root'); return setError(language === 'vi' ? 'Chọn thư mục hợp lệ hoặc bấm xác minh đường dẫn đã nhập.' : 'Choose a valid folder or verify the typed path.'); }
    if (['text', 'regex', 'filename', 'php_symbol'].includes(mode) && !query.trim()) { setFieldError('query'); return setError(t.missingQuery); }
    const generation = ++searchGeneration.current;
    pendingScroll.current = true;
    setLoading(true);
    setResult(null); setSelectedPath(''); setResultFilter(''); setExpanded({});
    setError(''); setFieldError(null);
    try {
      const searchRequest = request();
      const response = await invoke<SearchResponse>('search_files', { request: searchRequest });
      if (generation !== searchGeneration.current) return;
      setResult(response); setCompletedRequest(searchRequest);
      const current = sessions.find(s => s.id === activeSessionId && s.sourceRoot === response.root);
      if (current) updateSession(recordRun(current, searchRequest, response));
      setSelectedPath(response.matches[0]?.relativePath ?? '');
      setExpanded({});
    } catch (e) {
      if (generation === searchGeneration.current) { pendingScroll.current = false; setFieldError('general'); setError(String(e)); }
    } finally {
      if (generation === searchGeneration.current) setLoading(false);
    }
  };

  const exportReport = async (format: 'txt' | 'md') => {
    if (!result) return;
    const outputPath = await save({
      title: format === 'txt' ? t.exportTxtTitle : t.exportMdTitle,
      defaultPath: `investigation-report.${format}`,
      filters: [{ name: format.toUpperCase(), extensions: [format] }],
    });
    if (!outputPath) return;
    try {
      const payload: ExportRequest = { outputPath, format, search: completedRequest ?? request(), result, includeContext: true };
      await invoke('export_report', { request: payload });
    } catch (e) {
      setError(String(e));
    }
  };

  const applyPreset = (preset: { mode: SearchMode; query: string; extensions: string }) => {
    switchMode(preset.mode);
    setMode(preset.mode); setQuery(preset.query); setExtensions(preset.extensions);
    setPage('explore'); setHelp(false);
  };
  const presets: { name: string; mode: SearchMode; query: string; extensions: string }[] = [
    { name: language === 'vi' ? 'Tìm nơi sử dụng symbol' : 'Find symbol usages', mode: 'text', query: '', extensions: 'php,inc' },
    { name: language === 'vi' ? 'Tìm khai báo PHP' : 'Find PHP definitions', mode: 'php_symbol', query: '', extensions: 'php,inc' },
    { name: 'SQL queries', mode: 'regex', query: String.raw`\b(SELECT|INSERT|UPDATE|DELETE|JOIN)\b`, extensions: 'php,inc,sql' },
    { name: 'TODO / FIXME', mode: 'todo', query: '', extensions: '' },
    { name: language === 'vi' ? 'Tìm tên bảng/column' : 'Find table/column', mode: 'text', query: '', extensions: 'php,inc,sql' },
    { name: language === 'vi' ? 'Tìm file cấu hình' : 'Find config files', mode: 'filename', query: 'config', extensions: '' },
  ];
  const navigationGroups: { title: string; modes: SearchMode[] }[] = [
    { title: language === 'vi' ? 'Tìm nội dung' : 'Content search', modes: ['text', 'regex', 'php_symbol', 'todo'] },
    { title: language === 'vi' ? 'Tìm file' : 'Find files', modes: ['filename', 'extension', 'images'] },
    { title: language === 'vi' ? 'Kiểm tra file' : 'Inspect files', modes: ['large_files', 'recent_files', 'empty_files'] },
  ];
  const activeGroup = navigationGroups.find(g => g.modes.includes(mode)) ?? navigationGroups[0];
  const toggleIgnore = (name: string) => setIgnored((items) => (items.includes(name) ? items.filter((x) => x !== name) : [...items, name]));

  return {
    language,
    setLanguage,
    root,
    setRoot,
    validatedRoot,
    setValidatedRoot,
    theme,
    setTheme,
    help,
    setHelp,
    page,
    setPage,
    sessions,
    setSessions,
    activeSessionId,
    setActiveSessionId,
    sessionError,
    setSessionError,
    sessionTitle,
    setSessionTitle,
    sessionDialog,
    setSessionDialog,
    creatingSession,
    setCreatingSession,
    exportSuccess,
    setExportSuccess,
    completedRequest,
    setCompletedRequest,
    fieldError,
    setFieldError,
    searchGeneration,
    resultsRef,
    pendingScroll,
    mode,
    setMode,
    query,
    setQuery,
    extensions,
    setExtensions,
    ignored,
    setIgnored,
    caseSensitive,
    setCaseSensitive,
    exactMatch,
    setExactMatch,
    contextLines,
    setContextLines,
    minSizeMb,
    setMinSizeMb,
    recentDays,
    setRecentDays,
    result,
    setResult,
    loading,
    validating,
    storageFailure,
    restoreBackup,
    setLoading,
    error,
    setError,
    expanded,
    setExpanded,
    selectedPath,
    setSelectedPath,
    resultFilter,
    setResultFilter,
    copyFeedback,
    setCopyFeedback,
    t,
    activeSession,
    updateSessions,
    updateSession,
    createSession,
    showCreateSession,
    pinEvidence,
    exportInvestigation,
    reportFormat,
    setReportFormat,
    selectedModeLabel,
    selectedModeDescription,
    selectedModePlaceholder,
    grouped,
    filteredGroups,
    selectedMatches,
    selectedFile,
    copyPath,
    resetResultState,
    switchMode,
    switchLanguage,
    request,
    chooseFolder,
    validateFolder,
    runSearch,
    exportReport,
    applyPreset,
    presets,
    navigationGroups,
    activeGroup,
    toggleIgnore,
  };
}
