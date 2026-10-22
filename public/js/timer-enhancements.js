(() => {
  'use strict';
  const $ = (s, p = document) => p.querySelector(s);
  const stateKey = 'straw-bridge-state-v1';
  const controllers = new Map();
  function state() { try { return JSON.parse(localStorage.getItem(stateKey) || '{}'); } catch { return {}; } }
  const whistleSources = {
    single: 'audio/%E3%83%9B%E3%82%A4%E3%83%83%E3%82%B9%E3%83%AB%E3%83%BB%E5%8D%98%E7%99%BA02.mp3',
    finish: 'audio/%E3%83%9B%E3%82%A4%E3%83%83%E3%82%B9%E3%83%AB%E3%83%BB%E9%80%A3%E7%B6%9A02.mp3'
  };
  const whistlePlayers = {};
  function primeWhistles() {
    Object.entries(whistleSources).forEach(([key, source]) => {
      if (whistlePlayers[key]) return;
      const player = new Audio(source);
      player.preload = 'auto';
      player.load();
      whistlePlayers[key] = player;
    });
  }
  function whistle(kind) {
    if (state().sound === false) return;
    primeWhistles();
    const player = whistlePlayers[kind];
    if (!player) return;
    player.pause();
    player.currentTime = 0;
    player.play().catch(() => {});
  }
  function guidance(timer) {
    const title = $('#buildTitle'); if (!title || timer.key !== 'build') return;
    const elapsed = timer.total - timer.remaining;
    const progress = timer.total ? elapsed / timer.total * 100 : 0;
    const saved = state();
    const noticeAt = Math.max(1, Math.min(99, Number(saved.buildNoticePercent) || 40));
    const importantAt = Math.max(1, Math.min(99, Number(saved.buildImportantPercent) || 60));
    const urgentAt = Math.max(1, Math.min(99, Number(saved.buildUrgentPercent) || 80));
    let html = `製作開始。<br><em>${Math.round(timer.total / 60)}分の真剣勝負。</em>`, level = 'ready';
    if (progress >= urgentAt) { html = 'もうそろそろ、<br><em>補強と架橋テストを<br>始めてください。</em>'; level = 'urgent'; }
    else if (progress >= importantAt) { html = '三角形のトラス構造の<br><em>強度</em>'; level = 'important'; }
    else if (progress >= noticeAt) { html = 'もうそろそろ<br><em>組み立てを始めてください。</em>'; level = 'notice'; }
    title.innerHTML = html; title.dataset.level = level;
    if (timer.lastGuidance == null) timer.lastGuidance = level;
    else if (timer.lastGuidance !== level) {
      timer.lastGuidance = level;
      if (level !== 'ready' && timer.remaining > 0) whistle('single');
    }
  }
  function install(card, total) {
    if (!card) return;
    const key = card.dataset.timer, previous = controllers.get(key); if (previous?.id) clearInterval(previous.id);
    const timer = { key, total, remaining: total, running: false, id: null, lastGuidance: null }; controllers.set(key, timer);
    const display = $('.timer-display', card), bar = $('.timer-track i', card), toggle = $('.timer-toggle', card);
    const paint = () => { display.textContent = `${String(Math.floor(timer.remaining / 60)).padStart(2,'0')}:${String(timer.remaining % 60).padStart(2,'0')}`; bar.style.width = `${timer.total ? timer.remaining / timer.total * 100 : 0}%`; toggle.textContent = timer.running ? '一時停止' : 'スタート'; guidance(timer); };
    const stop = () => { if (timer.id) clearInterval(timer.id); timer.id = null; timer.running = false; paint(); };
    const tick = seconds => { const wasRunning = timer.remaining > 0; timer.remaining = Math.max(0, timer.remaining - seconds); if (timer.remaining === 0) { stop(); if (wasRunning) { whistle('finish'); window.dispatchEvent(new Event('sona-game-completed')); } } else paint(); };
    toggle.onclick = () => { primeWhistles(); if (timer.remaining === 0) { timer.remaining = timer.total; timer.lastGuidance = null; } timer.running = !timer.running; if (timer.running) timer.id = setInterval(() => tick(1), 1000); else stop(); paint(); };
    timer.reset = () => { stop(); timer.remaining = timer.total; timer.lastGuidance = null; paint(); };
    $('[data-reset-timer]', card).onclick = timer.reset;
    $('[data-skip-timer]', card).onclick = () => tick(30);
    paint();
  }
  function installAll() { const saved = state(); install($('[data-timer="strategy"]'), Math.max(1, Number(saved.strategyMinutes) || 5) * 60); install($('[data-timer="build"]'), Math.max(1, Number(saved.buildMinutes) || 25) * 60); install($('[data-timer="reflection"]'), Math.max(1, Number(saved.reflectionMinutes) || 5) * 60); install($('[data-timer="presentation"]'), Math.max(1, Number(saved.presentationMinutes) || 1) * 60); }
  $('#langBtn').addEventListener('click', () => setTimeout(installAll));
  $('#saveSetupBtn').addEventListener('click', () => setTimeout(installAll));
  document.addEventListener('strawbridge:reset-timer', event => controllers.get(event.detail?.key)?.reset?.());
  installAll();
})();
