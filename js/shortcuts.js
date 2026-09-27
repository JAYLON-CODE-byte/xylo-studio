/* ═══════════════════════════════════════════════════════════
   XYLO STUDIO — KEYBOARD SHORTCUTS
   
   Desktop shortcuts. Mobile uses on-screen buttons.
   
   NOTE ON RESERVED KEYS:
   Ctrl+N and Ctrl+O are browser-reserved (new window / open
   file) and CANNOT be captured. We use Alt+N and Alt+P instead.
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

  function blurAndRefocus() {
    // Move focus out of any button so Space doesn't re-trigger it
    if (document.activeElement && document.activeElement.blur) {
      document.activeElement.blur();
    }
    if (window.XyloEditor) window.XyloEditor.focus();
  }

  function onKeyDown(e) {
    const mod = e.ctrlKey || e.metaKey;
    const alt = e.altKey;
    const key = e.key;

    /* ── Ctrl / Cmd combos ───────────────────────────────── */

    // Ctrl+S — Save
    if (mod && !alt && (key === 's' || key === 'S')) {
      e.preventDefault();
      if (window.XyloApp) window.XyloApp.saveActiveFile();
      return;
    }

    // Ctrl+K — Settings
    if (mod && !alt && (key === 'k' || key === 'K')) {
      e.preventDefault();
      if (window.XyloApp) window.XyloApp.openModal('modal-settings');
      blurAndRefocus();
      return;
    }

    // Ctrl+B — Toggle sidebar
    if (mod && !alt && (key === 'b' || key === 'B')) {
      e.preventDefault();
      if (window.XyloApp) window.XyloApp.toggleSidebar();
      blurAndRefocus();
      return;
    }

    // Ctrl+J — Toggle console
    if (mod && !alt && (key === 'j' || key === 'J')) {
      e.preventDefault();
      if (window.XyloApp) window.XyloApp.toggleConsole();
      blurAndRefocus();
      return;
    }

    // Ctrl+P — Toggle preview
    if (mod && !alt && (key === 'p' || key === 'P')) {
      e.preventDefault();
      if (window.XyloApp) window.XyloApp.togglePreview();
      blurAndRefocus();
      return;
    }

    // Ctrl+G — Go to line
    if (mod && !alt && (key === 'g' || key === 'G')) {
      e.preventDefault();
      if (window.XyloApp) window.XyloApp.promptGoToLine();
      return;
    }

    /* ── Alt combos (browser-safe) ───────────────────────── */

    // Alt+N — New file
    if (alt && !mod && (key === 'n' || key === 'N')) {
      e.preventDefault();
      if (window.XyloApp) window.XyloApp.promptNewFile();
      return;
    }

    // Alt+P — New project
    if (alt && !mod && (key === 'p' || key === 'P')) {
      e.preventDefault();
      if (window.XyloApp) window.XyloApp.openModal('modal-new');
      return;
    }

    // Alt+F — Format active file
    if (alt && !mod && (key === 'f' || key === 'F')) {
      e.preventDefault();
      if (window.XyloEditor && window.XyloEditor.formatActiveFile()) {
        if (window.XyloApp) window.XyloApp.toast('Formatted');
      } else {
        if (window.XyloApp) window.XyloApp.toast('Nothing to format here', true);
      }
      return;
    }

    /* ── F-keys ──────────────────────────────────────────── */

    if (key === 'F5') {
      e.preventDefault();
      if (e.shiftKey) {
        if (window.XyloApp) window.XyloApp.runFile();
      } else {
        if (window.XyloApp) window.XyloApp.run();
      }
      return;
    }

    /* ── Escape ──────────────────────────────────────────── */

    if (key === 'Escape') {
      const openModal = document.querySelector('.modal-bg.open');
      if (openModal) {
        openModal.classList.remove('open');
        return;
      }
      if (findOpen) {
        closeFind();
        return;
      }
    }

    /* ── Plain keys ──────────────────────────────────────── */

    if (isTypingContext(e.target)) return;

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
