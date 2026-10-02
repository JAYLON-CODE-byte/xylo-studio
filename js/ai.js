/* ═══════════════════════════════════════════════════════════
   XYLO STUDIO — AI
   
   Chat interface that talks to either Pollinations (free, no
   key) or DeepSeek (needs API key). Both use OpenAI-compatible
   message format, so the code is nearly identical.
   
   The AI can see:
   - The active file name and content
   - The project name and type
   - The last error from the console (if any)
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const STORAGE_KEY = 'xylo.ai.settings';

  const PROVIDERS = {
    pollinations: {
      url: 'https://text.pollinations.ai/openai',
      model: 'openai-fast',
      headers: () => ({ 'Content-Type': 'application/json' }),
    },
    deepseek: {
      url: 'https://api.deepseek.com/chat/completions',
      model: 'deepseek-chat',
      headers: (key) => ({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + key,
      }),
    },
  };

  let settings = {
    provider: 'pollinations',
    apiKey: '',
  };

  let messages = [];   // [{role, content}]
  let busy = false;
  let currentAbort = null;
  let thinkingStart = 0;
  let thinkingTimer = null;

  /* ─── Storage ─────────────────────────────────────────── */
  function loadSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        settings.provider = parsed.provider || 'pollinations';
        settings.apiKey = parsed.apiKey || '';
      }
    } catch (e) {}
  }

  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {}
  }

  function isConfigured() {
    if (settings.provider === 'pollinations') return true;
    return !!settings.apiKey;
  }

  /* ─── Chat history per project ────────────────────────── */
  function chatKey() {
    const id = window.XyloProjects.getActiveId() || 'global';
    return 'xylo.ai.chat.' + id;
  }

    function loadChat() {
    try {
      const raw = localStorage.getItem(chatKey());
      const loaded = raw ? JSON.parse(raw) : [];
      messages.length = 0;
      loaded.forEach(function (m) { messages.push(m); });
    } catch (e) {
      messages.length = 0;
    }
  }

  function persistChat() {
    try {
      const trimmed = messages.slice(-40);
      localStorage.setItem(chatKey(), JSON.stringify(trimmed));
    } catch (e) {}
  }

  function newChat() {
    if (messages.length > 0 && !confirm('Start a new chat? This clears the current conversation.')) return;
    stopSpeaking();
    messages = [];
    persistChat();
    renderMessages();
  }

  /* ─── System prompt ───────────────────────────────────── */
  function buildSystemPrompt() {
    const project = window.XyloProjects.getActive();
    const activeFile = window.XyloProjects.getActiveFile();
    const content = activeFile ? window.XyloEditor.getContent() : '';

    let prompt = 'You are XYLO AI, a helpful coding assistant built into XYLO Studio. ';
    prompt += 'You help users write code, fix bugs, and understand concepts. ';
    prompt += 'Be concise and direct. Use markdown code blocks for code. ';
    prompt += 'Never invent APIs or functions that do not exist.\n\n';

    if (project) {
      prompt += 'Project: ' + project.name + ' (' + project.type + ')\n';
      const files = Object.keys(project.files || {});
      prompt += 'Files: ' + files.join(', ') + '\n';
    }

    if (activeFile) {
      prompt += '\nActive file: ' + activeFile + '\n';
      if (content) {
        // Cap at ~4000 chars to keep token usage sane
        const snippet = content.length > 4000 ? content.slice(0, 4000) + '\n... (truncated)' : content;
        prompt += '```\n' + snippet + '\n```\n';
      }
    }

    return prompt;
  }

  /* ─── API call ────────────────────────────────────────── */
    async function callAPI(signal) {
    const provider = PROVIDERS[settings.provider];
    if (!provider) throw new Error('Unknown provider');

    if (settings.provider === 'deepseek' && !settings.apiKey) {
      throw new Error('DeepSeek API key not set');
    }

    const body = {
      model: provider.model,
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        ...messages.map(m => ({ role: m.role, content: m.content })),
      ],
      stream: false,
    };

    const res = await fetch(provider.url, {
      method: 'POST',
      headers: provider.headers(settings.apiKey),
      body: JSON.stringify(body),
      signal: signal,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error('API error ' + res.status + ': ' + text.slice(0, 200));
    }

    const data = await res.json();
    const content = data.choices && data.choices[0] && data.choices[0].message
      ? data.choices[0].message.content
      : null;

    if (!content) throw new Error('No response from AI');
    return content;
  }

  /* ─── Chat UI ─────────────────────────────────────────── */
  function renderMessages() {
    const el = document.getElementById('ai-messages');
    if (!el) return;
    el.innerHTML = '';

    if (messages.length === 0) {
      const welcome = document.createElement('div');
      welcome.className = 'ai-msg assistant';
      welcome.innerHTML =
        '<div class="ai-msg-meta">XYLO AI</div>' +
        '<div class="ai-msg-bubble">' +
        '<p>Hey! I can see your code. Ask me anything:</p>' +
        '<p>• <em>"Explain this file"</em><br>' +
        '• <em>"Fix the bug in my script.js"</em><br>' +
        '• <em>"How do I add dark mode?"</em></p>' +
        '</div>';
      el.appendChild(welcome);
    } else {
      messages.forEach(m => {
        const msg = document.createElement('div');
        msg.className = 'ai-msg ' + m.role;
        const meta = document.createElement('div');
        meta.className = 'ai-msg-meta';
        meta.textContent = m.role === 'user' ? 'You' : 'XYLO AI';
        const bubble = document.createElement('div');
        bubble.className = 'ai-msg-bubble';
        bubble.innerHTML = renderMarkdown(m.content);
        msg.appendChild(meta);
        msg.appendChild(bubble);
        el.appendChild(msg);
      });
    }

    if (busy) {
      const elapsed = Math.floor((Date.now() - thinkingStart) / 1000);
      const thinking = document.createElement('div');
      thinking.className = 'ai-msg assistant';
      thinking.innerHTML =
        '<div class="ai-msg-meta">XYLO AI</div>' +
        '<div class="ai-thinking-bubble">' +
          '<div class="ai-thinking-head">' +
            '<span class="ai-thinking-icon">✦</span>' +
            '<span class="ai-thinking-time">Thinking for ' + elapsed + 's</span>' +
          '</div>' +
          '<div class="ai-thinking-dots"><span></span><span></span><span></span></div>' +
        '</div>';
      el.appendChild(thinking);
    }

        el.scrollTop = el.scrollHeight;
    attachCodeBlockHandlers();
    window.XyloIcons.refresh();
  }

   /* ─── Pending code blocks (used by apply buttons) ─────── */
  let pendingCodeBlocks = [];

  /* ─── Simple markdown renderer ────────────────────────── */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
   
  function renderMarkdown(text) {
    if (!text) return '';
    let html = escapeHtml(text);
    pendingCodeBlocks = [];

    // Fenced code blocks: ```header\ncode```
    html = html.replace(/```([\w:./\- ]*)\n([\s\S]*?)```/g, function (_, header, code) {
      const trimmed = code.trim();
      let filename = null;
      let lang = header || 'text';

      if (header.indexOf('filename:') === 0) {
        const parts = header.substring(9).trim().split(/\s+/);
        filename = parts[0];
        lang = parts[1] || 'code';
      }

      const id = 'cb_' + Math.random().toString(36).slice(2, 10);
      pendingCodeBlocks.push({ id: id, filename: filename, lang: lang, code: trimmed });

      const label = filename ? filename : lang;

      return '<div class="ai-code-block">' +
        '<div class="ai-code-head">' +
          '<span class="ai-code-lang">' + escapeHtml(label) + '</span>' +
          '<div class="ai-code-actions">' +
            (filename ? '<button class="ai-code-btn" data-act="apply" data-block="' + id + '">Apply</button>' : '') +
            '<button class="ai-code-btn" data-act="copy" data-block="' + id + '">Copy</button>' +
          '</div>' +
        '</div>' +
        '<pre><code>' + trimmed + '</code></pre>' +
      '</div>';
    });

    // Inline code
    html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>');

    // Bold
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');

    // Paragraphs
    const blocks = html.split(/\n\n+/);
    return blocks.map(function (b) {
      if (b.indexOf('<div class="ai-code-block"') === 0) return b;
      return '<p>' + b.replace(/\n/g, '<br>') + '</p>';
    }).join('');
  }

  /* ─── Attach click handlers after render ──────────────── */
  function attachCodeBlockHandlers() {
    document.querySelectorAll('.ai-code-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const blockId = btn.dataset.block;
        const block = pendingCodeBlocks.find(function (b) { return b.id === blockId; });
        if (!block) return;

        if (btn.dataset.act === 'copy') {
          navigator.clipboard.writeText(block.code).then(function () {
            const original = btn.textContent;
            btn.textContent = 'Copied';
            setTimeout(function () { btn.textContent = original; }, 1400);
          }).catch(function () {
            window.XyloApp.toast('Copy failed', true);
          });
          return;
        }

        if (btn.dataset.act === 'apply' && block.filename) {
          applyCodeToFile(block.filename, block.code);
        }
      });
    });
  }

  /* ─── Write code into the project ─────────────────────── */
  function applyCodeToFile(filename, code) {
    const project = window.XyloProjects.getActive();
    if (!project) {
      window.XyloApp.toast('Open a project first', true);
      return;
    }

    const exists = project.files[filename] !== undefined;

    if (exists) {
      if (!confirm('Overwrite ' + filename + '? This cannot be undone.')) return;
    }

    project.files[filename] = code;
    window.XyloProjects.persist();

    // Refresh sidebar + tabs
    if (window.XyloApp.refreshProjectUI) window.XyloApp.refreshProjectUI();

    // If we just changed the file the user is editing, reload it
    if (window.XyloProjects.getActiveFile() === filename) {
      window.XyloEditor.loadFile(filename, code);
    } else if (!exists) {
      // New file — open it so the user sees it
      const app = window.XyloApp;
      if (app && app.openFile) app.openFile(filename);
    }

    // Refresh preview if it's a web file
    const ext = window.XyloIcons.getExtension(filename);
    if (['html', 'htm', 'css', 'js'].indexOf(ext) !== -1) {
      setTimeout(function () {
        if (window.XyloApp.openPreview) window.XyloApp.openPreview();
      }, 100);
    }

    window.XyloApp.toast(exists ? 'Updated ' + filename : 'Created ' + filename);
  }

  /* ─── Send message ────────────────────────────────────── */
      async function send() {
    const input = document.getElementById('ai-input');
    if (!input || busy) return;
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    input.style.height = 'auto';
    messages.push({ role: 'user', content: text });
    persistChat();
    busy = true;
    thinkingStart = Date.now();
    renderMessages();
    updateSendButton();

    currentAbort = new AbortController();

    // Start the thinking timer
    if (thinkingTimer) clearInterval(thinkingTimer);
    thinkingTimer = setInterval(() => {
      const el = document.querySelector('.ai-thinking-time');
      if (el) {
        const secs = Math.floor((Date.now() - thinkingStart) / 1000);
        el.textContent = 'Thinking for ' + secs + 's';
      }
    }, 1000);

    try {
      const reply = await callAPI(currentAbort.signal);
      messages.push({ role: 'assistant', content: reply });
      speak(reply);
    } catch (err) {
      if (err.name === 'AbortError') {
        messages.push({ role: 'assistant', content: '_Stopped._' });
      } else {
        messages.push({
          role: 'assistant',
          content: '⚠️ **Error:** ' + (err.message || 'Something went wrong.'),
        });
      }
    }

    if (thinkingTimer) { clearInterval(thinkingTimer); thinkingTimer = null; }
    currentAbort = null;
    busy = false;
    persistChat();
    renderMessages();
    updateSendButton();
  }

  function stopGeneration() {
    if (currentAbort) {
      currentAbort.abort();
    }
    stopSpeaking();
  }

  function updateSendButton() {
    const btn = document.getElementById('ai-send');
    if (!btn) return;
    if (busy) {
      btn.innerHTML = '<i data-lucide="square"></i>';
      btn.title = 'Stop';
      btn.dataset.mode = 'stop';
    } else {
      btn.innerHTML = '<i data-lucide="arrow-up"></i>';
      btn.title = 'Send (Enter)';
      btn.dataset.mode = 'send';
    }
    window.XyloIcons.refresh();
  }
   
  /* ─── Setup form ──────────────────────────────────────── */
  function showSetup(show) {
    const setup = document.getElementById('ai-setup');
    const chat = document.getElementById('ai-chat');
    if (!setup || !chat) return;
    setup.classList.toggle('hidden', !show);
    chat.classList.toggle('hidden', show);
  }

  function wireSetup() {
    const providerSel = document.getElementById('ai-provider');
    const keyRow = document.getElementById('ai-key-row');
    const keyInput = document.getElementById('ai-key');
    const saveBtn = document.getElementById('ai-save-settings');

    if (!providerSel) return;

    providerSel.value = settings.provider;
    if (keyInput) keyInput.value = settings.apiKey;
    updateKeyRow();

    function updateKeyRow() {
      if (!keyRow) return;
      keyRow.classList.toggle('hidden', providerSel.value !== 'deepseek');
    }

    providerSel.addEventListener('change', updateKeyRow);

    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        settings.provider = providerSel.value;
        settings.apiKey = keyInput ? keyInput.value.trim() : '';
        saveSettings();
        if (isConfigured()) {
          showSetup(false);
          renderMessages();
        } else {
          window.XyloApp.toast('Please enter a DeepSeek API key', true);
        }
      });
    }
  }

  /* ─── Wire chat input ─────────────────────────────────── */
      function wireChat() {
    const input = document.getElementById('ai-input');
    const sendBtn = document.getElementById('ai-send');
    const newChatBtn = document.getElementById('ai-new-chat');
    if (!input || !sendBtn) return;

    input.addEventListener('input', function () {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 140) + 'px';
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        send();
      }
    });

    sendBtn.addEventListener('click', function () {
      if (sendBtn.dataset.mode === 'stop') {
        stopGeneration();
      } else {
        send();
      }
    });

    const voiceBtn = document.getElementById('ai-voice-toggle');
    if (voiceBtn) voiceBtn.addEventListener('click', toggleVoice);

    if (newChatBtn) newChatBtn.addEventListener('click', newChat);
  }

  /* ─── Wire right panel tabs ───────────────────────────── */
  function wireTabs() {
    const tabs = document.querySelectorAll('.right-tab');
    const panes = document.querySelectorAll('.right-pane');

    tabs.forEach(tab => {
      tab.addEventListener('click', function () {
        const target = tab.dataset.tab;
        tabs.forEach(t => t.classList.toggle('active', t === tab));
        panes.forEach(p => p.classList.toggle('active', p.dataset.pane === target));

        if (target === 'ai') {
          if (!isConfigured()) {
            showSetup(true);
          } else {
            showSetup(false);
            renderMessages();
          }
          const input = document.getElementById('ai-input');
          if (input) setTimeout(() => input.focus(), 100);
        }
      });
    });
  }

  /* ─── Show the AI tab from outside ────────────────────── */
   function openAITab() {
    loadChat();
    const aiTab = document.querySelector('.right-tab[data-tab="ai"]');
    if (aiTab) aiTab.click();
  }

  /* ─── Voice output ────────────────────────────────────── */
  let voiceEnabled = true;
  let currentUtterance = null;

  function speak(text) {
    if (!voiceEnabled) return;
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    const clean = text
      .replace(/```[\s\S]*?```/g, ' code block ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/[⚠️✦•]/g, '')
      .replace(/[#_>]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!clean) return;

    const trimmed = clean.length > 500 ? clean.slice(0, 500) + '...' : clean;

    const utter = new SpeechSynthesisUtterance(trimmed);
    utter.rate = 1.05;
    utter.pitch = 1.0;
    utter.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(function (v) { return /en-(US|GB)/.test(v.lang); })
      || voices.find(function (v) { return /^en/i.test(v.lang); });
    if (preferred) utter.voice = preferred;

    currentUtterance = utter;
    window.speechSynthesis.speak(utter);
  }

  function stopSpeaking() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    currentUtterance = null;
  }

  function toggleVoice() {
    voiceEnabled = !voiceEnabled;
    if (!voiceEnabled) stopSpeaking();
    updateVoiceButton();
    try { localStorage.setItem('xylo.ai.voice', voiceEnabled ? '1' : '0'); } catch (e) {}
  }

  function updateVoiceButton() {
    const btn = document.getElementById('ai-voice-toggle');
    if (!btn) return;
    btn.classList.toggle('on', voiceEnabled);
    btn.title = voiceEnabled ? 'Voice: On' : 'Voice: Off';
    btn.innerHTML = voiceEnabled
      ? '<i data-lucide="volume-2"></i>'
      : '<i data-lucide="volume-x"></i>';
    window.XyloIcons.refresh();
  }

  function loadVoicePref() {
    try {
      const v = localStorage.getItem('xylo.ai.voice');
      if (v !== null) voiceEnabled = v === '1';
    } catch (e) {}
  }
   
  /* ─── Init ────────────────────────────────────────────── */
      function init() {
    loadSettings();
    loadChat();
    loadVoicePref();
    wireSetup();
    wireChat();
    wireTabs();
    updateSendButton();
    updateVoiceButton();
    window.XyloIcons.refresh();
  }
      window.XyloAI = {
    init,
    openAITab,
    send,
    stop: stopGeneration,
    newChat,
    speak,
    stopSpeaking,
    toggleVoice,
  };
})();
