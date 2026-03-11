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
        //getters and setters
        getIsAutoSkip: function() { return autotube._autoSkip},
        setAutoSkip: function(value) { return autotube._autoSkip = value},
        getLastAutonavState: function() { return autotube._lastAutonavState },
        setLastAutonavState: function(value) { autotube._lastAutonavState = value }
    }
    const YTMusic = window.location.hostname === 'music.youtube.com';
    const videoPlayer = {
        player: () => document.getElementById('movie_player'),
    };

    function getTimestamp() {
        return new Date().toLocaleTimeString();
    }
    function log(message) {
        console.log(`[YT-Nonstop | ${getTimestamp()}] ${message}`);
    }

    // .getPlayerState(): -1 = unstarted, 0 = ended, 1 = playing, 2 = paused, 3 = buffering, 5 = video cued
    // if video paused ---> play video
    const play = () => {
        const popupEventNodename = YTMusic ? document.querySelector('YTMUSIC-YOU-THERE-RENDERER') :
                                             document.querySelector('YT-CONFIRM-DIALOG-RENDERER');
        const popupContainer = YTMusic ? document.getElementsByTagName('ytmusic-popup-container')[0] :
                                         document.getElementsByTagName('ytd-popup-container')[0];
        // Make sure that the right popup is shown
        const wrongPopup = document.querySelector('YT-CONFIRM-DIALOG-RENDERER #cancel-button:not([hidden])');

        if (videoPlayer.player().getPlayerState() === 2 && popupEventNodename && !wrongPopup) {
            videoPlayer.player().playVideo();
            popupContainer.handleClosePopupAction_();
            log('Popup hidden and video played again');
        }
    }

    // if video ended ---> skip to next video
    const skip = () => {
        if (videoPlayer.player().getPlayerState() === 0 && !YTMusic) {
            const overlay = document.querySelector('.ytp-autonav-endscreen-countdown-overlay[style="display: none;"]');
            const overlay_v = document.getElementsByClassName('ytp-autonav-endscreen-countdown-overlay')[0];
            const next = document.getElementsByClassName('ytp-autonav-endscreen-upnext-play-button')[0];
            const cancel = document.getElementsByClassName('ytp-autonav-endscreen-upnext-cancel-button')[0];
            const autonav_off = document.querySelector('.ytp-autonav-toggle-button-container > .ytp-autonav-toggle-button[aria-checked="false"]');

            if (autotube.getIsAutoSkip() == true && (!overlay || autonav_off)) {
                // videoPlayer.player().setAutonav(true);
                // videoPlayer.player().nextVideo();
                overlay_v.remove();
                next.click();
                log('Skipped to next video');
            } else
            if (autotube.getIsAutoSkip() == false && !overlay) {
                // videoPlayer.player().setAutonav(false);
                overlay_v.remove();
                cancel.click();
                log('Canceled next video');
            }
        }
    }

    const autonav_button = () => {
        const autonav_on = YTMusic
            ? document.querySelector('.autoplay.ytmusic-tab-renderer > #automix[role="button"][aria-pressed="true"]')
            : document.querySelector('.ytp-autonav-toggle-button-container > .ytp-autonav-toggle-button[aria-checked="true"]');
        const autonav_off = YTMusic
            ? document.querySelector('.autoplay.ytmusic-tab-renderer> #automix[role="button"][aria-pressed="false"]')
            : document.querySelector('.ytp-autonav-toggle-button-container > .ytp-autonav-toggle-button[aria-checked="false"]');

        const desired = autotube.getIsAutoSkip();
        const last = autotube.getLastAutonavState();

        if (last === desired) return; // prevent repeat clicks

        if (desired === true && autonav_off) {
            autonav_off.click();
            autotube.setLastAutonavState(true);
            log('Enabled autoplay/autonav');
        } else
        if (desired === false && autonav_on) {
            autonav_on.click();
            autotube.setLastAutonavState(false);
            log('Disabled autoplay/autonav');
        }
    }

    const autonav_button_style = () => {
        const autonav = YTMusic ? document.querySelector('.autoplay.ytmusic-tab-renderer') :
                                  document.querySelector('.ytp-chrome-controls button.ytp-autonav-toggle');
        if (autonav) {
            autonav.style.cssText = "height:0;width:0;opacity:0;";
            log('Hide autoplay/autonav, since the button is overriden');
        }
    }

    function run() {
        const play_button = {
            getButton: window.document.querySelector('.ytp-chrome-controls .ytp-play-button.ytp-button')
                    || window.document.querySelector('#play-pause-button'),
            config: { attributes: true, childList: true, subtree: true },
            callback: (mutationsList, observer) => {
                play();
                skip();
            }
        };

        const loadSettings = {
            // Combined MutationObserver to watch for both play button and autonav button
            setSettings: new MutationObserver((mutationsList, observer) => {
                // Check if we are on a "/watch" page
                if (window.location.href.indexOf("/watch") === -1) return;

                // Check for the play button
                const playButton = play_button.getButton;
                if (playButton) {
                    // Set up the play button observer if the button is found
                    const play_button_observer = new MutationObserver(play_button.callback);
                    play_button_observer.observe(playButton, play_button.config);
                    log('Play button observer set up successfully');
                    // Once the play button is found, disconnect this observer
                    observer.disconnect();
                    log('Play button observer disconnected');
                }

                // Handle the autonav button changes
                autonav_button();  // Trigger autonav button function
                autonav_button_style();  // Adjust style for autonav button
            }),

            // Start observing the document body for changes to detect the play button and autonav button
            startObserving: function() {
                this.setSettings.observe(document.body, { childList: true, subtree: true });
            },

            // Autoplay Method 1: Set last time active all 20 minutes to now
            // Autoplay Method 2: If video paused and popup visible ---> play video
            // Autoplay Method 3: Pause and UnPause after 20 minutes
            setOtherMethods: setInterval(() => {
                if (window.location.href.indexOf("/watch") == -1) {
                    if (document.querySelector('ytd-app[miniplayer-is-active]') || document.querySelector('ytmusic-player-bar:not([player-page-open_])')) {
                        window._lact = Date.now();
                        log('Reset last time active');
                        play();
                    } else {
                        return;
                    }
                }
                window._lact = Date.now();
                log('Reset last time active');
                play();
            }, 600000)
        };

        // Start observing for changes in the document body to detect play and autonav button
        loadSettings.startObserving();

        // Call autonav_button regularly to react to changes in autoplay toggle
        setInterval(() => {
            autonav_button();
        }, 5000);

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
        for (key in data.data){
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
