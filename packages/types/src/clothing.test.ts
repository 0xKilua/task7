import { describe, expect, it } from "vitest";
import { isOutfitSelectionValid } from "./clothing";

describe("outfit selection validity", () => {
  it("rejects empty selection", () => {
    expect(isOutfitSelectionValid({})).toBe(false);
  });

  it("accepts haut+bas combination", () => {
    expect(isOutfitSelectionValid({ haut: "h1", bas: "b1" })).toBe(true);
  });

  it("accepts a dress alone", () => {
    expect(isOutfitSelectionValid({ robe: "r1" })).toBe(true);
  });

  it("accepts a dress with an outer layer", () => {
    expect(isOutfitSelectionValid({ robe: "r1", vesteSurCouche: "v1" })).toBe(true);
  });

  it("rejects a dress combined with haut or bas", () => {
    expect(isOutfitSelectionValid({ robe: "r1", haut: "h1" })).toBe(false);
    expect(isOutfitSelectionValid({ robe: "r1", bas: "b1" })).toBe(false);
  });
});
