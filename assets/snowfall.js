(() => {
  const canvas = document.querySelector('.snowfall');
  const context = canvas?.getContext('2d');
  if (!context) return;

  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const maxDepth = 22;
  const bankSpacing = 16;
  let frame = 0;
  let previousTime = 0;
  let width = 0;
  let height = 0;
  let flakes = [];
  let bank = new Float32Array(0);
  let bankPath;
  let bankFill;

  function shapeBank() {
    const path = new Path2D();
    const spacing = width / (bank.length - 1);
    path.moveTo(0, height - bank[0]);
    for (let i = 1; i < bank.length - 1; i++) {
      const midpoint = height - (bank[i] + bank[i + 1]) / 2;
      path.quadraticCurveTo(i * spacing, height - bank[i], (i + .5) * spacing, midpoint);
    }
    path.lineTo(width, height - bank[bank.length - 1]);
    path.lineTo(width, height);
    path.lineTo(0, height);
    path.closePath();
    return path;
  }

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    const density = Math.min(devicePixelRatio || 1, 2);
    width = bounds.width;
    height = bounds.height;
    canvas.width = Math.round(width * density);
    canvas.height = Math.round(height * density);
    context.scale(density, density);
    const columns = Math.max(2, Math.ceil(width / bankSpacing) + 1);
    if (bank.length !== columns) bank = new Float32Array(columns);
    bankPath = shapeBank();
    bankFill = context.createLinearGradient(0, height - maxDepth, 0, height);
    bankFill.addColorStop(0, '#fff');
    bankFill.addColorStop(1, '#c8d4ec');
    const count = Math.min(150, Math.ceil(width * height / 6200));
    flakes = Array.from({ length: count }, () => {
      const depth = Math.random();
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        radius: .85 + depth * 2.15,
        fall: 15 + depth * 30,
        drift: 5 + depth * 6,
        opacity: .28 + depth * .5,
        phase: Math.random() * 2 * Math.PI,
      };
    });
  }

  function draw(time) {
    const elapsed = previousTime ? Math.min((time - previousTime) / 1000, .05) : 0;
    previousTime = time;
    context.clearRect(0, 0, width, height);
    let bankChanged = false;
    for (const flake of flakes) {
      flake.phase += elapsed * .8;
      flake.x += (4 + Math.sin(flake.phase) * flake.drift) * elapsed;
      flake.y += flake.fall * elapsed;
      if (flake.x > width + flake.radius) flake.x = -flake.radius;
      if (flake.x < -flake.radius) flake.x = width + flake.radius;
      const column = Math.max(0, Math.min(bank.length - 1, Math.round(flake.x * (bank.length - 1) / width)));
      if (flake.y + flake.radius >= height - bank[column]) {
        for (let i = Math.max(0, column - 1); i <= Math.min(bank.length - 1, column + 1); i++) {
          const depth = Math.min(maxDepth, bank[i] + flake.radius * (i === column ? .8 : .35));
          if (bank[i] < maxDepth) {
            bank[i] = depth;
            bankChanged = true;
          }
        }
        flake.y = -flake.radius;
        flake.x = Math.random() * width;
      }

      context.beginPath();
      context.arc(flake.x, flake.y, flake.radius, 0, 2 * Math.PI);
      context.fillStyle = '#fff';
      context.globalAlpha = flake.opacity * .65;
      context.strokeStyle = '#7989b6';
      context.lineWidth = .65;
      context.stroke();
      context.globalAlpha = flake.opacity;
      context.fill();
    }
    if (bankChanged) bankPath = shapeBank();
    if (bankPath) {
      context.globalAlpha = .85;
      context.fillStyle = bankFill;
      context.fill(bankPath);
    }
    frame = requestAnimationFrame(draw);
  }

  function sync() {
    if (!motion.matches && !document.hidden) {
      if (!frame) frame = requestAnimationFrame(draw);
    } else {
      cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
      context.clearRect(0, 0, width, height);
    }
  }

  motion.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  new ResizeObserver(resize).observe(canvas);
  sync();
})();
