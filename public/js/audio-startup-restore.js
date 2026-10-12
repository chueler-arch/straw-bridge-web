(() => {
  'use strict';
  const nativeAudio = window.__strawBridgeAudio;
  if (!nativeAudio) return;
  window.AudioContext = nativeAudio.AudioContext;
  window.webkitAudioContext = nativeAudio.webkitAudioContext;
  delete window.__strawBridgeAudio;
})();
