/* ═══════════════════════════════════════════════════════════
   XYLO STUDIO — ICON REGISTRY
   
   Lucide provides the base icons. This file maps file extensions
   to icons so every file type shows the right symbol in the sidebar
   and tab bar.
   
   Uses devicon for language logos (SVG, loads from CDN).
   Falls back to a generic file icon if the extension isn't mapped.
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const DEVICON = 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons';

  // Extension → devicon path
  const LANG_ICONS = {
    html: 'html5/html5-original.svg',
    htm:  'html5/html5-original.svg',
    css:  'css3/css3-original.svg',
    scss: 'sass/sass-original.svg',
    sass: 'sass/sass-original.svg',
    js:   'javascript/javascript-original.svg',
    mjs:  'javascript/javascript-original.svg',
    cjs:  'javascript/javascript-original.svg',
    jsx:  'react/react-original.svg',
    tsx:  'react/react-original.svg',
    ts:   'typescript/typescript-original.svg',
    py:   'python/python-original.svg',
    java: 'java/java-original.svg',
    c:    'c/c-original.svg',
    cpp:  'cplusplus/cplusplus-original.svg',
    cc:   'cplusplus/cplusplus-original.svg',
    h:    'c/c-original.svg',
    hpp:  'cplusplus/cplusplus-original.svg',
    cs:   'csharp/csharp-original.svg',
    php:  'php/php-original.svg',
    rb:   'ruby/ruby-original.svg',
    go:   'go/go-original.svg',
    rs:   'rust/rust-plain.svg',
    swift:'swift/swift-original.svg',
    kt:   'kotlin/kotlin-original.svg',
    dart: 'dart/dart-original.svg',
    lua:  'lua/lua-original.svg',
    r:    'r/r-original.svg',
    vue:  'vuejs/vuejs-original.svg',
    svelte: 'svelte/svelte-original.svg',
    sql:  'mysql/mysql-original.svg',
    md:   'markdown/markdown-original.svg',
    sh:   'bash/bash-original.svg',
    bash: 'bash/bash-original.svg',
    yml:  'yaml/yaml-original.svg',
    yaml: 'yaml/yaml-original.svg',
    json: 'nodejs/nodejs-original.svg',
    xml:  'xml/xml-original.svg',
    svg:  'html5/html5-original.svg',
  };

  // Extension → human label
  const LANG_LABELS = {
    html: 'HTML', htm: 'HTML',
    css: 'CSS', scss: 'SCSS', sass: 'Sass',
    js: 'JavaScript', mjs: 'JavaScript', cjs: 'JavaScript',
    jsx: 'JSX', tsx: 'TSX', ts: 'TypeScript',
    py: 'Python', java: 'Java',
    c: 'C', cpp: 'C++', cc: 'C++', h: 'C', hpp: 'C++',
    cs: 'C#', php: 'PHP', rb: 'Ruby',
    go: 'Go', rs: 'Rust', swift: 'Swift', kt: 'Kotlin',
    dart: 'Dart', lua: 'Lua', r: 'R', vue: 'Vue',
    svelte: 'Svelte', sql: 'SQL', md: 'Markdown',
    sh: 'Shell', bash: 'Bash', yml: 'YAML', yaml: 'YAML',
    json: 'JSON', xml: 'XML', svg: 'SVG',
  };

  // File extension → CodeMirror mode
  const CODEMIRROR_MODES = {
    html: 'htmlmixed', htm: 'htmlmixed', xml: 'xml', svg: 'xml',
    css: 'css', scss: 'css', sass: 'css',
    js: 'javascript', mjs: 'javascript', cjs: 'javascript',
    ts: 'javascript', jsx: 'javascript', tsx: 'javascript',
    py: 'python',
    java: 'clike', c: 'clike', cpp: 'clike', cc: 'clike',
    h: 'clike', hpp: 'clike', cs: 'clike',
    php: 'php', rb: 'ruby',
    go: 'go', rs: 'rust', swift: 'swift',
    md: 'markdown', sql: 'sql',
    sh: 'shell', bash: 'shell',
    yml: 'yaml', yaml: 'yaml',
    json: { name: 'javascript', json: true },
    vue: 'htmlmixed', svelte: 'htmlmixed',
  };

  // Extension → template starter content
  const TEMPLATES = {
    html: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>Document</title>\n</head>\n<body>\n  \n</body>\n</html>',
    css:  '/* styles */\n\n',
    js:   '// script\n\n',
    py:   '# python\n\n',
    md:   '# Title\n\n',
    json: '{\n  \n}\n',
    txt:  '',
  };

  const GENERIC_ICON = 'file';

  /* ─── Public API ──────────────────────────────────────── */

  function getExtension(filename) {
    if (!filename) return '';
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
  }

  function getLangLabel(filename) {
    const ext = getExtension(filename);
    return LANG_LABELS[ext] || ext.toUpperCase() || 'TEXT';
  }

  function getCodeMirrorMode(filename) {
    const ext = getExtension(filename);
    return CODEMIRROR_MODES[ext] || null;
  }

  function getTemplate(filename) {
    const ext = getExtension(filename);
    return TEMPLATES[ext] !== undefined ? TEMPLATES[ext] : '';
  }

  /**
   * Returns an <img> or <i> element for the given filename.
   * Prefers devicon; falls back to Lucide.
   */
  function getIconElement(filename) {
    const ext = getExtension(filename);
    const path = LANG_ICONS[ext];

    if (path) {
      const img = document.createElement('img');
      img.src = `${DEVICON}/${path}`;
      img.alt = '';
      img.loading = 'lazy';
      img.onerror = function () {
        // Fallback to Lucide generic file icon
        const i = document.createElement('i');
        i.setAttribute('data-lucide', GENERIC_ICON);
        if (window.lucide) window.lucide.createIcons({ nodes: [i] });
        this.replaceWith(i);
      };
      return img;
    }

    const i = document.createElement('i');
    i.setAttribute('data-lucide', GENERIC_ICON);
    return i;
  }

  /**
   * Refreshes all Lucide icons in the document.
   * Call after inserting new [data-lucide] elements.
   */
  function refresh() {
    if (window.lucide && window.lucide.createIcons) {
      window.lucide.createIcons();
    }
  }

  window.XyloIcons = {
    getExtension,
    getLangLabel,
    getCodeMirrorMode,
    getTemplate,
    getIconElement,
    refresh,
    LANG_ICONS,
    LANG_LABELS,
  };
})();
