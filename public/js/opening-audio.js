(() => {
  'use strict';
  const stateKey = 'straw-bridge-state-v1';
  const startSlide = document.querySelector('.slide[data-title="START"]');
  const nextButton = document.querySelector('#nextBtn');
  const soundButton = document.querySelector('#soundBtn');
  if (!startSlide || !nextButton) return;

  const background = new Audio('audio/maou_game_medley02.mp3');
  const callout = new Audio('audio/%E3%80%8C%E3%81%95%E3%81%82%E3%80%81%E3%81%84%E3%81%8F%E3%81%9E%EF%BC%81%E3%80%8D.mp3');
  background.loop = true;
  background.preload = 'auto';
  background.volume = .5;
  callout.preload = 'auto';
  callout.volume = .9;
  let fadeFrame = 0;
  let leavingByButton = false;

  function soundEnabled() {
    try {
      return JSON.parse(localStorage.getItem(stateKey) || '{}').sound !== false;
    } catch {
      return true;
    }
  }

  function playBackground() {
    if (!soundEnabled() || !startSlide.classList.contains('is-active')) return;
    cancelAnimationFrame(fadeFrame);
    background.volume = .5;
    background.play().catch(() => {});
  }

  function fadeBackground(duration = 1000) {
    cancelAnimationFrame(fadeFrame);
    if (background.paused) return;
    const startVolume = background.volume;
    const startedAt = performance.now();
    function frame(now) {
      const progress = Math.min(1, (now - startedAt) / duration);
      background.volume = startVolume * (1 - progress);
      if (progress < 1) fadeFrame = requestAnimationFrame(frame);
      else {
        background.pause();
        background.currentTime = 0;
        background.volume = .5;
      }
    }
    fadeFrame = requestAnimationFrame(frame);
  }

  function playCallout() {
    if (!soundEnabled()) return;
    callout.pause();
    callout.currentTime = 0;
    callout.play().catch(() => {});
  }

  document.addEventListener('pointerdown', event => {
    if (event.target.closest('[data-next],#nextBtn') && startSlide.classList.contains('is-active')) return;
    playBackground();
  }, { once: true });
  document.addEventListener('keydown', playBackground, { once: true });

  document.addEventListener('click', event => {
    if (!startSlide.classList.contains('is-active')) return;
    if (!event.target.closest('[data-next],#nextBtn')) return;
    leavingByButton = true;
    fadeBackground();
    playCallout();
  }, true);

  new MutationObserver(() => {
    if (startSlide.classList.contains('is-active')) {
      leavingByButton = false;
      playBackground();
    } else {
      fadeBackground();
      if (!leavingByButton) callout.pause();
    }
  }).observe(startSlide, { attributes: true, attributeFilter: ['class'] });

  soundButton?.addEventListener('click', () => {
    if (soundEnabled()) playBackground();
    else {
      cancelAnimationFrame(fadeFrame);
      background.pause();
      callout.pause();
    }
  });

  background.load();
  callout.load();
  playBackground();
})();
