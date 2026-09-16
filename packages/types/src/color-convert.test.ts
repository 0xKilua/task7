import { describe, expect, it } from "vitest";
import { hexToLab, hexToRgb } from "./color-convert";

describe("hexToRgb", () => {
  it("parses pure colors", () => {
    expect(hexToRgb("#ffffff")).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb("#000000")).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb("#ff0000")).toEqual({ r: 255, g: 0, b: 0 });
  });

  it("rejects invalid hex", () => {
    expect(() => hexToRgb("not-a-color")).toThrow();
  });
});

describe("hexToLab", () => {
  it("maps white to L=100, a=0, b=0", () => {
    const lab = hexToLab("#ffffff");
    expect(lab.l).toBeCloseTo(100, 0);
    expect(lab.a).toBeCloseTo(0, 0);
    expect(lab.b).toBeCloseTo(0, 0);
  });

  it("maps black to L=0", () => {
    const lab = hexToLab("#000000");
    expect(lab.l).toBeCloseTo(0, 0);
  });

  it("maps mid-gray to a neutral chroma near zero", () => {
    const lab = hexToLab("#808080");
    expect(Math.abs(lab.a)).toBeLessThan(1);
    expect(Math.abs(lab.b)).toBeLessThan(1);
    expect(lab.l).toBeGreaterThan(40);
    expect(lab.l).toBeLessThan(65);
  });

  it("gives red a positive a* (green-red axis)", () => {
    const lab = hexToLab("#ff0000");
    expect(lab.a).toBeGreaterThan(50);
  });
});
