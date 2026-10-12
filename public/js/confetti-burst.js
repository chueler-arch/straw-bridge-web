(() => {
  'use strict';
  const host = document.querySelector('#confetti');
  if (!host) return;
  let scheduled = false;
  const applause = new Audio('audio/Applause04-2%28Mid%29.mp3');
  applause.preload = 'auto';

  function playApplause() {
    let sound = true;
    try {
      sound = JSON.parse(localStorage.getItem('straw-bridge-state-v1') || '{}').sound !== false;
    } catch {}
    if (!sound) return;
    applause.pause();
    applause.currentTime = 0;
    applause.play().catch(() => {});
  }

  function launch() {
    playApplause();
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canvas = document.createElement('canvas');
    canvas.className = 'celebration-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const colors = ['#f1aa2d', '#f7d35c', '#f2644b', '#49a6a6', '#ffffff', '#ed6fa6', '#79a9df'];
    let width, height, ratio;

    function resize() {
      width = innerWidth;
      height = innerHeight;
      ratio = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    resize();
    addEventListener('resize', resize);

    const particles = [];
    const amount = reduced ? 36 : Math.min(270, Math.max(180, Math.round(width / 7)));
    function burst(x, y, count, direction) {
      for (let index = 0; index < count; index += 1) {
        const speed = 12 + Math.random() * 14;
        const angle = -Math.PI * (.12 + Math.random() * .76);
        let vx = Math.cos(angle) * speed;
        if (direction === 1) vx = Math.abs(vx);
        else if (direction === -1) vx = -Math.abs(vx);
        particles.push({
          x, y, vx: vx + (Math.random() - .5) * 2,
          vy: Math.sin(angle) * speed - Math.random() * 4,
          gravity: .22 + Math.random() * .11,
          drag: .985 + Math.random() * .008,
          w: 7 + Math.random() * 8,
          h: 4 + Math.random() * 6,
          rotation: Math.random() * Math.PI * 2,
          spin: (Math.random() - .5) * .32,
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: .08 + Math.random() * .08,
          color: colors[Math.floor(Math.random() * colors.length)],
          opacity: 1,
          circle: Math.random() < .16
        });
      }
    }
    burst(width * .07, height * .88, Math.round(amount * .34), 1);
    burst(width * .93, height * .88, Math.round(amount * .34), -1);
    burst(width * .5, height * .72, Math.round(amount * .32), 0);

    let previous = performance.now();
    let age = 0;
    function draw(now) {
      const milliseconds = Math.min(34, now - previous);
      const step = milliseconds / 16.667;
      previous = now;
      age += milliseconds;
      ctx.clearRect(0, 0, width, height);
      let visible = 0;
      particles.forEach(particle => {
        particle.vx *= Math.pow(particle.drag, step);
        particle.vy = particle.vy * Math.pow(particle.drag, step) + particle.gravity * step;
        particle.x += particle.vx * step;
        particle.y += particle.vy * step;
        particle.rotation += particle.spin * step;
        particle.wobble += particle.wobbleSpeed * step;
        if (particle.y > height * .84) particle.opacity -= .016 * step;
        if (particle.opacity <= 0 || particle.y > height + 30) return;
        visible += 1;
        ctx.save();
        ctx.globalAlpha = Math.max(0, particle.opacity);
        ctx.translate(particle.x + Math.sin(particle.wobble) * 4, particle.y);
        ctx.rotate(particle.rotation);
        ctx.fillStyle = particle.color;
        const squash = Math.max(.18, Math.abs(Math.cos(particle.wobble)));
        if (particle.circle) {
          ctx.beginPath();
          ctx.arc(0, 0, particle.w * .42, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-particle.w / 2, -particle.h * squash / 2, particle.w, particle.h * squash);
        }
        ctx.restore();
      });
      if (visible && age < 6500) requestAnimationFrame(draw);
      else {
        removeEventListener('resize', resize);
        canvas.remove();
      }
    }
    requestAnimationFrame(draw);
  }

  new MutationObserver(records => {
    const added = records.some(record => [...record.addedNodes].some(node => node.nodeName === 'I'));
    if (!added || scheduled) return;
    scheduled = true;
    setTimeout(() => {
      scheduled = false;
      launch();
    }, 1150);
  }).observe(host, { childList: true });

  window.strawBridgeCelebrate = launch;
})();
