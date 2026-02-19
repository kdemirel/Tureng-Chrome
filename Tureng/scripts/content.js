(() => {
  'use strict';

  const POPUP_ID = 'tureng-selection-popup';
  const STYLE_ID = 'tureng-selection-style';
  let MAX_RESULTS = 5;
  let cachedPanel = null;

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) {
      return;
    }
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${POPUP_ID} {
        position: absolute;
        z-index: 2147483647;
        background: #fff;
        color: #222;
        border: 1px solid #e2e2e2;
        border-radius: 8px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        padding: 10px 12px;
        min-width: 240px;
        max-width: 360px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
        font-size: 13px;
        display: none;
      }
      #${POPUP_ID} .tureng-title {
        font-weight: 600;
        margin-bottom: 6px;
      }
      #${POPUP_ID} .tureng-row {
        display: flex;
        gap: 8px;
        padding: 4px 0;
        border-top: 1px solid #f0f0f0;
      }
      #${POPUP_ID} .tureng-row:first-of-type {
        border-top: none;
      }
      #${POPUP_ID} .tureng-word {
        font-weight: 600;
      }
      #${POPUP_ID} .tureng-link {
        display: inline-block;
        margin-top: 6px;
        color: #1a73e8;
        text-decoration: none;
      }
      #${POPUP_ID} .tureng-link:hover {
        text-decoration: underline;
      }
      #${POPUP_ID} .tureng-error {
        color: #b00020;
      }
      #${POPUP_ID} .tureng-loading {
        color: #666;
      }
    `;
    document.head.appendChild(style);
  }

  function getPanel() {
    if (cachedPanel && document.body.contains(cachedPanel)) {
      return cachedPanel;
    }
    ensureStyles();
    const panel = document.createElement('div');
    panel.id = POPUP_ID;
    document.body.appendChild(panel);
    cachedPanel = panel;
    return panel;
  }

  function hidePopup() {
    if (cachedPanel) {
      cachedPanel.style.display = 'none';
    }
  }

  function showPopupAt(position) {
    const panel = getPanel();
    panel.style.left = `${Math.max(8, position.x)}px`;
    panel.style.top = `${Math.max(8, position.y)}px`;
    panel.innerHTML = `<div class="tureng-loading">Loading…</div>`;
    panel.style.display = 'block';
    return panel;
  }

  function getSelectionText() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return '';
    }
    return selection.toString().trim();
  }

  function getSelectionPosition() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return { x: 16, y: 16 };
    }
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    return {
      x: rect.left + window.scrollX,
      y: rect.bottom + window.scrollY + 8
    };
  }

  function fetchTureng(term) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { type: 'TUR_ENG_FETCH', term, maxResults: MAX_RESULTS },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          if (response && response.success) {
            resolve(response.results);
          } else {
            reject(new Error('No results'));
          }
        }
      );
    });
  }

  async function showPopupForSelection() {
    const term = getSelectionText();
    if (!term) {
      return;
    }

    const popup = showPopupAt(getSelectionPosition());
    popup.querySelector('.tureng-loading').textContent = `Searching "${term}"…`;

    try {
      const results = await fetchTureng(term);
      if (results.length === 0) {
        popup.innerHTML = `<div class="tureng-error">No results found.</div>`;
        return;
      }

      popup.innerHTML = `
        <div class="tureng-title">${term}</div>
        ${results.map((row) => `
          <div class="tureng-row">
            <div class="tureng-word">${row.word}</div>
            <div class="tureng-def">${row.definition}</div>
          </div>
        `).join('')}
        <a class="tureng-link" href="https://tureng.com/tr/turkce-ingilizce/${encodeURIComponent(term)}" target="_blank" rel="noopener">Open in Tureng</a>
      `;
    } catch (err) {
      popup.innerHTML = `<div class="tureng-error">Failed to fetch results.</div>`;
    }
  }

  const defaultSettings = {
    modifier: 'alt',
    maxResults: 5
  };

  let settings = { ...defaultSettings };

  function loadSettings() {
    chrome.storage.sync.get(defaultSettings, (stored) => {
      settings = { ...defaultSettings, ...stored };
      MAX_RESULTS = settings.maxResults || 5;
    });
  }

  function matchesModifier(event) {
    switch (settings.modifier) {
      case 'none':
        return !event.altKey && !event.ctrlKey && !event.shiftKey && !event.metaKey;
      case 'ctrl':
        return event.ctrlKey;
      case 'shift':
        return event.shiftKey;
      case 'meta':
        return event.metaKey;
      case 'alt':
      default:
        return event.altKey;
    }
  }

  function handleTrigger(event) {
    if (!matchesModifier(event)) {
      return;
    }
    const term = getSelectionText();
    if (!term || term.length < 2) {
      return;
    }
    showPopupForSelection();
  }

  document.addEventListener('dblclick', (event) => {
    handleTrigger(event);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      hidePopup();
    }
  });

  document.addEventListener('click', (event) => {
    if (cachedPanel && cachedPanel.style.display !== 'none' && !cachedPanel.contains(event.target)) {
      hidePopup();
    }
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message && message.type === 'TUR_ENG_SHOW_POPUP') {
      showPopupForSelection();
    }
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'sync') {
      return;
    }
    if (changes.modifier) {
      settings.modifier = changes.modifier.newValue;
    }
    if (changes.maxResults) {
      settings.maxResults = changes.maxResults.newValue;
      MAX_RESULTS = settings.maxResults || 5;
    }
  });

  loadSettings();
})();
