import { describe, expect, it } from "vitest";
import {
  isValidSilhouetteDelta,
  silhouetteSteps,
  silhouetteResultLabel,
  SILHOUETTE_DISCLAIMER,
} from "./silhouette";

describe("silhouette deltas", () => {
  it("accepts multiples of 2kg within bounds", () => {
    expect(isValidSilhouetteDelta(0)).toBe(true);
    expect(isValidSilhouetteDelta(-6)).toBe(true);
    expect(isValidSilhouetteDelta(20)).toBe(true);
    expect(isValidSilhouetteDelta(-20)).toBe(true);
  });

  it("rejects non-multiples of 2kg", () => {
    expect(isValidSilhouetteDelta(1)).toBe(false);
    expect(isValidSilhouetteDelta(-3)).toBe(false);
    expect(isValidSilhouetteDelta(2.5)).toBe(false);
  });

  it("rejects out-of-range deltas", () => {
    expect(isValidSilhouetteDelta(22)).toBe(false);
    expect(isValidSilhouetteDelta(-22)).toBe(false);
  });

  it("generates a symmetric step list including 0", () => {
    const steps = silhouetteSteps();
    expect(steps[0]).toBe(-20);
    expect(steps.at(-1)).toBe(20);
    expect(steps).toContain(0);
    expect(steps.every((s) => s % 2 === 0)).toBe(true);
  });

  it("never phrases the label as a medical prediction", () => {
    const label = silhouetteResultLabel(-6);
    expect(label).toContain("Simulation visuelle indicative");
    expect(label.toLowerCase()).not.toContain("exactement");
  });

  it("original photo label for 0kg", () => {
    expect(silhouetteResultLabel(0)).toBe("Photo originale");
  });

  it("exposes a non-medical disclaimer", () => {
    expect(SILHOUETTE_DISCLAIMER.toLowerCase()).toContain("non medicale");
  });
});
