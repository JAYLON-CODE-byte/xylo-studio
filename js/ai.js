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
      model: 'openai',
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
  async function callAPI() {
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
      const typing = document.createElement('div');
      typing.className = 'ai-msg assistant';
      typing.innerHTML =
        '<div class="ai-msg-meta">XYLO AI</div>' +
        '<div class="ai-msg-bubble"><div class="ai-typing"><span></span><span></span><span></span></div></div>';
      el.appendChild(typing);
    }

    el.scrollTop = el.scrollHeight;
    window.XyloIcons.refresh();
  }

  /* ─── Simple markdown renderer ────────────────────────── */
  function renderMarkdown(text) {
    if (!text) return '';
    let html = escapeHtml(text);

    // Fenced code blocks: ```lang\ncode```
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, function (_, lang, code) {
      return '<pre><code>' + code.trim() + '</code></pre>';
    });

    // Inline code
    html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>');

    // Bold
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');

    // Paragraphs
    const blocks = html.split(/\n\n+/);
    return blocks.map(b => {
      if (b.startsWith('<pre>')) return b;
      return '<p>' + b.replace(/\n/g, '<br>') + '</p>';
    }).join('');
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
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
    busy = true;
    renderMessages();

    try {
      const reply = await callAPI();
      messages.push({ role: 'assistant', content: reply });
    } catch (err) {
      messages.push({
        role: 'assistant',
        content: '⚠️ **Error:** ' + (err.message || 'Something went wrong.'),
      });
    }

    busy = false;
    renderMessages();
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

    sendBtn.addEventListener('click', send);
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
    const aiTab = document.querySelector('.right-tab[data-tab="ai"]');
    if (aiTab) aiTab.click();
  }

  /* ─── Init ────────────────────────────────────────────── */
  function init() {
    loadSettings();
    wireSetup();
    wireChat();
    wireTabs();
    window.XyloIcons.refresh();
  }

  window.XyloAI = {
    init,
    openAITab,
    send,
  };
})();
