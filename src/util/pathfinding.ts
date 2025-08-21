// Grid de navegación y A* muy simple sobre celdas.
interface Node {
  x: number;
  y: number;
  g: number;
  f: number;
  parent?: Node;
}

export function buildNavGrid(worldW: number, worldH: number, cell: number, obstacles: any[]): number[][] {
  const cols = Math.ceil(worldW / cell);
  const rows = Math.ceil(worldH / cell);
  const grid: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));
  obstacles.forEach(o => {
    const x = (o.x ?? 0) as number;
    const y = (o.y ?? 0) as number;
    const c = Math.floor(x / cell);
    const r = Math.floor(y / cell);
    if (r >= 0 && r < rows && c >= 0 && c < cols) grid[r][c] = 1; // bloqueado
  });
  return grid;
}

export function findPath(grid: number[][], cell: number, sx: number, sy: number, tx: number, ty: number): { x: number; y: number }[] {
  const cols = grid[0].length;
  const rows = grid.length;
  const startC = Math.floor(sx / cell), startR = Math.floor(sy / cell);
  const endC = Math.floor(tx / cell), endR = Math.floor(ty / cell);
  function h(c: number, r: number) { return Math.abs(c - endC) + Math.abs(r - endR); }
  const open: Node[] = [{ x: startC, y: startR, g: 0, f: h(startC, startR) }];
  const visited = new Set<string>();
  const key = (c: number, r: number) => `${c},${r}`;

  while (open.length) {
    open.sort((a, b) => a.f - b.f);
    const cur = open.shift()!;
    if (cur.x === endC && cur.y === endR) {
      const path: { x: number; y: number }[] = [];
      let n: Node | undefined = cur;
      while (n) { path.push({ x: n.x * cell + cell / 2, y: n.y * cell + cell / 2 }); n = n.parent; }
      return path.reverse();
    }
    visited.add(key(cur.x, cur.y));
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    for (const [dx, dy] of dirs) {
      const nx = cur.x + dx, ny = cur.y + dy;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
      if (grid[ny][nx] === 1) continue;
      const k = key(nx, ny);
      if (visited.has(k)) continue;
      const g = cur.g + 1;
      let node = open.find(n => n.x === nx && n.y === ny);
      if (!node) {
        node = { x: nx, y: ny, g, f: g + h(nx, ny), parent: cur };
        open.push(node);
      } else if (g < node.g) {
        node.g = g;
        node.f = g + h(nx, ny);
        node.parent = cur;
      }
    }
  }
  return [];
}
