/* ═══════════════════════════════════════════════════════════
   XYLO STUDIO — KEYBOARD SHORTCUTS
   
   Global shortcuts that work across the whole app. Editor-level
   shortcuts (comment toggle, tab indent) live in editor.js
   because CodeMirror manages them.
   
   Shortcuts only fire on desktop. On mobile, the on-screen
   buttons handle everything.
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  let findOpen = false;

  function init() {
    document.addEventListener('keydown', onKeyDown);
  }

  function isTypingContext(target) {
    if (!target) return false;
    const tag = target.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
  }

  function onKeyDown(e) {
    const mod = e.ctrlKey || e.metaKey;
    const key = e.key;

    /* ── Modifier combos ─────────────────────────────────── */

    // Ctrl/Cmd + S — Save
    if (mod && (key === 's' || key === 'S')) {
      e.preventDefault();
      if (window.XyloApp) window.XyloApp.saveActiveFile();
      return;
    }

    // Ctrl/Cmd + N — New file
    if (mod && (key === 'n' || key === 'N')) {
      e.preventDefault();
      if (window.XyloProjects) window.XyloProjects.promptNewFile();
      return;
    }

    // Ctrl/Cmd + O — New project
    if (mod && (key === 'o' || key === 'O')) {
      e.preventDefault();
      if (window.XyloApp) window.XyloApp.openModal('modal-new');
      return;
    }

    // Ctrl/Cmd + K — Open settings
    if (mod && (key === 'k' || key === 'K')) {
      e.preventDefault();
      if (window.XyloApp) window.XyloApp.openModal('modal-settings');
      return;
    }

    // Ctrl/Cmd + B — Toggle sidebar
    if (mod && (key === 'b' || key === 'B')) {
      e.preventDefault();
      if (window.XyloApp) window.XyloApp.toggleSidebar();
      return;
    }

    // Ctrl/Cmd + J — Toggle console
    if (mod && (key === 'j' || key === 'J')) {
      e.preventDefault();
      if (window.XyloApp) window.XyloApp.toggleConsole();
      return;
    }

    // Ctrl/Cmd + P — Toggle preview
    if (mod && (key === 'p' || key === 'P')) {
      e.preventDefault();
      if (window.XyloApp) window.XyloApp.togglePreview();
      return;
    }

    // Ctrl/Cmd + G — Go to line
    if (mod && (key === 'g' || key === 'G')) {
      e.preventDefault();
      if (window.XyloApp) window.XyloApp.promptGoToLine();
      return;
    }

    // Ctrl/Cmd + / — handled by CodeMirror inside the editor
    // Ctrl/Cmd + F — handled by CodeMirror inside the editor

    /* ── F-keys ──────────────────────────────────────────── */

    // F5 — Run
    if (key === 'F5') {
      e.preventDefault();
      if (window.XyloApp) window.XyloApp.run();
      return;
    }

    // Shift + F5 — Run file only
    if (e.shiftKey && key === 'F5') {
      e.preventDefault();
      if (window.XyloApp) window.XyloApp.runFile();
      return;
    }

    /* ── Escape ──────────────────────────────────────────── */

    if (key === 'Escape') {
      // Close any open modal
      const openModal = document.querySelector('.modal-bg.open');
      if (openModal) {
        openModal.classList.remove('open');
        return;
      }
      // Close find bar
      if (findOpen) {
        closeFind();
        return;
      }
    }

    /* ── Plain keys (only when not typing) ───────────────── */

    if (isTypingContext(e.target)) return;

    // / — Open find
    if (key === '/') {
      e.preventDefault();
      openFind();
      return;
    }
  }

  /* ─── Find bar ────────────────────────────────────────── */
  function openFind() {
    const bar = document.getElementById('findbar');
    if (!bar) return;
    bar.classList.remove('hidden');
    findOpen = true;
    const input = document.getElementById('find-input');
    if (input) { input.focus(); input.select(); }
  }

  function closeFind() {
    const bar = document.getElementById('findbar');
    if (!bar) return;
    bar.classList.add('hidden');
    findOpen = false;
    const info = document.getElementById('find-info');
    if (info) info.textContent = '';
    if (window.XyloEditor) window.XyloEditor.focus();
  }

  function isFindOpen() { return findOpen; }

  window.XyloShortcuts = {
    init,
    openFind,
    closeFind,
    isFindOpen,
  };
})();
