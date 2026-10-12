(() => {
  'use strict';
  window.__strawBridgeAudio = {
    AudioContext: window.AudioContext,
    webkitAudioContext: window.webkitAudioContext
  };
  window.AudioContext = undefined;
  window.webkitAudioContext = undefined;
})();
