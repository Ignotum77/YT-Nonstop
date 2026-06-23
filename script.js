function injectScript(YTNonstop, tag) {
  var node = document.getElementsByTagName(tag)[0];
  var init_inject_script = document.createElement('script');
  var run_inject_script = document.createElement('script');

  init_inject_script.setAttribute('type', 'text/javascript');
  run_inject_script.setAttribute('type', 'text/javascript');

  init_inject_script.append(`YTNonstop = ${YTNonstop}()`);
  node.appendChild(init_inject_script);

  run_inject_script.append("autotube = YTNonstop = new YTNonstop();");
  node.appendChild(run_inject_script);

  init_inject_script.remove();
}

let YTNonstop = (function YTNonstop(options) {
  const MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
  const autotube = {
    _autoSkip: null,
    getIsAutoSkip: function() { return autotube._autoSkip},
    setAutoSkip: function(value) { return autotube._autoSkip = value},
  }
  const YTMusic = window.location.hostname === 'music.youtube.com';
  const YTMobile = window.location.hostname === 'm.youtube.com'; // m.youtube.com/?persist_app=1&app=m
  const YTDesktop = window.location.hostname === 'www.youtube.com';
  const videoPlayer = { player: () => document.getElementById('movie_player'), };

  function getTimestamp() {
    return new Date().toLocaleTimeString();
  }
  function log(message) {
    console.log(`[YT-Nonstop | ${getTimestamp()}] ${message}`);
  }

  // .getPlayerState(): -1 = unstarted, 0 = ended, 1 = playing, 2 = paused, 3 = buffering, 5 = video cued
  // if video paused ---> play video
  const play = () => {
    let popupEventNodename;
    let popupContainer;
    let goodPopup;
    if (YTMusic) {
      popupEventNodename = document.querySelector('ytmusic-you-there-renderer');
      popupContainer = document.getElementsByTagName('ytmusic-popup-container')[0];
      goodPopup = true;
    }
    else if (YTMobile) {
      popupEventNodename = document.querySelector('.confirm-dialog-messages');
      popupContainer = document.querySelectorAll('.dialog-container');
      goodPopup = document.querySelectorAll('.dialog-container > dialog button').length == 1;
    }
    else if (YTDesktop) {
      popupEventNodename = document.querySelector('yt-confirm-dialog-renderer');
      popupContainer = document.getElementsByTagName('ytd-popup-container')[0];
      goodPopup = document.querySelectorAll('yt-confirm-dialog-renderer .buttons button').length == 1;
    }
    // Make sure that the right popup is shown
    if (popupEventNodename && goodPopup) {
      popupContainer.remove();
      videoPlayer.player().playVideo();
      log('Popup hidden and video played again');
    }
  }

  // if video ended ---> skip to next video
  const skip = () => {
    // YTMusic doesn't have an endscreen overlay and skip isn't needed when AutoSkip is false
    if (YTMusic || autotube.getIsAutoSkip() == false) return;

    if (YTMobile) {
      // YTMobile doesn't have endscreen video suggestions 
      const overlay = document.querySelector('player-endscreen.ytwPlayerEndscreenHost');
      if (overlay) {
        overlay.remove();
        videoPlayer.player().nextVideo();
        log('Skipped to next video');
      }
    }
    else if (YTDesktop) {
      const overlay = document.querySelector('.ytp-autonav-endscreen-countdown-overlay');
      const overlay_hidden = document.querySelector('.ytp-autonav-endscreen-countdown-overlay[style="display: none;"]');
      if (overlay && !overlay_hidden) {
        overlay.remove();
        videoPlayer.player().nextVideo();
        log('Skipped to next video');
      }
    }
  }

  const autonav_button = () => {
    let autonav_on;
    let autonav_off;
    if (YTMusic) {
      autonav_on = document.querySelector('.autoplay.ytmusic-tab-renderer > #automix[role="button"][aria-pressed="true"]');
      autonav_off = document.querySelector('.autoplay.ytmusic-tab-renderer> #automix[role="button"][aria-pressed="false"]');
    }
    else if (YTMobile) {
      autonav_on = document.querySelector('player-autonav-toggle > button.ytwAutonavToggleButtonHost[aria-pressed="true"]');
      autonav_off = document.querySelector('player-autonav-toggle > button.ytwAutonavToggleButtonHost[aria-pressed="false"]');
    }
    else if (YTDesktop) {
      autonav_on = document.querySelector('.ytp-autonav-toggle-button-container > .ytp-autonav-toggle-button[aria-checked="true"]');
      autonav_off = document.querySelector('.ytp-autonav-toggle-button-container > .ytp-autonav-toggle-button[aria-checked="false"]');
    }

    if (autotube.getIsAutoSkip() == true && autonav_off) {
      autonav_off.click();
      log('Enabled autoplay/autonav');
    } 
    else if (autotube.getIsAutoSkip() == false && autonav_on) {
      autonav_on.click();
      log('Disabled autoplay/autonav');
    }
  }

  const autonav_button_style = () => {
    let autonav;
    if (YTMusic) {
      autonav = document.querySelector('.autoplay.ytmusic-tab-renderer');
    }
    else if (YTMobile) {
      autonav = document.querySelector('player-autonav-toggle > button.ytwAutonavToggleButtonHost');
    }
    else if (YTDesktop) {
      autonav = document.querySelector('.ytp-chrome-controls button.ytp-autonav-toggle');
    }
    const computedStyle = window.getComputedStyle(autonav);

    if (computedStyle.height !== "0px" && computedStyle.opacity !== "0") {
      autonav.style.cssText = "height:0;width:0;opacity:0;";
      log('Hide autoplay/autonav, since the button is overriden');
    }
  }

  function run() {
    // Set up MutationObserver to detect buttons
    const loadSettings = {
      setSettings: new MutationObserver((mutationsList, observer) => {
        // Check if we are on a "/watch" page
        if (window.location.href.indexOf("/watch") === -1) return;

        // Handle play and skip functions
        const player = videoPlayer.player();
        if (player && player.getPlayerState() === 2) {
          play();
        }
        if (player && player.getPlayerState() === 0) {
          skip();
        }

        // Handle the autonav button changes
        autonav_button();
        autonav_button_style();
      }),

      // Start observing the document body for changes to detect the play button and autonav button
      startObserving: function() {
        this.setSettings.observe(document.body, { childList: true, subtree: true });
      },

      // Autoplay Method: Set last time active all 15 minutes to now
      setOtherMethods: setInterval(() => {
        window._lact = Date.now();
        log('Reset last time active');
      }, 900000)
    };

    // Start observing for changes in the document body to detect play and autonav button
    loadSettings.startObserving();

    // Fix video background play - https://greasyfork.org/en/scripts/371641-video-background-play-fix/code
    if (YTMobile) {
      Object.defineProperties(document, { 'hidden': {value: false}, 'visibilityState': {value: 'visible'} });
    }

    return autotube;
  };

  // exposing functions
  function _getIsAutoSkip() { return autotube.getIsAutoSkip() };
  function YTNonstop () {
    this.isAutoSkip = _getIsAutoSkip;
    run();
  };
  
  const eventHandler = (key, value) => {
    switch(key) {
      case "autoSkip": 
        autotube.setAutoSkip(value);
        break;
    }
  }
  addEventListener('message', function(data) {
    for (key in data.data) {
      eventHandler(key, data.data[key]);
    }
  });

  // Return YTNonstop object
  return YTNonstop;
});

window.onload = (event) => {
  chrome.runtime.onMessage.addListener( (data) => {
    postMessage(data, '*');
  });
  chrome.storage.sync.get(null, function(data) {
    data = {
      autoSkip: data.autoSkip === undefined || data.autoSkip === null ? true : JSON.parse(data.autoSkip),
    }
    postMessage(data, '*');
    // injectScript(YTNonstop, 'html');
  });
};

injectScript(YTNonstop, 'html');
