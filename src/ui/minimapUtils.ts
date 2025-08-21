export interface MinimapRect { x: number; y: number; w: number; h: number; }
export interface MinimapTransform {
  scaleX: number;
  scaleY: number;
  originX: number;
  originY: number;
}

export function computeMinimapTransform(
  miniRect: MinimapRect,
  miniZoom: number,
  worldW: number,
  worldH: number,
  focusX: number,
  focusY: number
): MinimapTransform {
  const baseScaleX = miniRect.w / worldW;
  const baseScaleY = miniRect.h / worldH;
  const scaleX = baseScaleX * miniZoom;
  const scaleY = baseScaleY * miniZoom;
  const halfW = miniRect.w / (2 * scaleX);
  const halfH = miniRect.h / (2 * scaleY);
  const originX = Math.floor(clamp(focusX - halfW, 0, Math.max(0, worldW - 2 * halfW)) || 0);
  const originY = Math.floor(clamp(focusY - halfH, 0, Math.max(0, worldH - 2 * halfH)) || 0);
  return { scaleX, scaleY, originX, originY };
}

function clamp(v: number, min: number, max: number) {
  return v < min ? min : (v > max ? max : v);
}
