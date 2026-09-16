import type { LabColor } from "./hair";

/**
 * Conversion sRGB (D65) -> CIE Lab, utilisee pour derive une reference
 * colorimetrique coherente a partir d'un swatch hexadecimal defini par un
 * admin du catalogue. Implementation standard (pas d'approximation
 * "au pif") pour que la recoloration reelle (packages/vision) parte d'une
 * cible physiquement correcte.
 */

function srgbChannelToLinear(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function labFCompand(t: number): number {
  const delta = 6 / 29;
  return t > delta ** 3 ? Math.cbrt(t) : t / (3 * delta ** 2) + 4 / 29;
}

// D65 reference white
const XN = 95.047;
const YN = 100.0;
const ZN = 108.883;

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) {
    throw new Error(`Hex color invalide: ${hex}`);
  }
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

export function hexToLab(hex: string): LabColor {
  const { r, g, b } = hexToRgb(hex);
  const rl = srgbChannelToLinear(r);
  const gl = srgbChannelToLinear(g);
  const bl = srgbChannelToLinear(b);

  // sRGB -> XYZ (D65)
  const x = (rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375) * 100;
  const y = (rl * 0.2126729 + gl * 0.7151522 + bl * 0.072175) * 100;
  const z = (rl * 0.0193339 + gl * 0.119192 + bl * 0.9503041) * 100;

  const fx = labFCompand(x / XN);
  const fy = labFCompand(y / YN);
  const fz = labFCompand(z / ZN);

  const l = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const bb = 200 * (fy - fz);

  return {
    l: Math.round(l * 100) / 100,
    a: Math.round(a * 100) / 100,
    b: Math.round(bb * 100) / 100,
  };
}
