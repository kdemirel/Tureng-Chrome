(() => {
  'use strict';

  const defaultSettings = {
    modifier: 'alt',
    maxResults: 5,
    ttsRate: 0.8
  };

  const modifierSelect = document.getElementById('modifier-select');
  const statusEl = document.getElementById('options-status');

  function showSaved() {
    if (!statusEl) {
      return;
    }
    statusEl.style.display = 'block';
    clearTimeout(showSaved._timer);
    showSaved._timer = setTimeout(() => {
      statusEl.style.display = 'none';
    }, 1200);
  }

  function applySettings(settings) {
    if (modifierSelect) {
      modifierSelect.value = settings.modifier;
    }
  }

  function saveSettings() {
    const modifier = modifierSelect ? modifierSelect.value : defaultSettings.modifier;
    chrome.storage.sync.set({ modifier }, showSaved);
  }

  chrome.storage.sync.get(defaultSettings, (stored) => {
    applySettings({ ...defaultSettings, ...stored });
  });

  if (modifierSelect) {
    modifierSelect.addEventListener('change', saveSettings);
  }
})();
