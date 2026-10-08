import { DEFAULT_IGNORES } from '../search/constants';
import { HighlightedLine } from '../components/HighlightedLine';
import type { EvidenceStatus } from '../investigation';
import { evidenceId } from '../investigation';
import type { SearchMode } from '../types';
import { modeCopy } from '../i18n/catalog';
import { useInvestigationController } from './useInvestigationController';
import {
  Archive,
  Braces,
  CaseSensitive,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Download,
  File,
  FileCode2,
  FileDown,
  FileImage,
  FileSearch,
  FileText,
  FolderOpen,
  Hash,
  Languages,
  LoaderCircle,
  Search,
  ShieldCheck,
  TextSearch,
  X, Copy,
  Moon, Sun, BookOpen, FolderCheck, ClipboardList, Plus, Pin, Trash2,
} from 'lucide-react';

export function AppView({ controller }: { controller: ReturnType<typeof useInvestigationController> }) {
  const {
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
  } = controller;
  return (
    <main className={`shell theme-${theme}`}>
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><FileSearch size={20} /></div>
          <div><h1>File Investigation Tool</h1><p>{t.appSubtitle}</p></div>
        </div>
        <div className="topbar-actions">
          <button className="btn tertiary" onClick={() => { const next = theme === 'dark' ? 'light' : 'dark'; setTheme(next); localStorage.setItem('fit-theme',next); }} title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>{theme === 'dark' ? <Sun size={17}/> : <Moon size={17}/>}</button>
          <div className="language-switch" aria-label={t.language}>
            <Languages size={15} />
            <button className={language === 'vi' ? 'active' : ''} onClick={() => switchLanguage('vi')}>VI</button>
            <button className={language === 'en' ? 'active' : ''} onClick={() => switchLanguage('en')}>EN</button>
          </div>
          <div className="safety-pill"><ShieldCheck size={16} /> {t.sourceProtected}</div>
        </div>
      </header>

      <section className="workspace">
        <aside className="sidebar">
          <button className={`mode-item ${page === 'explore' ? 'active' : ''}`} onClick={() => { setPage('explore'); setHelp(false); }}><Search size={18}/><span><strong>Explore</strong><small>{language === 'vi' ? 'Tìm kiếm · Presets · Preview' : 'Search · Presets · Preview'}</small></span></button>
          <button className={`mode-item ${page === 'investigations' ? 'active' : ''}`} onClick={() => { setPage('investigations'); setHelp(false); }}><ClipboardList size={18}/><span><strong>Investigations</strong><small>{language === 'vi' ? 'Bằng chứng · Ghi chú' : 'Evidence · Notes'}</small></span></button>
          <button className={`mode-item ${page === 'help' ? 'active' : ''}`} onClick={() => { setPage('help'); setHelp(true); }}><BookOpen size={18}/><span><strong>{language === 'vi' ? 'Hướng dẫn' : 'Help'}</strong></span></button>
          <div className="read-only-card"><ShieldCheck size={18} /><div><strong>{t.readOnlyTitle}</strong><p>{t.readOnlyBody}</p></div></div>
        </aside>

        <section className="content">
          {storageFailure && <div className="error" role="alert"><strong>{language === 'vi' ? 'Lỗi dữ liệu phiên: dữ liệu gốc được giữ nguyên.' : 'Session storage error: original data was preserved.'}</strong> {storageFailure} <button className="btn secondary" onClick={restoreBackup}>{language === 'vi' ? 'Khôi phục bản sao lưu' : 'Restore backup'}</button></div>}
          {page === 'investigations' ? <div className="panel investigation-panel">
            <div className="panel-heading"><div><span className="eyebrow">INVESTIGATION WORKSPACE</span><h2>Investigations</h2><p>{language === 'vi' ? 'Lưu bằng chứng và ghi chú trong dữ liệu cục bộ của ứng dụng, không ghi vào source.' : 'Evidence and notes stay in app-local storage, never in the source.'}</p></div><button className="btn secondary" onClick={showCreateSession}><Plus size={15}/> {language === 'vi' ? 'Tạo phiên' : 'New session'}</button></div>
            <div className="field full session-source-field"><label>{t.sourceFolder}</label><div className="folder-row"><input className="path-input" value={root} onChange={e => { setRoot(e.target.value); setValidatedRoot(''); setSessionError(''); resetResultState(); }} placeholder={t.sourcePlaceholder}/><button className="btn secondary" onClick={chooseFolder}><FolderOpen size={17}/>{t.browse}</button><button className="btn secondary verify-button" onClick={validateFolder} disabled={validating} title={language === 'vi' ? 'Xác minh source' : 'Verify source'}><FolderCheck size={17}/></button></div><div className="field-hint"><ShieldCheck size={14}/>{validatedRoot && root === validatedRoot ? (language === 'vi' ? '✓ Đã xác minh' : '✓ Verified') : (language === 'vi' ? 'Khi tạo phiên, ứng dụng sẽ tự xác minh đường dẫn.' : 'Source is automatically verified when creating a session.')}</div></div>
            <div className="session-picker"><label>{language === 'vi' ? 'Phiên điều tra' : 'Investigation'}</label><select value={activeSession?.id ?? ''} onChange={e => setActiveSessionId(e.target.value)}><option value="">{language === 'vi' ? 'Chọn phiên theo source đã xác minh' : 'Choose a session for the verified source'}</option>{sessions.filter(s => s.sourceRoot === validatedRoot && !!validatedRoot).map(s => <option key={s.id} value={s.id}>{s.title} ({s.evidence.length})</option>)}</select></div>
            {sessionError && <div className="inline-error" role="alert">{sessionError}</div>}
            {activeSession ? <>
              <div className="form-grid"><div className="field"><label>{language === 'vi' ? 'Tiêu đề' : 'Title'}</label><input value={activeSession.title} onChange={e => updateSession({...activeSession, title:e.target.value})}/></div><div className="field"><label>{language === 'vi' ? 'Mục tiêu điều tra' : 'Objective'}</label><input value={activeSession.objective} onChange={e => updateSession({...activeSession, objective:e.target.value})} placeholder={language === 'vi' ? 'Thay đổi gì, cần xác minh gì?' : 'What needs to be investigated?'}/></div></div>
              <div className="session-summary">{activeSession.runs.length} {language === 'vi' ? 'lượt tìm kiếm' : 'searches'} · {activeSession.evidence.length} evidence · {activeSession.evidence.filter(e => e.status === 'confirmed').length} confirmed</div>
              {activeSession.evidence.map(e => <div className="evidence-item" key={e.id}><div className="evidence-title"><strong>{e.match.relativePath}{e.match.lineNumber ? `:${e.match.lineNumber}` : ''}</strong><button className="btn tertiary" title="Remove evidence" onClick={() => updateSession({...activeSession,evidence:activeSession.evidence.filter(x => x.id !== e.id)})}><Trash2 size={14}/></button></div><pre><HighlightedLine line={e.match.line || '(file match)'} path={e.match.relativePath}/></pre><div className="evidence-edit"><select aria-label="Evidence status" value={e.status} onChange={ev => updateSession({...activeSession,evidence:activeSession.evidence.map(x => x.id === e.id ? {...x,status:ev.target.value as EvidenceStatus} : x)})}><option value="possible">Possible</option><option value="confirmed">Confirmed</option><option value="excluded">Excluded</option></select><input aria-label="Evidence note" value={e.note} placeholder={language === 'vi' ? 'Vì sao liên quan? Cần kiểm tra gì?' : 'Why relevant?'} onChange={ev => updateSession({...activeSession,evidence:activeSession.evidence.map(x => x.id === e.id ? {...x,note:ev.target.value} : x)})}/></div></div>)}
              <div className="field"><label>{language === 'vi' ? 'Kết luận và bước kiểm thử tiếp theo' : 'Findings and next steps'}</label><textarea rows={5} value={activeSession.conclusion} onChange={e => updateSession({...activeSession,conclusion:e.target.value})} placeholder={language === 'vi' ? 'Tóm tắt ảnh hưởng, rủi ro, điều chưa xác minh…' : 'Impact, risks, open questions…'}/></div>
              <div className="actions investigation-actions"><button className="btn secondary" onClick={() => { if(window.confirm(language === 'vi' ? 'Xóa phiên điều tra này khỏi ứng dụng?' : 'Delete this local investigation?')) { updateSessions(sessions.filter(s=>s.id!==activeSession.id)); setActiveSessionId(''); } }}><Trash2 size={15}/> {language === 'vi' ? 'Xóa phiên' : 'Delete session'}</button><div className="report-export-group"><label htmlFor="report-format">{language === 'vi' ? 'Định dạng' : 'Format'}</label><select id="report-format" value={reportFormat} onChange={e => setReportFormat(e.target.value as 'md' | 'txt')}><option value="md">Markdown (.md)</option><option value="txt">Text (.txt)</option></select><button className="btn primary" onClick={exportInvestigation}><FileDown size={16}/> {language === 'vi' ? 'Xuất Evidence Report' : 'Export Evidence Report'}</button></div></div>
              {exportSuccess && <p className="field-hint" role="status">✓ {exportSuccess}</p>}
            </> : <div className="empty-state"><ClipboardList size={30}/><h3>{language === 'vi' ? 'Chọn source và tạo phiên điều tra' : 'Verify source and create an investigation'}</h3><p>{language === 'vi' ? 'Quay lại Explore để chọn và xác minh source, sau đó tạo phiên.' : 'Go to Explore to verify a source, then create a session.'}</p></div>}
          </div> : help ? <div className="panel guide"><span className="eyebrow">FILE INVESTIGATION TOOL</span><h2>{language === 'vi' ? 'Hướng dẫn sử dụng' : 'User guide'}</h2>
            {(language === 'vi' ? [
              ['1. Chọn nguồn','Dán đường dẫn tuyệt đối hoặc bấm Chọn thư mục, sau đó bấm Kiểm tra. Ứng dụng chỉ đọc file trong nguồn.'],
              ['2. Chọn công cụ','Tìm văn bản, regex, tên file, phần mở rộng, PHP symbol, TODO; hoặc tìm ảnh, file lớn, file rỗng, file mới sửa.'],
              ['3. Thiết lập bộ lọc','Chọn nhanh đuôi file hoặc nhập nhiều đuôi cách nhau bằng dấu phẩy. Thư mục ignore được tick sẽ không quét.'],
              ['4. Bấm Tìm kiếm','Kết quả chỉ xuất hiện sau khi tìm; có thể xem dòng code và số lần khớp theo từng file.'],
              ['5. PHP symbol','Tìm khai báo hàm/lớp theo mẫu văn bản. Để tìm các vị trí gọi, chọn tìm văn bản và nhập tên hàm.'],
              ['6. Xuất báo cáo','Bấm Xuất TXT hoặc Xuất MD. Chỉ chọn nơi lưu bên ngoài thư mục nguồn.'],
              ['7. Điều tra có bằng chứng','Tạo phiên điều tra theo source, chạy nhiều lần tìm, bấm Evidence + trên từng kết quả, ghi chú và xuất Evidence Report tại Investigations.'],
              ['8. Khi không tạo được phiên','Kiểm tra đường dẫn source tồn tại và là thư mục. Trong Explore chọn source, sau đó bấm Tạo phiên; hộp thoại sẽ xác minh source lại. Nếu không lưu được, xem thông báo lỗi dung lượng lưu trữ.'],
              ['9. Hiểu thống kê quét','filter = file bị loại theo bộ lọc, không phải lỗi; read_error = file không đọc được. Mở Chi tiết file bị bỏ qua và lỗi đọc để xem đường dẫn và nguyên nhân. truncated = kết quả chưa đầy đủ.'],
              ['10. Quy trình điều tra','Tạo phiên → tìm khai báo PHP → tìm tên hàm bằng Text → Evidence + trên từng kết quả → Investigations để ghi chú và xác minh → xuất Markdown ngay trong Investigations.'],
              ['11. Lưu ý an toàn','Không chọn nơi xuất báo cáo nằm trong source. Session được lưu trên thiết bị, có thể chứa code nhạy cảm; không dùng như bản backup duy nhất.'],
              ['Ví dụ','Tìm get_site_link: chọn PHP symbol → nhập get_site_link → Tìm kiếm → Xuất MD.']
            ] : [
              ['1. Choose a source','Paste an absolute directory path or browse, then validate it. Source files are read-only.'],
              ['2. Choose a tool','Search text, regex, filename, extension, PHP symbols, TODO, images, large, recent or empty files.'],
              ['3. Set filters','Use extension presets or comma-separated input. Checked ignored directories are skipped.'],
              ['4. Run Search','Results appear only after Search. Inspect file groups and line evidence.'],
              ['5. PHP symbols','Find textual definitions. For possible usages, switch to text search and enter the symbol name.'],
              ['6. Export','Export TXT or Markdown outside the source folder.'],
              ['7. Investigation workflow','Create a session for a verified source, run searches, pin evidence, add notes and export a structured Evidence Report.'],
              ['8. Session troubleshooting','Verify that the source path exists and is a directory. New session verifies the path again. Check the displayed storage error if persistence fails.'],
              ['9. Scan diagnostics','filter means excluded by filters; read_error means unreadable. Expand scan diagnostics for path and error. truncated means incomplete results.'],
              ['10. Full workflow','Create session → find PHP declaration → search usages with Text → Evidence + → review notes in Investigations → export Markdown in Investigations.'],
              ['11. Privacy','Export outside the source. Sessions contain source excerpts in local app storage; keep independent backups.'],
              ['Example','PHP symbol → get_site_link → Search → Export MD.']
            ]).map(([title,body]) => <section key={title}><h3>{title}</h3><p>{body}</p></section>)}
          </div> : <>
          <div className="panel search-panel">
            <div className="panel-heading"><div><span className="eyebrow">{t.investigate}</span><h2>{activeGroup.title}</h2><p>{selectedModeDescription} <span className="fit-help-tip" tabIndex={0} title={selectedModePlaceholder + (mode === 'php_symbol' ? (language === 'vi' ? ' — Chỉ là tìm mẫu, không phân giải quan hệ PHP thực.' : ' — Pattern matching, not full PHP symbol resolution.') : '')}>?</span></p></div></div>
            <div className="field full">
              <label>{t.sourceFolder}</label>
              <div className="folder-row">
                <input className="path-input" value={root} onChange={e => {setRoot(e.target.value); setValidatedRoot(''); setActiveSessionId(''); resetResultState();}} placeholder={language === 'vi' ? '/Users/name/projects/my-app hoặc C:\\projects\\app' : 'Enter an absolute folder path'} />
                <button className="btn secondary" onClick={chooseFolder}><FolderOpen size={17} /> {t.browse}</button>
                <button className="btn secondary verify-button" onClick={validateFolder} disabled={validating} title={language === 'vi' ? 'Kiểm tra thư mục' : 'Verify folder'} aria-label={language === 'vi' ? 'Kiểm tra thư mục' : 'Verify folder'}><FolderCheck size={17}/></button>
              </div>
              {fieldError === 'root' && error && <div className="inline-error" role="alert">{error}</div>}
              <div className="field-hint"><ShieldCheck size={14} /> {t.sourceHint} {validatedRoot && root === validatedRoot ? <strong> · ✓ {language === 'vi' ? 'Đường dẫn hợp lệ' : 'Valid folder'}</strong> : null}</div>
            </div>

            <div className="preset-toolbar"><label>{language === 'vi' ? 'Tìm nhanh theo tác vụ' : 'Quick search presets'}</label><select defaultValue="" onChange={e => { const p = presets[Number(e.target.value)]; if(p) applyPreset(p); e.currentTarget.value = ''; }}><option value="" disabled>{language === 'vi' ? 'Chọn preset (có thể chỉnh sửa sau)' : 'Select a preset (editable)'}</option>{presets.map((p,i)=><option key={i} value={i}>{p.name}</option>)}</select><span>{language === 'vi' ? 'Không cần nhớ lệnh hay regex.' : 'No commands to memorize.'}</span></div>
            <div className="search-query-row">
              <div className="field search-query-field">
                <label>{t.searchQuery}</label>
                {['text', 'regex', 'filename', 'php_symbol'].includes(mode) ? (
                  <div className="input-icon search-query-field"><Search size={17} /><input aria-label={language === 'vi' ? 'Nội dung cần tìm' : 'Search query'} value={query} onChange={(e) => { setQuery(e.target.value); if (fieldError === 'query') { setFieldError(null); setError(''); } }} onKeyDown={(e) => e.key === 'Enter' && runSearch()} placeholder={selectedModePlaceholder} /></div>
                ) : <div className="query-explanation">{selectedModeDescription}</div>}
                {fieldError === 'query' && error && <div className="inline-error" role="alert">{error}</div>}
              </div>
              <div className="field search-type-field"><label>{language === 'vi' ? 'Loại tìm kiếm' : 'Search type'}</label><select value={mode} onChange={e => switchMode(e.target.value as SearchMode)}>{navigationGroups.map(group => <optgroup key={group.title} label={group.title}>{group.modes.map(id => <option key={id} value={id}>{modeCopy[id][language][0]}</option>)}</optgroup>)}</select></div>
            </div>

            <div className="form-grid">{mode === 'large_files' && <div className="field"><label>{t.minSize}</label><input type="number" min="0" value={minSizeMb} onChange={(e) => setMinSizeMb(Number(e.target.value))} /><span className="field-note">{selectedModePlaceholder}</span></div>}</div>
            <div className="form-grid">{mode === 'recent_files' && <div className="field"><label>{t.recentDays}</label><input type="number" min="1" value={recentDays} onChange={(e) => setRecentDays(Number(e.target.value))} /><span className="field-note">{selectedModePlaceholder}</span></div>}</div>
            <details className="advanced-search"><summary>{language === 'vi' ? 'Tùy chọn tìm kiếm nâng cao (không bắt buộc)' : 'Advanced search options (optional)'}</summary><div className="form-grid">
              {!['images', 'large_files', 'recent_files', 'empty_files'].includes(mode) && (
                <div className="field"><label>{t.extensions}</label><input value={extensions} onChange={(e) => setExtensions(e.target.value)} placeholder={t.extensionsPlaceholder} /><div className="presets">{['php','js,ts,tsx,jsx','md,txt','json,yaml,yml','css,scss'].map(v => <button type="button" key={v} onClick={() => setExtensions(v)}>{v}</button>)}</div><span className="field-note">{t.extensionsHint}</span></div>
              )}
              {['text', 'regex', 'php_symbol', 'todo'].includes(mode) && <div className="field"><label>{t.contextLines}</label><input type="number" min="0" max="10" value={contextLines} onChange={(e) => setContextLines(Number(e.target.value))} /><span className="field-note">0–10 · {language === 'vi' ? 'Hiển thị thêm dòng trước/sau kết quả.' : 'Show nearby lines before/after each match.'}</span></div>}
            </div>

            <div className="options-block">
              <div className="options-title"><span>{t.ignoredDirectories}</span><small>{t.ignoredHint}</small></div>
              <div className="chips">{DEFAULT_IGNORES.map((name) => (
                <label className={`check-chip ${ignored.includes(name) ? 'checked' : ''}`} key={name} title={ignored.includes(name) ? (language === 'vi' ? 'Đang bỏ qua thư mục này' : 'This directory is currently ignored') : (language === 'vi' ? 'Thư mục này sẽ được quét' : 'This directory will be scanned')}>
                  <input type="checkbox" checked={ignored.includes(name)} onChange={() => toggleIgnore(name)} />
                  <span className="fake-check">{ignored.includes(name) && <CheckCircle2 size={15} />}</span>{name}
                </label>
              ))}</div>
            </div>

            {['text', 'filename', 'php_symbol'].includes(mode) && <div className="inline-options">
              <label><input type="checkbox" checked={caseSensitive} onChange={(e) => setCaseSensitive(e.target.checked)} /><CaseSensitive size={16} /> {t.caseSensitive}</label>
              <label><input type="checkbox" checked={exactMatch} onChange={(e) => setExactMatch(e.target.checked)} /> {t.exactMatch}</label>
            </div>}

            </details>
            <div className="session-strip"><span>{language === 'vi' ? 'Phiên điều tra' : 'Investigation'}:</span><select aria-label="Active investigation" value={activeSession?.id ?? ''} onChange={e => setActiveSessionId(e.target.value)}><option value="">{language === 'vi' ? 'Chưa chọn' : 'None'}</option>{sessions.filter(s => s.sourceRoot === validatedRoot && !!validatedRoot).map(s => <option key={s.id} value={s.id}>{s.title}</option>)}</select><button className="btn tertiary" onClick={showCreateSession}><Plus size={15}/> {language === 'vi' ? 'Tạo phiên' : 'New'}</button></div>
            {sessionError && <div className="inline-error" role="alert">{sessionError}</div>}
            <div className="mode-note">{t.resetNote}</div>
            {error && fieldError === "general" && <div className="error" role="alert"><X size={16} />{error}</div>}
            <div className="actions"><span className="search-live-status" role="status" aria-live="polite">{validating ? (language === 'vi' ? 'Đang xác minh thư mục…' : 'Validating folder…') : loading ? (language === 'vi' ? 'Đang quét…' : 'Scanning…') : result ? (result.truncated ? (language === 'vi' ? 'Hoàn tất có giới hạn' : 'Completed with limits') : (result.skippedReasons?.read_error || result.skippedReasons?.walk_error || result.skippedReasons?.metadata_error) ? (language === 'vi' ? 'Hoàn tất có lỗi đọc' : 'Completed with read errors') : (language === 'vi' ? 'Hoàn tất' : 'Completed')) : ''}</span><button className="btn primary" disabled={loading || validating} onClick={runSearch}>{loading ? <LoaderCircle className="spin" size={17} /> : <Search size={17} />}{loading ? t.scanning : t.search}</button></div>
          </div>

          {result && <div className="panel results-panel" ref={resultsRef}>
            <div className="results-toolbar">
              <div><h3>{t.results}</h3>{result ? <p>{result.filesMatched.toLocaleString()} {t.filesMatched} · {result.matches.length.toLocaleString()} {t.matches} · {result.filesScanned.toLocaleString()} {t.scanned} · {result.elapsedMs} ms {result.truncated ? (language === 'vi' ? ' · Đã giới hạn kết quả' : ' · Results truncated') : ''}</p> : <p>{t.runHint}</p>}</div>
              <div className="export-actions">
                {!activeSession && <button className="btn secondary" onClick={showCreateSession}><Plus size={15}/>{language === 'vi' ? 'Tạo phiên từ kết quả' : 'Create session from results'}</button>}
                <button className="btn tertiary" disabled={!result} onClick={() => exportReport('txt')} title={t.exportTxt}><Download size={15} /> {t.exportTxt}</button>
                <button className="btn tertiary" disabled={!result} onClick={() => exportReport('md')} title={t.exportMd}><FileDown size={15} /> {t.exportMd}</button>
              </div>
            </div>

            <div className="scan-stats" aria-label={language === 'vi' ? 'Thông tin phạm vi quét' : 'Scan coverage'}>
              <span>{language === 'vi' ? 'Đã quét' : 'Scanned'} <strong>{result.filesScanned.toLocaleString()}</strong></span>
              <span>{language === 'vi' ? 'Bỏ qua' : 'Skipped'} <strong>{result.filesSkipped.toLocaleString()}</strong></span>
              <span>{language === 'vi' ? 'Giới hạn' : 'Limit'} <strong>{result.truncated ? (language === 'vi' ? 'Đã chạm' : 'Reached') : (language === 'vi' ? 'Chưa chạm' : 'Not reached')}</strong></span>
              <span>{language === 'vi' ? 'Thời gian' : 'Elapsed'} <strong>{result.elapsedMs.toLocaleString()} ms</strong></span>
            </div>
            {result.skippedReasons && Object.values(result.skippedReasons).some(Boolean) && <details className="scan-diagnostics"><summary>{language === 'vi' ? 'Chi tiết file bị bỏ qua và lỗi đọc' : 'Skipped files and read errors'} ({result.filesSkipped})</summary><div className="scan-reasons">{Object.entries(result.skippedReasons).filter(([, n]) => n > 0).map(([key, n]) => <div key={key}><strong>{({filter: language === 'vi' ? 'Không khớp bộ lọc' : 'Excluded by filters',read_error:language === 'vi' ? 'Không đọc được nội dung' : 'Could not read file',walk_error:language === 'vi' ? 'Lỗi duyệt thư mục' : 'Directory traversal error',metadata_error:language === 'vi' ? 'Lỗi đọc metadata' : 'Metadata error',oversized:language === 'vi' ? 'Vượt giới hạn dung lượng' : 'File too large',per_file_limit:language === 'vi' ? 'Giới hạn 500 kết quả mỗi file' : '500 matches per file',binary_extension:language === 'vi' ? 'File nhị phân' : 'Binary file'} as Record<string,string>)[key] ?? key}: {n}</strong></div>)}</div>{result.scanIssues?.length ? <div className="scan-issues">{result.scanIssues.map((issue,i)=><div key={i}><strong>{issue.reason}</strong> · <code>{issue.path}</code><p>{issue.message}</p></div>)}</div> : null}{result.scanIssuesTruncated ? <p>{language === 'vi' ? 'Danh sách lỗi được giới hạn 100 mục.' : 'Error details are limited to 100 entries.'}</p> : null}</details>}
            <div className="result-filter-row"><Search size={15}/><input aria-label={language === 'vi' ? 'Lọc kết quả theo tên file' : 'Filter results by filename'} value={resultFilter} onChange={e => setResultFilter(e.target.value)} placeholder={language === 'vi' ? 'Lọc tên file trong kết quả (không quét lại)…' : 'Filter result filenames (no rescan)…'} /><span>{filteredGroups.length}/{grouped.length} files</span></div>
            {!result ? <div className="empty-state"><FileSearch size={36} /><h3>{t.readyTitle}</h3><p>{t.readyBody}</p></div> : filteredGroups.length === 0 ? <div className="empty-state"><Search size={36} /><h3>{t.noMatches}</h3><p>{t.noMatchesBody}</p></div> : (
              <div className="result-layout">
                <div className="file-list">{filteredGroups.length > 500 && <p className="skip-note">{language === 'vi' ? 'Đang hiển thị 500 file đầu tiên; lọc theo tên để thu hẹp.' : 'Showing first 500 files; filter by filename to narrow down.'}</p>}{filteredGroups.slice(0, 500).map(([path, matches]) => {
                  const isExpanded = expanded[path] ?? false;
                  return <div className={`file-group ${selectedFile === path ? 'selected' : ''}`} key={path}>
                    <button className="file-row" onClick={() => { setSelectedPath(path); setExpanded((s) => ({ ...s, [path]: !isExpanded })); }}>
                      {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}<FileCode2 size={16} /><span className="file-path">{path}</span><span className="count">{matches.length}</span>
                    </button>
                    {isExpanded && <div className="line-list">{matches.slice(0, 30).map((m, i) => <button key={`${m.lineNumber}-${i}`} onClick={() => setSelectedPath(path)}><span>{m.lineNumber ? `L${m.lineNumber}` : 'FILE'}</span>{m.line?.trim() || t.fileMatch}</button>)}</div>}
                  </div>;
                })}</div>
                <div className="preview">
                  <div className="preview-header"><div><span className="eyebrow">{t.preview}</span><strong title={selectedFile}>{selectedFile}</strong></div><div className="copy-actions"><button className="btn tertiary" disabled={!selectedMatches.length} onClick={() => copyPath(selectedMatches[0].path)} title="Copy absolute path"><Copy size={13}/> {language === 'vi' ? 'Đường dẫn' : 'Full path'}</button><button className="btn tertiary" disabled={!selectedFile} onClick={() => copyPath(selectedFile)} title="Copy relative path"><Copy size={13}/> Relative</button><span aria-live="polite">{copyFeedback && (copyFeedback === selectedFile || copyFeedback === selectedMatches[0]?.path) ? '✓' : ''}</span></div></div>
                  <div className="preview-body">{selectedMatches.map((match, index) => <article className="match-card" key={`${match.lineNumber}-${index}`}>
                    <div className="match-meta"><span>{match.lineNumber ? `${t.line} ${match.lineNumber}` : t.fileMatch}</span><div className="match-tools"><span>{formatBytes(match.fileSize)}</span><button className="btn tertiary" disabled={!!activeSession && activeSession.evidence.some(e => e.id === evidenceId(match, result.mode, result.query))} onClick={() => activeSession ? pinEvidence(match) : showCreateSession()} title={language === 'vi' ? 'Thêm vào bằng chứng' : 'Add to evidence'}><Pin size={13}/>{activeSession?.evidence.some(e => e.id === evidenceId(match, result.mode, result.query)) ? 'Added' : 'Evidence +'}</button></div></div>
                    {match.before.map((line, i) => <pre className="context" key={`b-${i}`}><HighlightedLine line={line} path={match.relativePath}/></pre>)}
                    {match.line && <pre className="hit"><HighlightedLine line={match.line} path={match.relativePath}/></pre>}
                    {match.after.map((line, i) => <pre className="context" key={`a-${i}`}><HighlightedLine line={line} path={match.relativePath}/></pre>)}
                  </article>)}</div>
                </div>
              </div>
            )}
          </div>}
          <footer className="app-footer"><div className="footer-slogan">Find faster. Investigate smarter. Report with evidence.</div><div className="footer-translation">{language === 'vi' ? 'Tìm nhanh hơn. Điều tra thông minh hơn. Báo cáo có bằng chứng.' : 'Tìm nhanh hơn. Điều tra thông minh hơn. Báo cáo có bằng chứng.'}</div><div className="footer-values"><span>{language === 'vi' ? 'Tìm kiếm hiệu quả' : 'Efficient Search'}</span><span>{language === 'vi' ? 'Quản lý bằng chứng' : 'Evidence Management'}</span><span>{language === 'vi' ? 'Báo cáo chuyên nghiệp' : 'Structured Reporting'}</span></div><div>© {new Date().getFullYear()} TuanTQ · File Investigation Tool · v0.4.9 RC</div></footer>
          </>}
          {sessionDialog && <div className="fit-dialog-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setSessionDialog(false); }} onKeyDown={e => { if (e.key === 'Escape') setSessionDialog(false); }}>
            <form className="fit-dialog" role="dialog" aria-modal="true" aria-labelledby="new-session-title" onSubmit={e => { e.preventDefault(); void createSession(); }}>
              <h2 id="new-session-title">{language === 'vi' ? 'Tạo phiên điều tra' : 'New investigation'}</h2>
              <p>{language === 'vi' ? 'Mỗi phiên lưu các lượt tìm kiếm, bằng chứng và kết luận cho một source.' : 'Each investigation stores searches, evidence and findings for one source.'}</p>
              <label htmlFor="session-source">{t.sourceFolder}</label>
              <input id="session-source" value={root} onChange={e => { setRoot(e.target.value); setValidatedRoot(''); }} placeholder="/path/to/source" required />
              <label htmlFor="session-title-input">{language === 'vi' ? 'Tên phiên' : 'Investigation title'}</label>
              <input id="session-title-input" autoFocus maxLength={160} value={sessionTitle} onChange={e => setSessionTitle(e.target.value)} required />
              {sessionError && <div role="alert" className="inline-error">{sessionError}</div>}
              <div className="actions"><button type="button" className="btn secondary" onClick={() => setSessionDialog(false)}>{language === 'vi' ? 'Hủy' : 'Cancel'}</button><button type="submit" className="btn primary" disabled={creatingSession}>{creatingSession ? '...' : (language === 'vi' ? 'Xác minh và tạo phiên' : 'Verify and create')}</button></div>
            </form>
          </div>}
        </section>
      </section>
    </main>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
