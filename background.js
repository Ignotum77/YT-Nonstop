"use strict";

// Reload YT tabs on install to let the autonav on/off work
function Reload() {
  browser.tabs.query({
    url: [
      "https://www.youtube.com/*",
      "https://music.youtube.com/*"
      "https://m.youtube.com/*"
    ]
  }).then(tabs => {
    for (const tab of tabs) {
      browser.tabs.reload(tab.id);
    }
  });
}

browser.runtime.onInstalled.addListener(() => {
  Reload();
});
