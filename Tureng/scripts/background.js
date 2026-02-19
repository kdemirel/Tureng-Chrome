chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    title: "Tureng: '%s' ",
    id: "tureng_dclick_popup",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === 'tureng_dclick_popup') {
    chrome.tabs.create({
      url: "https://tureng.com/tr/turkce-ingilizce/" + info.selectionText.trim()
    });
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'show-translation-popup') {
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) {
    return;
  }

  chrome.tabs.sendMessage(tab.id, { type: 'TUR_ENG_SHOW_POPUP' });
});

function stripTags(html) {
  return html.replace(/<[^>]*>/g, '').trim();
}

function parseResults(htmlText) {
  const tableMatch = htmlText.match(/<table[^>]*class="[^"]*searchResultsTable[^"]*"[^>]*>([\s\S]*?)<\/table>/i);
  if (!tableMatch) {
    return [];
  }
  const tableHtml = tableMatch[1];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
  const results = [];
  let rowMatch;

  while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
    const rowContent = rowMatch[1];
    if (!/class="[^"]*rc0[^"]*"/.test(rowContent)) continue;

    const cells = [];
    let cellMatch;
    cellRegex.lastIndex = 0;
    while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
      cells.push(cellMatch[1]);
    }
    if (cells.length >= 4) {
      const word = stripTags(cells[2]);
      const definition = stripTags(cells[3]);
      if (word && definition) {
        results.push({ word, definition });
      }
    }
  }
  return results;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type === 'TUR_ENG_FETCH') {
    const term = message.term;
    const maxResults = message.maxResults || 5;

    fetch(`https://tureng.com/tr/turkce-ingilizce/${encodeURIComponent(term)}`)
      .then((response) => {
        if (!response.ok) throw new Error('Request failed');
        return response.text();
      })
      .then((text) => {
        const results = parseResults(text).slice(0, maxResults);
        sendResponse({ success: true, results });
      })
      .catch(() => {
        sendResponse({ success: false, results: [] });
      });

    return true; // keep the message channel open for async sendResponse
  }
});
