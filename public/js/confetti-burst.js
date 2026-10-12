(() => {
  'use strict';
  const box = document.querySelector('#confetti');
  if (!box) return;
  new MutationObserver(records => {
    const pieces = records.flatMap(record => [...record.addedNodes]).filter(node => node.nodeName === 'I');
    if (!pieces.length) return;
    pieces.forEach((piece, index) => {
      const angle = Math.random() * Math.PI * 2, distance = 260 + Math.random() * 520;
      const x1 = Math.cos(angle) * distance, y1 = Math.sin(angle) * distance * .58 - 120;
      piece.style.setProperty('--x1', `${x1}px`); piece.style.setProperty('--y1', `${y1}px`);
      piece.style.setProperty('--x2', `${x1 * 1.18}px`); piece.style.setProperty('--y2', `${y1 + 520 + Math.random() * 260}px`);
      const spin = 540 + Math.random() * 1080;
      piece.style.setProperty('--spin1', `${spin * .45}deg`); piece.style.setProperty('--spin', `${spin}deg`); piece.style.setProperty('--delay', `${Math.random() * .16}s`);
      piece.className = index % 5 === 0 ? 'confetti-star' : '';
    });
    if (!box.querySelector('.burst-ring')) { const ring = document.createElement('b'); ring.className = 'burst-ring'; box.append(ring); }
  }).observe(box, { childList: true });
})();
