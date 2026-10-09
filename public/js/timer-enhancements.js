(() => {
  'use strict';
  const $ = (s, p = document) => p.querySelector(s);
  const stateKey = 'straw-bridge-state-v1';
  const controllers = new Map();
  function state() { try { return JSON.parse(localStorage.getItem(stateKey) || '{}'); } catch { return {}; } }
  function guidance(timer) {
    const box = $('#buildGuidance'); if (!box || timer.key !== 'build') return;
    const elapsed = timer.total - timer.remaining;
    let message = 'タイマーを開始すると、時間に合わせて案内を表示します。', level = 'ready';
    if (timer.remaining <= 300) { message = 'もうそろそろ、補強と架橋テストを始めてください。'; level = 'urgent'; }
    else if (elapsed >= 900) { message = '三角形のトラス構造の強度'; level = 'important'; }
    else if (elapsed >= 600) { message = 'もうそろそろ組み立てを始めてください。'; level = 'notice'; }
    $('strong', box).textContent = message; box.dataset.level = level;
  }
  function install(card, total) {
    if (!card) return;
    const key = card.dataset.timer, previous = controllers.get(key); if (previous?.id) clearInterval(previous.id);
    const timer = { key, total, remaining: total, running: false, id: null }; controllers.set(key, timer);
    const display = $('.timer-display', card), bar = $('.timer-track i', card), toggle = $('.timer-toggle', card);
    const paint = () => { display.textContent = `${String(Math.floor(timer.remaining / 60)).padStart(2,'0')}:${String(timer.remaining % 60).padStart(2,'0')}`; bar.style.width = `${timer.total ? timer.remaining / timer.total * 100 : 0}%`; toggle.textContent = timer.running ? '一時停止' : 'スタート'; guidance(timer); };
    const stop = () => { if (timer.id) clearInterval(timer.id); timer.id = null; timer.running = false; paint(); };
    const tick = seconds => { timer.remaining = Math.max(0, timer.remaining - seconds); if (timer.remaining === 0) stop(); else paint(); };
    toggle.onclick = () => { if (timer.remaining === 0) timer.remaining = timer.total; timer.running = !timer.running; if (timer.running) timer.id = setInterval(() => tick(1), 1000); else stop(); paint(); };
    $('[data-reset-timer]', card).onclick = () => { stop(); timer.remaining = timer.total; paint(); };
    $('[data-skip-timer]', card).onclick = () => tick(30);
    paint();
  }
  function installAll() { const saved = state(); install($('[data-timer="strategy"]'), Math.max(1, Number(saved.strategyMinutes) || 5) * 60); install($('[data-timer="build"]'), Math.max(1, Number(saved.buildMinutes) || 25) * 60); }
  $('#langBtn').addEventListener('click', () => setTimeout(installAll));
  $('#saveSetupBtn').addEventListener('click', () => setTimeout(installAll));
  installAll();
})();
