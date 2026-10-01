/* ═══════════════════════════════════════════════════════════
   XYLO STUDIO — APP
   
   Wires everything together. Owns the UI. Talks to projects,
   editor, and shortcuts through their public APIs.
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

   /* ─── SAMPLE PROJECTS (loaded from samples.js) ────────── */
  const SAMPLES = (window.XyloSamples && window.XyloSamples.SAMPLES) || [];

  const ICON_CHOICES = [
    '⚡', '🚀', '🌐', '💻', '🎮', '🤖', '🎨', '🔥',
    '🛸', '🎵', '📱', '💡', '🔬', '🌟', '🏆', '🎯',
  ];

  let selectedIcon = '⚡';
   
  /* ─── Icon renderer ──────────────────────────────────── */
  function renderIconHTML(icon) {
    if (!icon) return '⚡';
    // Lucide names are kebab-case: 'gamepad-2', 'check-square'
    if (/^[a-z][a-z0-9-]*$/.test(icon)) {
      return '<i data-lucide="' + icon + '"></i>';
    }
    // Otherwise it's an emoji
    return '<span class="proj-emoji">' + icon + '</span>';
  }

  /* ─── Toast ───────────────────────────────────────────── */
  let toastTimer = null;
  function toast(message, isError) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = message;
    el.classList.toggle('error', !!isError);
    el.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  }

  /* ─── Modals ──────────────────────────────────────────── */
  function openModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('open');
    el.setAttribute('aria-hidden', 'false');
    if (id === 'modal-new') {
      const input = document.getElementById('np-name');
      if (input) { input.value = ''; input.focus(); }
    }
  }

  function closeModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('open');
    el.setAttribute('aria-hidden', 'true');
  }

  function confirmModal(message, onConfirm, okLabel) {
    const el = document.getElementById('modal-confirm');
    const msg = document.getElementById('confirm-message');
    const ok = document.getElementById('confirm-ok');
    const cancel = document.getElementById('confirm-cancel');
    if (!el || !msg || !ok || !cancel) return;
    msg.textContent = message;
    ok.textContent = okLabel || 'Confirm';
    el.classList.add('open');
    el.setAttribute('aria-hidden', 'false');

    const cleanup = () => {
      el.classList.remove('open');
      el.setAttribute('aria-hidden', 'true');
      ok.removeEventListener('click', onOk);
      cancel.removeEventListener('click', onCancel);
    };
    const onOk = () => { cleanup(); onConfirm(); };
    const onCancel = () => cleanup();
    ok.addEventListener('click', onOk);
    cancel.addEventListener('click', onCancel);
  }

  /* ─── Sidebar panels ──────────────────────────────────── */
  function setPanel(name) {
    document.querySelectorAll('.side-panel').forEach(p => {
      p.classList.toggle('active', p.dataset.panel === name);
    });
    document.querySelectorAll('.act-item[data-act]').forEach(b => {
      b.classList.toggle('active', b.dataset.act === name);
    });
  }

  /* ─── Render project list ─────────────────────────────── */
  function renderProjects() {
    const list = document.getElementById('projects-list');
    if (!list) return;
    const all = window.XyloProjects.getAll();
    if (!all.length) {
      list.innerHTML = `
        <div class="placeholder-block">
          <i data-lucide="folder"></i>
          <p>No projects yet.</p>
          <p class="muted">Create your first project to get started.</p>
        </div>`;
      window.XyloIcons.refresh();
      return;
    }
    list.innerHTML = '';
    all.forEach(p => {
      const item = document.createElement('div');
      item.className = 'proj-item' + (p.id === window.XyloProjects.getActiveId() ? ' active' : '');
      item.innerHTML = `
        <div class="proj-icon">${renderIconHTML(p.icon)}</div>
        <div class="proj-info">
          <div class="proj-name">${escapeHtml(p.name)}</div>
          <div class="proj-meta">${Object.keys(p.files).length} file${Object.keys(p.files).length === 1 ? '' : 's'}</div>
        </div>
        <button class="proj-del" title="Delete project">
          <i data-lucide="x"></i>
        </button>`;
      item.addEventListener('click', (e) => {
        if (e.target.closest('.proj-del')) return;
        openProject(p.id);
      });
      const delBtn = item.querySelector('.proj-del');
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        confirmModal(`Delete "${p.name}"? This can't be undone.`, () => {
          window.XyloProjects.remove(p.id);
          renderProjects();
          if (!window.XyloProjects.getActiveId()) closeProjectView();
        }, 'Delete');
      });
      list.appendChild(item);
    });
    window.XyloIcons.refresh();
  }

  /* ─── Render file list ────────────────────────────────── */
  function renderFiles() {
    const list = document.getElementById('files-list');
    const title = document.getElementById('files-project-name');
    if (!list) return;
    const p = window.XyloProjects.getActive();
    if (!p) { list.innerHTML = ''; return; }
    if (title) title.textContent = p.name;

    const files = window.XyloProjects.listFiles();
    list.innerHTML = '';
    files.forEach(fn => {
      const item = document.createElement('div');
      item.className = 'file-item' + (fn === window.XyloProjects.getActiveFile() ? ' active' : '');
      const iconEl = window.XyloIcons.getIconElement(fn);
      const iconWrap = document.createElement('div');
      iconWrap.className = 'file-icon';
      iconWrap.appendChild(iconEl);
      const nameEl = document.createElement('span');
      nameEl.className = 'file-name';
      nameEl.textContent = fn;
      const del = document.createElement('button');
      del.className = 'file-del';
      del.title = 'Delete file';
      del.innerHTML = '<i data-lucide="x"></i>';
      item.appendChild(iconWrap);
      item.appendChild(nameEl);
      item.appendChild(del);

      item.addEventListener('click', (e) => {
        if (e.target.closest('.file-del')) return;
        openFile(fn);
      });
      del.addEventListener('click', (e) => {
        e.stopPropagation();
        confirmModal(`Delete "${fn}"?`, () => {
          window.XyloProjects.removeFile(fn);
          renderFiles();
          renderTabs();
          const active = window.XyloProjects.getActiveFile();
          if (active) openFile(active);
          else closeEditorView();
        }, 'Delete');
      });
      list.appendChild(item);
    });
    window.XyloIcons.refresh();
  }

  /* ─── Render tabs ─────────────────────────────────────── */
  function renderTabs() {
    const tabs = document.getElementById('tabs');
    if (!tabs) return;
    const files = window.XyloProjects.listFiles();
    const active = window.XyloProjects.getActiveFile();
    tabs.innerHTML = '';
    files.forEach(fn => {
      const tab = document.createElement('div');
      tab.className = 'tab' + (fn === active ? ' active' : '');
      const iconEl = window.XyloIcons.getIconElement(fn);
      const iconWrap = document.createElement('div');
      iconWrap.className = 'tab-icon';
      iconWrap.appendChild(iconEl);
      const name = document.createElement('span');
      name.className = 'tab-name';
      name.textContent = fn;
      const close = document.createElement('button');
      close.className = 'tab-close';
      close.title = 'Close';
      close.innerHTML = '<i data-lucide="x"></i>';
      tab.appendChild(iconWrap);
      tab.appendChild(name);
      tab.appendChild(close);
      tab.addEventListener('click', (e) => {
        if (e.target.closest('.tab-close')) return;
        openFile(fn);
      });
      close.addEventListener('click', (e) => {
        e.stopPropagation();
        confirmModal(`Delete "${fn}"?`, () => {
          window.XyloProjects.removeFile(fn);
          renderFiles();
          renderTabs();
          const next = window.XyloProjects.getActiveFile();
          if (next) openFile(next);
          else closeEditorView();
        }, 'Delete');
      });
      tabs.appendChild(tab);
    });
    window.XyloIcons.refresh();
  }

    /* ─── Render samples ──────────────────────────────────── */
  function renderSamples() {
    const list = document.getElementById('samples-list');
    const welcomeGrid = document.getElementById('welcome-samples-grid');

    const buildCard = (s, forSidebar) => {
      const card = document.createElement('div');
      card.className = forSidebar ? 'sample-item' : 'sample-card';
      if (forSidebar) {
        card.innerHTML = `
          <div class="sample-item-title">${s.title}</div>
          <div class="sample-item-desc">${s.desc}</div>`;
      } else {
        card.innerHTML = `
          <div class="sample-card-icon">${renderIconHTML(s.icon)}</div>
          <div class="sample-card-title">${s.title}</div>
          <div class="sample-card-desc">${s.desc}</div>`;
      }
      card.addEventListener('click', () => loadSample(s.id));
      return card;
    };

    if (list) {
      list.innerHTML = '';
      SAMPLES.forEach(s => list.appendChild(buildCard(s, true)));
    }
    if (welcomeGrid) {
      welcomeGrid.innerHTML = '';
      SAMPLES.forEach(s => welcomeGrid.appendChild(buildCard(s, false)));
    }
    window.XyloIcons.refresh();
  }

  /* ─── Load a sample as a new project ──────────────────── */
  function loadSample(sampleId) {
    const sample = SAMPLES.find(s => s.id === sampleId);
    if (!sample) return;
    const p = window.XyloProjects.create(sample.title, sample.type, sample.icon);
    // Replace the template files with the sample's actual files
    Object.keys(sample.files).forEach(fn => {
      p.files[fn] = sample.files[fn];
    });
    window.XyloProjects.persist();
    openProject(p.id);
    toast('Loaded: ' + sample.title);
    // Auto-open preview if it's a web project
    if (Object.keys(sample.files).some(f => f.endsWith('.html'))) {
      openPreview();
    }
  }
  /* ─── Open / close views ──────────────────────────────── */
  function openProject(id) {
    const p = window.XyloProjects.open(id);
    if (!p) return;
    setPanel('files');
    renderFiles();
    renderTabs();
    const active = window.XyloProjects.getActiveFile();
    if (active) openFile(active);
    else closeEditorView();
    updateStatus();
    updateCrumb();
  }

  function closeProjectView() {
    window.XyloProjects.close();
    renderProjects();
    renderFiles();
    renderTabs();
    closeEditorView();
    setPanel('projects');
    updateStatus();
    updateCrumb();
  }

  function openFile(filename) {
    window.XyloProjects.setActiveFile(filename);
    const content = window.XyloProjects.getFileContent(filename);
    if (content === null) return;
    window.XyloEditor.loadFile(filename, content);
    document.getElementById('welcome').classList.add('hidden');
    document.getElementById('editor-ui').classList.remove('hidden');
    renderFiles();
    renderTabs();
    updateStatus();
    updateCrumb();
  }

  function closeEditorView() {
    window.XyloEditor.close();
    document.getElementById('editor-ui').classList.add('hidden');
    document.getElementById('welcome').classList.remove('hidden');
    updateStatus();
    updateCrumb();
  }

  /* ─── Status + crumb ──────────────────────────────────── */
  function updateStatus(line, col) {
    const p = window.XyloProjects.getActive();
    const f = window.XyloProjects.getActiveFile();
    document.getElementById('status-project').textContent = p ? p.name : 'No Project';
    document.getElementById('status-lang').textContent = f ? window.XyloIcons.getLangLabel(f) : '—';
    document.getElementById('status-files').textContent = p ? `${window.XyloProjects.listFiles().length} files` : '0 files';
    if (line !== undefined && col !== undefined) {
      document.getElementById('status-cursor').textContent = `Ln ${line}, Col ${col}`;
    } else {
      document.getElementById('status-cursor').textContent = 'Ln 1, Col 1';
    }
  }

  function updateCrumb() {
    const crumb = document.getElementById('tb-crumb');
    if (!crumb) return;
    const p = window.XyloProjects.getActive();
    const f = window.XyloProjects.getActiveFile();
    if (!p) { crumb.textContent = ''; return; }
    const iconHTML = renderIconHTML(p.icon);
    const cleanIcon = /^[a-z][a-z0-9-]*$/.test(p.icon) ? '' : (p.icon || '');
    crumb.innerHTML = cleanIcon + ' ' + escapeHtml(p.name) + (f ? ' › ' + escapeHtml(f) : '');
    // Re-render Lucide icons in the crumb
    window.XyloIcons.refresh();
  }
  /* ─── Preview ─────────────────────────────────────────── */
  function buildPreviewHTML() {
    const p = window.XyloProjects.getActive();
    if (!p) return null;
    const files = Object.keys(p.files);

    const htmlFile =
      ['index.html', 'index.htm'].find(f => p.files[f]) ||
      files.find(f => f.endsWith('.html') || f.endsWith('.htm'));

    if (!htmlFile) return null;

    let html = p.files[htmlFile];

    // Inline <link rel="stylesheet" href="...">
    html = html.replace(/<link[^>]*href=["']([^"']+)["'][^>]*>/gi, (match, href) => {
      if (p.files[href]) return '<style>\n' + p.files[href] + '\n</style>';
      return match;
    });

    // Inline <script src="..."></script>
    html = html.replace(/<script[^>]*src=["']([^"']+)["'][^>]*><\/script>/gi, (match, src) => {
      if (p.files[src]) return '<script>\n' + p.files[src] + '\n<\/script>';
      return match;
    });

    // Inject console interceptor so logs reach the XYLO console panel
    const interceptor = '<script>\n' +
      '(function(){\n' +
      '  var _orig = { log: console.log, error: console.error, warn: console.warn, info: console.info };\n' +
      '  function emit(type, args) {\n' +
      '    try {\n' +
      '      var text = Array.prototype.map.call(args, function(a) {\n' +
      '        if (a === null) return "null";\n' +
      '        if (a === undefined) return "undefined";\n' +
      '        if (typeof a === "object") { try { return JSON.stringify(a); } catch(e) { return String(a); } }\n' +
      '        return String(a);\n' +
      '      }).join(" ");\n' +
      '      parent.postMessage({ source: "xylo-preview", type: type, text: text }, "*");\n' +
      '    } catch(e) {}\n' +
      '  }\n' +
      '  console.log = function(){ _orig.log.apply(console, arguments); emit("log", arguments); };\n' +
      '  console.error = function(){ _orig.error.apply(console, arguments); emit("error", arguments); };\n' +
      '  console.warn = function(){ _orig.warn.apply(console, arguments); emit("warn", arguments); };\n' +
      '  console.info = function(){ _orig.info.apply(console, arguments); emit("info", arguments); };\n' +
      '  window.addEventListener("error", function(e){\n' +
      '    emit("error", [e.message + " (line " + e.lineno + ")"]);\n' +
      '  });\n' +
      '})();\n' +
      '<\/script>';

    html = html.replace(/<head>/i, '<head>' + interceptor);
    return html;
  }

  function openPreview() {
    const html = buildPreviewHTML();
    if (!html) {
      toast('No HTML file to preview', true);
      return;
    }
    const rp = document.getElementById('right-panel');
    const frame = document.getElementById('preview-frame');
    if (!rp || !frame) return;
    rp.classList.remove('hidden');
    frame.srcdoc = html;
    window.XyloEditor.refresh();
    const consoleEl = document.getElementById('console');
    if (consoleEl) consoleEl.classList.remove('hidden');
  }

  function togglePreview() {
    const rp = document.getElementById('right-panel');
    if (!rp) return;
    if (rp.classList.contains('hidden')) {
      openPreview();
    } else {
      rp.classList.add('hidden');
      window.XyloEditor.refresh();
    }
  }

  function openPreviewInNewTab() {
    const html = buildPreviewHTML();
    if (!html) {
      toast('No HTML file to preview', true);
      return;
    }
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (!win) {
      toast('Popup blocked — allow popups for this site', true);
      URL.revokeObjectURL(url);
      return;
    }
    setTimeout(function () { URL.revokeObjectURL(url); }, 30000);
  }

  /* ─── Actions ─────────────────────────────────────────── */
    function run() {
    const p = window.XyloProjects.getActive();
    if (!p) { toast('Open a project first', true); return; }
    const hasHtml = Object.keys(p.files).some(f => f.endsWith('.html') || f.endsWith('.htm'));
    if (hasHtml) {
      const rp = document.getElementById('right-panel');
      if (rp && rp.classList.contains('hidden')) rp.classList.remove('hidden');
      switchRightTab('preview');
      openPreview();
    } else {
      toast('Runnable code execution lands in Phase 2');
    }
  }
  function runFile() {
    const active = window.XyloProjects.getActiveFile();
    if (!active) { toast('Open a file first', true); return; }
    const ext = window.XyloIcons.getExtension(active);
    if (ext === 'html' || ext === 'htm') {
      openPreview();
      toast('Preview updated');
    } else {
      toast('Runnable code execution lands in Phase 2');
    }
  }

  function saveActiveFile() {
    const f = window.XyloProjects.getActiveFile();
    if (!f) return;
    window.XyloProjects.updateFile(f, window.XyloEditor.getContent());
    window.XyloProjects.persist();
    toast('Saved');
  }

  function toggleSidebar() {
    const s = document.getElementById('sidebar');
    if (!s) return;
    s.classList.toggle('collapsed');
    setTimeout(() => window.XyloEditor.refresh(), 260);
  }

  function toggleConsole() {
    const c = document.getElementById('console');
    if (!c) return;
    c.classList.toggle('hidden');
    window.XyloEditor.refresh();
  }

  function promptGoToLine() {
    const f = window.XyloProjects.getActiveFile();
    if (!f) return;
    const total = window.XyloEditor.getLineCount();
    const answer = window.prompt('Go to line (1 – ' + total + '):');
    if (!answer) return;
    const n = parseInt(answer, 10);
    if (!isNaN(n)) window.XyloEditor.goToLine(n);
  }
   
  function promptNewFile() {
    const p = window.XyloProjects.getActive();
    if (!p) { toast('Open a project first'); return; }
    const name = window.prompt('New file name (e.g. style.css):');
    if (!name) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    if (window.XyloProjects.addFile(trimmed)) {
      renderFiles();
      renderTabs();
      openFile(trimmed);
      toast('Created ' + trimmed);
    } else {
      toast('File already exists', true);
    }
  }
   
  /* ─── UI refresh helpers ──────────────────────────────── */
    function refreshProjectUI() {
    renderFiles();
    renderTabs();
    updateStatus();
    updateCrumb();
  }

    function switchRightTab(name) {
    document.querySelectorAll('.right-tab').forEach(function (t) {
      t.classList.toggle('active', t.dataset.tab === name);
    });
    document.querySelectorAll('.right-pane').forEach(function (p) {
      p.classList.toggle('active', p.dataset.pane === name);
    });
  }

  /* ─── Escape HTML ─────────────────────────────────────── */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /* ─── New project modal ───────────────────────────────── */
  function buildIconGrid() {
    const grid = document.getElementById('np-icon-grid');
    if (!grid) return;
    grid.innerHTML = '';
    ICON_CHOICES.forEach(icon => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'emoji-opt' + (icon === selectedIcon ? ' selected' : '');
      btn.textContent = icon;
      btn.addEventListener('click', () => {
        selectedIcon = icon;
        grid.querySelectorAll('.emoji-opt').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
      grid.appendChild(btn);
    });
  }

  function createNewProject() {
    const nameEl = document.getElementById('np-name');
    const typeEl = document.getElementById('np-type');
    const name = nameEl ? nameEl.value.trim() : '';
    const type = typeEl ? typeEl.value : 'web';
    if (!name) {
      toast('Enter a project name', true);
      if (nameEl) nameEl.focus();
      return;
    }
    const p = window.XyloProjects.create(name, type, selectedIcon);
    closeModal('modal-new');
    openProject(p.id);
    toast('Project created');
  }

  /* ─── Settings modal ──────────────────────────────────── */
  function wireSettings() {
    const settings = window.XyloEditor.getSettings();

    const themeEl = document.getElementById('s-theme');
    const tabsizeEl = document.getElementById('s-tabsize');
    const fontsizeEl = document.getElementById('s-fontsize');
    const fsDown = document.getElementById('fs-down');
    const fsUp = document.getElementById('fs-up');

    if (themeEl) themeEl.value = settings.theme;
    if (tabsizeEl) tabsizeEl.value = String(settings.tabSize);
    if (fontsizeEl) fontsizeEl.textContent = String(settings.fontSize);

    const persist = () => {
      try {
        localStorage.setItem('xylo.settings', JSON.stringify(window.XyloEditor.getSettings()));
      } catch (e) {}
    };

    if (themeEl) themeEl.addEventListener('change', () => {
      window.XyloEditor.applySettings({ theme: themeEl.value });
      persist();
    });
    if (tabsizeEl) tabsizeEl.addEventListener('change', () => {
      window.XyloEditor.applySettings({ tabSize: parseInt(tabsizeEl.value, 10) });
      persist();
    });
    if (fsDown) fsDown.addEventListener('click', () => {
      const s = window.XyloEditor.getSettings();
      const next = Math.max(10, s.fontSize - 1);
      window.XyloEditor.applySettings({ fontSize: next });
      if (fontsizeEl) fontsizeEl.textContent = String(next);
      persist();
    });
    if (fsUp) fsUp.addEventListener('click', () => {
      const s = window.XyloEditor.getSettings();
      const next = Math.min(22, s.fontSize + 1);
      window.XyloEditor.applySettings({ fontSize: next });
      if (fontsizeEl) fontsizeEl.textContent = String(next);
      persist();
    });

    const toggleMap = {
      't-linenumbers': 'lineNumbers',
      't-linewrap': 'lineWrapping',
      't-activeline': 'styleActiveLine',
      't-autoclose': 'autoCloseBrackets',
    };
    Object.keys(toggleMap).forEach(id => {
      const btn = document.getElementById(id);
      if (!btn) return;
      const key = toggleMap[id];
      btn.classList.toggle('on', !!settings[key]);
      btn.setAttribute('aria-pressed', String(!!settings[key]));
      btn.addEventListener('click', () => {
        const s = window.XyloEditor.getSettings();
        const next = !s[key];
        btn.classList.toggle('on', next);
        btn.setAttribute('aria-pressed', String(next));
        window.XyloEditor.applySettings({ [key]: next });
        persist();
      });
    });
  }

  function restoreSettings() {
    try {
      const raw = localStorage.getItem('xylo.settings');
      if (!raw) return;
      const s = JSON.parse(raw);
      window.XyloEditor.applySettings(s);
    } catch (e) {}
  }

  /* ─── Wire everything ─────────────────────────────────── */
  function wireUI() {
    // Activity bar
        document.querySelectorAll('.act-item[data-act]').forEach(btn => {
      btn.addEventListener('click', () => {
        const act = btn.dataset.act;
        if (act === 'ai') {
          const rp = document.getElementById('right-panel');
          if (rp && rp.classList.contains('hidden')) rp.classList.remove('hidden');
          window.XyloAI.openAITab();
          return;
        }
        setPanel(act);
      });
    });
    const collapse = document.getElementById('btn-collapse-sidebar');
    if (collapse) collapse.addEventListener('click', toggleSidebar);

    // Titlebar
    const runBtn = document.getElementById('btn-run');
    if (runBtn) runBtn.addEventListener('click', run);
    const previewBtn = document.getElementById('btn-preview');
    if (previewBtn) previewBtn.addEventListener('click', togglePreview);
    const aiBtn = document.getElementById('btn-ai');
    if (aiBtn) aiBtn.addEventListener('click', () => {
      const rp = document.getElementById('right-panel');
      if (rp && rp.classList.contains('hidden')) rp.classList.remove('hidden');
      window.XyloAI.openAITab();
    });
    const settingsBtn = document.getElementById('btn-settings');
    if (settingsBtn) settingsBtn.addEventListener('click', () => openModal('modal-settings'));

    // Welcome
    const welcomeNew = document.getElementById('welcome-new');
    if (welcomeNew) welcomeNew.addEventListener('click', () => openModal('modal-new'));
    const welcomeSamples = document.getElementById('welcome-samples');
    if (welcomeSamples) welcomeSamples.addEventListener('click', () => { setPanel('samples'); toast('Sample projects land in Phase 2'); });

    // New project button
    const newProj = document.getElementById('btn-new-project');
    if (newProj) newProj.addEventListener('click', () => openModal('modal-new'));
    const backProjects = document.getElementById('btn-back-projects');
    if (backProjects) backProjects.addEventListener('click', () => { setPanel('projects'); renderProjects(); });

    // New file
    const newFile = document.getElementById('btn-new-file');
    if (newFile) newFile.addEventListener('click', promptNewFile);
    const tabAdd = document.getElementById('tab-add');
    if (tabAdd) tabAdd.addEventListener('click', promptNewFile);

    // Toolbar
    const tbRun = document.getElementById('tb-run');
    if (tbRun) tbRun.addEventListener('click', run);
    const tbFormat = document.getElementById('tb-format');
    if (tbFormat) tbFormat.addEventListener('click', () => {
      if (window.XyloEditor.formatActiveFile()) toast('Formatted');
      else toast('Nothing to format here', true);
    });
    const tbFind = document.getElementById('tb-find');
    if (tbFind) tbFind.addEventListener('click', () => window.XyloShortcuts.openFind());
    const tbComment = document.getElementById('tb-comment');
    if (tbComment) tbComment.addEventListener('click', () => {
      const cm = document.querySelector('.CodeMirror');
      if (cm && cm.CodeMirror) cm.CodeMirror.execCommand('toggleComment');
    });
    const tbConsole = document.getElementById('tb-console');
    if (tbConsole) tbConsole.addEventListener('click', toggleConsole);

    // Console
    const consoleClear = document.getElementById('console-clear');
    if (consoleClear) consoleClear.addEventListener('click', () => {
      const body = document.getElementById('console-body');
      if (body) body.innerHTML = '';
    });
    const consoleClose = document.getElementById('console-close');
    if (consoleClose) consoleClose.addEventListener('click', toggleConsole);

        // Right panel
    const rightClose = document.getElementById('right-close');
    if (rightClose) rightClose.addEventListener('click', togglePreview);

    const rightRefresh = document.getElementById('right-refresh');
    if (rightRefresh) rightRefresh.addEventListener('click', () => {
      openPreview();
      toast('Preview refreshed');
    });

    const rightOpen = document.getElementById('right-open');
    if (rightOpen) rightOpen.addEventListener('click', openPreviewInNewTab);
    // Find bar
    const findClose = document.getElementById('find-close');
    if (findClose) findClose.addEventListener('click', () => window.XyloShortcuts.closeFind());
    const findInput = document.getElementById('find-input');
    const findNext = document.getElementById('find-next');
    const findPrev = document.getElementById('find-prev');
    const findReplace = document.getElementById('find-replace');
    const findReplaceAll = document.getElementById('find-replace-all');
    const findInfo = document.getElementById('find-info');
    if (findNext) findNext.addEventListener('click', () => {
      const q = findInput.value;
      const r = window.XyloEditor.search(q, true);
      if (r) window.XyloEditor.selectRange(r.from, r.to);
      else if (findInfo) findInfo.textContent = 'No matches';
    });
    if (findPrev) findPrev.addEventListener('click', () => {
      const q = findInput.value;
      const r = window.XyloEditor.searchBackward(q);
      if (r) window.XyloEditor.selectRange(r.from, r.to);
    });
    if (findReplace) findReplace.addEventListener('click', () => {
      const repl = document.getElementById('replace-input').value;
      window.XyloEditor.replaceSelection(repl);
    });
    if (findReplaceAll) findReplaceAll.addEventListener('click', () => {
      const q = findInput.value;
      const repl = document.getElementById('replace-input').value;
      const count = window.XyloEditor.replaceAll(q, repl);
      if (findInfo) findInfo.textContent = count ? `${count} replaced` : 'No matches';
    });

    // New project modal
    const createBtn = document.getElementById('np-create');
    if (createBtn) createBtn.addEventListener('click', createNewProject);
    const npName = document.getElementById('np-name');
    if (npName) npName.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') createNewProject();
    });

    // Close buttons (data-close attribute)
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => closeModal(btn.dataset.close));
    });

    // Click outside to close
    document.querySelectorAll('.modal-bg').forEach(bg => {
      bg.addEventListener('click', (e) => {
        if (e.target === bg) closeModal(bg.id);
      });
    });

    // Mobile menu
    const mobMenu = document.getElementById('mob-menu');
    if (mobMenu) mobMenu.addEventListener('click', () => {
      const s = document.getElementById('sidebar');
      if (s) s.classList.toggle('mob-open');
    });
    const mobRun = document.getElementById('mob-run');
    if (mobRun) mobRun.addEventListener('click', run);
  }

  /* ─── Boot ────────────────────────────────────────────── */
  function boot() {
    window.XyloProjects.load();
    window.XyloEditor.init();
    window.XyloEditor.onChange((filename, content) => {
      window.XyloProjects.updateFile(filename, content);
    });
    window.XyloEditor.onCursor((line, col) => updateStatus(line, col));
    window.XyloShortcuts.init();
    window.XyloAI.init();
    restoreSettings();
    buildIconGrid();
    renderProjects();
    renderSamples();
    wireUI();
    wireSettings();
    setPanel('projects');

    const activeId = window.XyloProjects.getActiveId();
    if (activeId) openProject(activeId);
    else closeEditorView();

    updateStatus();
    updateCrumb();
    window.XyloIcons.refresh();

       // Listen for console messages from the preview iframe
    window.addEventListener('message', (e) => {
      if (!e.data || e.data.source !== 'xylo-preview') return;
      const body = document.getElementById('console-body');
      if (!body) return;
      const line = document.createElement('div');
      line.className = 'console-line ' + (e.data.type === 'error' ? 'err' : e.data.type === 'warn' ? 'warn' : e.data.type === 'info' ? 'info' : 'log');
      line.textContent = e.data.text;
      body.appendChild(line);
      body.scrollTop = body.scrollHeight;
    });
  }
  

  /* ─── Public API ──────────────────────────────────────── */
      window.XyloApp = {
    boot,
    toast,
    openModal,
    closeModal,
    confirmModal,
    run,
    runFile,
    saveActiveFile,
    toggleSidebar,
    toggleConsole,
    togglePreview,
    openPreview,
    openPreviewInNewTab,
    switchRightTab,
    refreshProjectUI,
    promptGoToLine,
    promptNewFile,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
