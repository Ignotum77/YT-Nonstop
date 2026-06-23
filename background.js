"use strict";

// Manage browserAction popup display
function isYouTube(url) {
    return /^https:\/\/(?:www|music|m)\.youtube\.com\//.test(url);
}
function updateBrowserAction(tabId, url) {
  if (isYouTube(url)) {
    browser.browserAction.enable(tabId);
  } else {
    browser.browserAction.disable(tabId);
  }
}
// Reload YT tabs on install to let the autonav on/off work
function Reload() {
  browser.tabs.query({}).then((tabs) => {
    for (const tab of tabs) {
      if (tab.url && isYouTube(tab.url)) {
        browser.tabs.reload(tab.id);
      }
    }
  });
}

browser.runtime.onInstalled.addListener(() => {
  Reload();
  browser.tabs.query({}).then((tabs) => {
    for (const tab of tabs) {
      updateBrowserAction(tab.id, tab.url || "");
    }
  });
});
browser.runtime.onStartup.addListener(() => {
  browser.tabs.query({}).then((tabs) => {
    for (const tab of tabs) {
      updateBrowserAction(tab.id, tab.url || "");
    }
  });
});
browser.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await browser.tabs.get(tabId);
  updateBrowserAction(tab.id, tab.url || "");
});
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.url) {
    updateBrowserAction(tabId, tab.url);
  }
});
