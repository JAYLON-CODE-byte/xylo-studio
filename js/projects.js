/* ═══════════════════════════════════════════════════════════
   XYLO STUDIO — PROJECTS
   
   Project storage, creation, deletion, and file management.
   Everything persists to localStorage under the key
   `xylo.projects`. Structure:
   
   {
     "proj_1700000000000": {
       id, name, icon, type,
       files: { "index.html": "...", "style.css": "..." },
       createdAt, updatedAt
     },
     ...
   }
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const STORAGE_KEY = 'xylo.projects';
  const ACTIVE_KEY  = 'xylo.activeProject';

  let projects = {};
  let activeProjectId = null;
  let activeFile = null;

  /* ─── Persistence ─────────────────────────────────────── */
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      projects = raw ? JSON.parse(raw) : {};
    } catch (err) {
      projects = {};
    }
    try {
      activeProjectId = localStorage.getItem(ACTIVE_KEY) || null;
    } catch (err) {
      activeProjectId = null;
    }
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
      if (activeProjectId) {
        localStorage.setItem(ACTIVE_KEY, activeProjectId);
      } else {
        localStorage.removeItem(ACTIVE_KEY);
      }
    } catch (err) {
      console.warn('[XYLO] Could not persist projects:', err);
    }
  }

  /* ─── Templates ───────────────────────────────────────── */
  const TEMPLATES = {
    web: {
      'index.html': '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>My Project</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <div class="container">\n    <h1>Hello, XYLO!</h1>\n    <p>Edit this file to start building.</p>\n    <button id="btn">Click me</button>\n  </div>\n  <script src="script.js"><\/script>\n</body>\n</html>',
      'style.css': '* { margin: 0; padding: 0; box-sizing: border-box; }\nbody {\n  background: #0a0a0f;\n  color: #fff;\n  font-family: system-ui, sans-serif;\n  display: grid;\n  place-items: center;\n  min-height: 100vh;\n}\n.container { text-align: center; }\nh1 { color: #00D4FF; font-size: 2.5rem; margin-bottom: 12px; }\np { color: #8899aa; margin-bottom: 24px; }\nbutton {\n  padding: 12px 28px;\n  background: #00D4FF;\n  color: #000;\n  border: none;\n  border-radius: 8px;\n  font-weight: 700;\n  cursor: pointer;\n}\nbutton:hover { background: #00FFFF; }',
      'script.js': "const btn = document.getElementById('btn');\nbtn.addEventListener('click', () => {\n  btn.textContent = 'Hello from XYLO!';\n  console.log('Button clicked');\n});\n\nconsole.log('Script loaded');",
    },
    html: {
      'index.html': '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>Document</title>\n</head>\n<body>\n  <h1>Hello, XYLO!</h1>\n</body>\n</html>',
    },
    react: {
      'index.html': '<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="UTF-8">\n  <title>React App</title>\n  <script src="https://unpkg.com/react@18/umd/react.development.js"><\/script>\n  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"><\/script>\n  <script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>\n</head>\n<body>\n  <div id="root"></div>\n  <script type="text/babel" src="App.jsx"><\/script>\n</body>\n</html>',
      'App.jsx': "function App() {\n  return <h1>Hello, XYLO!</h1>;\n}\n\nReactDOM.createRoot(document.getElementById('root')).render(<App />);",
    },
    python: {
      'main.py': '# Python project\nprint("Hello, XYLO!")\n\nfor i in range(5):\n    print(f"Line {i}")\n',
    },
    js: {
      'main.js': "// JavaScript project\nconsole.log('Hello, XYLO!');\n\nconst nums = [1, 2, 3, 4, 5];\nconsole.log('Sum:', nums.reduce((a, b) => a + b, 0));\n",
    },
    java: {
      'Main.java': 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, XYLO!");\n  }\n}\n',
    },
    cpp: {
      'main.cpp': '#include <iostream>\nusing namespace std;\n\nint main() {\n  cout << "Hello, XYLO!" << endl;\n  return 0;\n}\n',
    },
    go: {
      'main.go': 'package main\n\nimport "fmt"\n\nfunc main() {\n  fmt.Println("Hello, XYLO!")\n}\n',
    },
    rust: {
      'main.rs': 'fn main() {\n  println!("Hello, XYLO!");\n}\n',
    },
    php: {
      'index.php': '<?php\necho "Hello, XYLO!\\n";\n',
    },
    ruby: {
      'main.rb': 'puts "Hello, XYLO!"\n',
    },
    empty: {},
  };

  const TEMPLATE_LABELS = {
    web: 'HTML + CSS + JS',
    html: 'HTML Only',
    react: 'React App',
    python: 'Python Script',
    js: 'JavaScript / Node',
    java: 'Java',
    cpp: 'C / C++',
    go: 'Go',
    rust: 'Rust',
    php: 'PHP',
    ruby: 'Ruby',
    empty: 'Empty Project',
  };

  /* ─── Create ──────────────────────────────────────────── */
  function create(name, type, icon) {
    const id = 'proj_' + Date.now();
    const now = Date.now();
    const files = {};
    const template = TEMPLATES[type] || {};
    Object.keys(template).forEach(fn => { files[fn] = template[fn]; });
    projects[id] = {
      id,
      name: name || 'Untitled Project',
      icon: icon || '⚡',
      type: type || 'web',
      files,
      createdAt: now,
      updatedAt: now,
    };
    persist();
    return projects[id];
  }

  /* ─── Open ────────────────────────────────────────────── */
  function open(id) {
    if (!projects[id]) return null;
    activeProjectId = id;
    const files = Object.keys(projects[id].files || {});
    activeFile = files.length ? pickPreferredFile(files) : null;
    projects[id].updatedAt = Date.now();
    persist();
    return projects[id];
  }

  function close() {
    activeProjectId = null;
    activeFile = null;
    persist();
  }

  function pickPreferredFile(files) {
    const order = ['index.html', 'main.py', 'main.js', 'Main.java', 'main.cpp', 'main.go', 'main.rs', 'App.jsx', 'index.php', 'main.rb'];
    for (const f of order) if (files.includes(f)) return f;
    return files[0];
  }

  /* ─── Delete ──────────────────────────────────────────── */
  function remove(id) {
    if (!projects[id]) return;
    delete projects[id];
    if (activeProjectId === id) {
      activeProjectId = null;
      activeFile = null;
    }
    persist();
  }

  /* ─── Files ───────────────────────────────────────────── */
  function addFile(filename, content) {
    const p = getActive();
    if (!p) return false;
    if (p.files[filename] !== undefined) return false;
    p.files[filename] = content !== undefined ? content : window.XyloIcons.getTemplate(filename);
    p.updatedAt = Date.now();
    persist();
    return true;
  }

  function removeFile(filename) {
    const p = getActive();
    if (!p || p.files[filename] === undefined) return;
    delete p.files[filename];
    if (activeFile === filename) {
      const remaining = Object.keys(p.files);
      activeFile = remaining.length ? pickPreferredFile(remaining) : null;
    }
    p.updatedAt = Date.now();
    persist();
  }

  function renameFile(oldName, newName) {
    const p = getActive();
    if (!p || p.files[oldName] === undefined) return false;
    if (p.files[newName] !== undefined) return false;
    p.files[newName] = p.files[oldName];
    delete p.files[oldName];
    if (activeFile === oldName) activeFile = newName;
    p.updatedAt = Date.now();
    persist();
    return true;
  }

  function updateFile(filename, content) {
    const p = getActive();
    if (!p) return;
    p.files[filename] = content;
    p.updatedAt = Date.now();
    // Debounced persistence to avoid hammering localStorage on every keystroke
    schedulePersist();
  }

  let persistTimer = null;
  function schedulePersist() {
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(persist, 400);
  }

  /* ─── Accessors ───────────────────────────────────────── */
  function getActive() {
    return activeProjectId ? projects[activeProjectId] : null;
  }

  function getAll() {
    return Object.values(projects).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }

  function getActiveId() { return activeProjectId; }
  function getActiveFile() { return activeFile; }

  function setActiveFile(filename) {
    const p = getActive();
    if (!p || p.files[filename] === undefined) return false;
    activeFile = filename;
    return true;
  }

  function getFileContent(filename) {
    const p = getActive();
    return p && p.files[filename] !== undefined ? p.files[filename] : null;
  }

  function listFiles() {
    const p = getActive();
    return p ? Object.keys(p.files) : [];
  }

  function getTemplateLabel(type) {
    return TEMPLATE_LABELS[type] || type;
  }

  function clearAll() {
    projects = {};
    activeProjectId = null;
    activeFile = null;
    persist();
  }

  /* ─── Public API ──────────────────────────────────────── */
  window.XyloProjects = {
    load,
    persist,
    create,
    open,
    close,
    remove,
    addFile,
    removeFile,
    renameFile,
    updateFile,
    getActive,
    getAll,
    getActiveId,
    getActiveFile,
    setActiveFile,
    getFileContent,
    listFiles,
    getTemplateLabel,
    clearAll,
    STORAGE_KEY,
  };
})();
