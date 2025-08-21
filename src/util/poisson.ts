// Poisson-disk sampling simple para distribución de puntos.
export interface PoissonOptions {
  width: number;
  height: number;
  radius: number; // distancia mínima
  maxPoints: number;
  reject?: number; // intentos por punto
  margin?: number; // margen central a evitar
}

interface Sample { x: number; y: number; }

export function poissonSample(opts: PoissonOptions): Sample[] {
  const { width, height, radius, maxPoints, reject = 30, margin = 0 } = opts;
  const cellSize = radius / Math.SQRT2;
  const gridW = Math.ceil(width / cellSize);
  const gridH = Math.ceil(height / cellSize);
  const grid: (Sample | null)[] = new Array(gridW * gridH).fill(null);
  const samples: Sample[] = [];
  const active: Sample[] = [];

  function inCenter(x: number, y: number) {
    if (margin <= 0) return false;
    const cx = width / 2, cy = height / 2;
    return Math.hypot(x - cx, y - cy) < margin;
  }

  function gridIndex(x: number, y: number) {
    const gx = Math.floor(x / cellSize);
    const gy = Math.floor(y / cellSize);
    return gy * gridW + gx;
  }

  function fits(x: number, y: number) {
    if (x < 0 || y < 0 || x >= width || y >= height) return false;
    if (inCenter(x, y)) return false;
    const gx = Math.floor(x / cellSize);
    const gy = Math.floor(y / cellSize);
    const r2 = radius * radius;
    for (let oy = -2; oy <= 2; oy++) {
      for (let ox = -2; ox <= 2; ox++) {
        const nx = gx + ox;
        const ny = gy + oy;
        if (nx < 0 || ny < 0 || nx >= gridW || ny >= gridH) continue;
        const s = grid[ny * gridW + nx];
        if (!s) continue;
        const dx = s.x - x;
        const dy = s.y - y;
        if (dx * dx + dy * dy < r2) return false;
      }
    }
    return true;
  }

  function addSample(x: number, y: number) {
    const s = { x, y };
    samples.push(s);
    active.push(s);
    grid[gridIndex(x, y)] = s;
  }

  addSample(Math.random() * width, Math.random() * height);

  while (active.length && samples.length < maxPoints) {
    const idx = Math.floor(Math.random() * active.length);
    const base = active[idx];
    let added = false;
    for (let i = 0; i < reject; i++) {
      const ang = Math.random() * Math.PI * 2;
      const mag = radius * (1 + Math.random());
      const x = base.x + Math.cos(ang) * mag;
      const y = base.y + Math.sin(ang) * mag;
      if (fits(x, y)) {
        addSample(x, y);
        added = true;
        break;
      }
    }
    if (!added) active.splice(idx, 1);
  }

  return samples.slice(0, maxPoints);
}
