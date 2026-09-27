/* ═══════════════════════════════════════════════════════════
   XYLO STUDIO — EDITOR
   
   CodeMirror 5 instance, managed centrally. Exposes a clean API
   so the rest of the app never touches CodeMirror directly.
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  let cm = null;                 // CodeMirror instance
  let currentFile = null;        // filename currently open
  let onChangeCallback = null;   // function(filename, content)
  let onCursorCallback = null;   // function(line, col)

  /* ─── Settings defaults ───────────────────────────────── */
  const settings = {
    theme: 'xylo-dark',
    fontSize: 13,
    tabSize: 2,
    lineNumbers: true,
    lineWrapping: false,
    styleActiveLine: true,
    autoCloseBrackets: true,
    foldGutter: true,
  };

  /* ─── Init ────────────────────────────────────────────── */
  function init() {
    const mount = document.getElementById('editor-mount');
    if (!mount) return;

    cm = CodeMirror(mount, {
      value: '',
      mode: null,
      theme: settings.theme,
      lineNumbers: settings.lineNumbers,
      tabSize: settings.tabSize,
      indentUnit: settings.tabSize,
      indentWithTabs: false,
      lineWrapping: settings.lineWrapping,
      styleActiveLine: settings.styleActiveLine,
      autoCloseBrackets: settings.autoCloseBrackets,
      autoCloseTags: true,
      matchBrackets: true,
      foldGutter: settings.foldGutter,
      gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
      extraKeys: {
        'Ctrl-/': 'toggleComment',
        'Cmd-/': 'toggleComment',
        'Ctrl-F': () => { if (window.XyloShortcuts) window.XyloShortcuts.openFind(); },
        'Cmd-F': () => { if (window.XyloShortcuts) window.XyloShortcuts.openFind(); },
        'Ctrl-Enter': () => { if (window.XyloApp) window.XyloApp.run(); },
        'Cmd-Enter': () => { if (window.XyloApp) window.XyloApp.run(); },
        'Ctrl-S': (e) => { e.preventDefault(); saveCurrentFile(); },
        'Cmd-S': (e) => { e.preventDefault(); saveCurrentFile(); },
        'Tab': (c) => c.execCommand('indentMore'),
        'Shift-Tab': (c) => c.execCommand('indentLess'),
      },
    });

    cm.on('change', () => {
      if (currentFile && onChangeCallback) {
        onChangeCallback(currentFile, cm.getValue());
      }
    });

    cm.on('cursorActivity', () => {
      if (onCursorCallback) {
        const pos = cm.getCursor();
        onCursorCallback(pos.line + 1, pos.ch + 1);
      }
    });

    return cm;
  }

  function saveCurrentFile() {
    // Triggered by Ctrl+S — the app handles actual persistence
    if (currentFile && onChangeCallback) {
      onChangeCallback(currentFile, cm.getValue());
      if (window.XyloToast) window.XyloToast.show('Saved');
    }
  }

  /* ─── Load file into editor ───────────────────────────── */
  function loadFile(filename, content) {
    if (!cm) return;
    currentFile = filename;
    cm.setValue(content || '');
    const mode = window.XyloIcons.getCodeMirrorMode(filename);
    cm.setOption('mode', mode || null);
    cm.clearHistory();
    cm.refresh();
  }

  function close() {
    if (!cm) return;
    currentFile = null;
    cm.setValue('');
    cm.setOption('mode', null);
  }

  /* ─── Get / set content ───────────────────────────────── */
  function getContent() {
    return cm ? cm.getValue() : '';
  }

  function setContent(value) {
    if (cm) cm.setValue(value || '');
  }

  function focus() {
    if (cm) cm.focus();
  }

  function refresh() {
    if (cm) cm.refresh();
  }

  function getFile() {
    return currentFile;
  }

  /* ─── Callbacks ───────────────────────────────────────── */
  function onChange(fn) { onChangeCallback = fn; }
  function onCursor(fn) { onCursorCallback = fn; }

  /* ─── Apply settings ──────────────────────────────────── */
  function applySettings(next) {
    Object.assign(settings, next);
    if (!cm) return;
    cm.setOption('theme', settings.theme);
    cm.setOption('lineNumbers', settings.lineNumbers);
    cm.setOption('tabSize', settings.tabSize);
    cm.setOption('indentUnit', settings.tabSize);
    cm.setOption('lineWrapping', settings.lineWrapping);
    cm.setOption('styleActiveLine', settings.styleActiveLine);
    cm.setOption('autoCloseBrackets', settings.autoCloseBrackets);
    cm.setOption('foldGutter', settings.foldGutter);
    document.documentElement.style.setProperty('--efs', settings.fontSize + 'px');
    document.querySelectorAll('.CodeMirror').forEach(el => {
      el.style.fontSize = settings.fontSize + 'px';
    });
    cm.refresh();
  }

  function getSettings() { return { ...settings }; }

  /* ─── Find / Replace helpers ──────────────────────────── */
  function search(query, startFromCursor) {
    if (!cm || !query) return null;
    const start = startFromCursor ? cm.getCursor('to') : { line: 0, ch: 0 };
    const cursor = cm.getSearchCursor(query, start, { caseFold: true });
    if (cursor.findNext()) return { from: cursor.from(), to: cursor.to() };
    return null;
  }

  function searchBackward(query) {
    if (!cm || !query) return null;
    const cursor = cm.getSearchCursor(query, cm.getCursor('from'), { caseFold: true });
    if (cursor.findPrevious()) return { from: cursor.from(), to: cursor.to() };
    return null;
  }

  function selectRange(from, to) {
    if (!cm) return;
    cm.setSelection(from, to);
    cm.scrollIntoView({ from, to }, 80);
  }

  function replaceSelection(text) {
    if (cm) cm.replaceSelection(text);
  }

  function replaceAll(query, replacement) {
    if (!cm || !query) return 0;
    let count = 0;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(escaped, 'gi');
    const value = cm.getValue();
    const next = value.replace(re, () => { count++; return replacement; });
    if (count > 0) cm.setValue(next);
    return count;
  }

  function getLineCount() {
    return cm ? cm.lineCount() : 0;
  }

  function goToLine(line) {
    if (!cm) return;
    const clamped = Math.max(1, Math.min(cm.lineCount(), line));
    cm.setCursor({ line: clamped - 1, ch: 0 });
    cm.scrollIntoView({ line: clamped - 1, ch: 0 }, 80);
    cm.focus();
  }

  function formatActiveFile() {
    if (!cm || !currentFile) return false;
    const ext = window.XyloIcons.getExtension(currentFile);
    const value = cm.getValue();
    let formatted = null;
    try {
      const opts = {
        indent_size: settings.tabSize,
        indent_char: ' ',
        max_preserve_newlines: 2,
        wrap_line_length: 0,
        end_with_newline: true,
      };
      if (['html', 'htm', 'vue', 'svelte'].includes(ext) && window.html_beautify) {
        formatted = window.html_beautify(value, opts);
      } else if (['css', 'scss', 'sass'].includes(ext) && window.css_beautify) {
        formatted = window.css_beautify(value, opts);
      } else if (['js', 'mjs', 'cjs', 'jsx', 'ts', 'tsx', 'json'].includes(ext) && window.js_beautify) {
        formatted = window.js_beautify(value, opts);
      }
    } catch (err) { return false; }
    if (formatted && formatted !== value) {
      cm.setValue(formatted);
      return true;
    }
    return false;
  }

  /* ─── Public API ──────────────────────────────────────── */
  window.XyloEditor = {
    init,
    loadFile,
    close,
    getContent,
    setContent,
    getFile,
    focus,
    refresh,
    onChange,
    onCursor,
    applySettings,
    getSettings,
    search,
    searchBackward,
    selectRange,
    replaceSelection,
    replaceAll,
    getLineCount,
    goToLine,
    formatActiveFile,
  };
})();
