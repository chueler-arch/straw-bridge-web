(() => {
  'use strict';
  const $ = (s, p = document) => p.querySelector(s);
  const stateKey = 'straw-bridge-state-v1';
  const controllers = new Map();
  function state() { try { return JSON.parse(localStorage.getItem(stateKey) || '{}'); } catch { return {}; } }
  function whistle() {
    if (state().sound === false) return;
    const Audio = window.AudioContext || window.webkitAudioContext; if (!Audio) return;
    const context = new Audio(), now = context.currentTime;
    [0, .32].forEach(offset => {
      const oscillator = context.createOscillator(), gain = context.createGain();
      oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(1450, now + offset); oscillator.frequency.exponentialRampToValueAtTime(900, now + offset + .22);
      gain.gain.setValueAtTime(.001, now + offset); gain.gain.exponentialRampToValueAtTime(.18, now + offset + .025); gain.gain.exponentialRampToValueAtTime(.001, now + offset + .26);
      oscillator.connect(gain).connect(context.destination); oscillator.start(now + offset); oscillator.stop(now + offset + .28);
    });
    setTimeout(() => context.close(), 900);
  }
  function guidance(timer) {
    const title = $('#buildTitle'); if (!title || timer.key !== 'build') return;
    const elapsed = timer.total - timer.remaining;
    let html = '製作開始。<br><em>25分の真剣勝負。</em>', level = 'ready';
    if (timer.remaining <= 300) { html = 'もうそろそろ、<br><em>補強と架橋テストを<br>始めてください。</em>'; level = 'urgent'; }
    else if (elapsed >= 900) { html = '三角形のトラス構造の<br><em>強度</em>'; level = 'important'; }
    else if (elapsed >= 600) { html = 'もうそろそろ<br><em>組み立てを始めてください。</em>'; level = 'notice'; }
    title.innerHTML = html; title.dataset.level = level;
  }
  function install(card, total) {
    if (!card) return;
    const key = card.dataset.timer, previous = controllers.get(key); if (previous?.id) clearInterval(previous.id);
    const timer = { key, total, remaining: total, running: false, id: null }; controllers.set(key, timer);
    const display = $('.timer-display', card), bar = $('.timer-track i', card), toggle = $('.timer-toggle', card);
    const paint = () => { display.textContent = `${String(Math.floor(timer.remaining / 60)).padStart(2,'0')}:${String(timer.remaining % 60).padStart(2,'0')}`; bar.style.width = `${timer.total ? timer.remaining / timer.total * 100 : 0}%`; toggle.textContent = timer.running ? '一時停止' : 'スタート'; guidance(timer); };
    const stop = () => { if (timer.id) clearInterval(timer.id); timer.id = null; timer.running = false; paint(); };
    const tick = seconds => { const wasRunning = timer.remaining > 0; timer.remaining = Math.max(0, timer.remaining - seconds); if (timer.remaining === 0) { stop(); if (wasRunning) whistle(); } else paint(); };
    toggle.onclick = () => { if (timer.remaining === 0) timer.remaining = timer.total; timer.running = !timer.running; if (timer.running) timer.id = setInterval(() => tick(1), 1000); else stop(); paint(); };
    $('[data-reset-timer]', card).onclick = () => { stop(); timer.remaining = timer.total; paint(); };
    $('[data-skip-timer]', card).onclick = () => tick(30);
    paint();
  }
  function installAll() { const saved = state(); install($('[data-timer="strategy"]'), Math.max(1, Number(saved.strategyMinutes) || 5) * 60); install($('[data-timer="build"]'), Math.max(1, Number(saved.buildMinutes) || 25) * 60); install($('[data-timer="reflection"]'), 5 * 60); }
  $('#langBtn').addEventListener('click', () => setTimeout(installAll));
  $('#saveSetupBtn').addEventListener('click', () => setTimeout(installAll));
  installAll();
})();
