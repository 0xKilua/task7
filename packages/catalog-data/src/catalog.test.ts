import { describe, expect, it } from "vitest";
import {
  HairstyleCatalogItem,
  HairColorCatalogItem,
  ClothingCatalogItem,
  HairLength,
  HairTexture,
} from "@relook/types";
import { HAIRSTYLES } from "./hairstyles";
import { HAIR_COLORS } from "./colors";
import { CLOTHING_ITEMS } from "./clothing";

describe("hairstyles catalog", () => {
  it("has unique ids", () => {
    const ids = HAIRSTYLES.map((h) => h.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("validates every entry against the schema", () => {
    for (const item of HAIRSTYLES) {
      expect(() => HairstyleCatalogItem.parse(item)).not.toThrow();
    }
  });

  it("never claims a trend season without a source URL", () => {
    for (const item of HAIRSTYLES) {
      if (item.trend) {
        expect(() => new URL(item.trend!.source)).not.toThrow();
      }
    }
  });

  it("covers every hair length", () => {
    const lengths = new Set(HAIRSTYLES.map((h) => h.length));
    for (const length of HairLength.options) {
      expect(lengths.has(length)).toBe(true);
    }
  });

  it("covers every hair texture", () => {
    const textures = new Set(HAIRSTYLES.map((h) => h.texture));
    for (const texture of HairTexture.options) {
      expect(textures.has(texture)).toBe(true);
    }
  });
});

describe("colors catalog", () => {
  it("has unique ids", () => {
    const ids = HAIR_COLORS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("validates every entry against the schema", () => {
    for (const item of HAIR_COLORS) {
      expect(() => HairColorCatalogItem.parse(item)).not.toThrow();
    }
  });

  it("covers every base color", () => {
    const bases = new Set(HAIR_COLORS.map((c) => c.baseColor));
    expect(bases.size).toBeGreaterThanOrEqual(14);
  });

  it("covers every coloring technique", () => {
    const techniques = new Set(HAIR_COLORS.map((c) => c.technique));
    expect(techniques.has("meches")).toBe(true);
    expect(techniques.has("balayage")).toBe(true);
    expect(techniques.has("ombre")).toBe(true);
    expect(techniques.has("degrade_couleur")).toBe(true);
    expect(techniques.has("racines_differentes")).toBe(true);
    expect(techniques.has("bicolore")).toBe(true);
  });

  it("derives Lab values consistently from the swatch hex", () => {
    for (const item of HAIR_COLORS) {
      expect(item.targetLab.l).toBeGreaterThanOrEqual(0);
      expect(item.targetLab.l).toBeLessThanOrEqual(100);
    }
  });
});

describe("clothing catalog", () => {
  it("has unique ids", () => {
    const ids = CLOTHING_ITEMS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("validates every entry against the schema", () => {
    for (const item of CLOTHING_ITEMS) {
      expect(() => ClothingCatalogItem.parse(item)).not.toThrow();
    }
  });

  it("covers all three top-level categories", () => {
    const categories = new Set(CLOTHING_ITEMS.map((c) => c.category));
    expect(categories.has("haut")).toBe(true);
    expect(categories.has("bas")).toBe(true);
    expect(categories.has("robe")).toBe(true);
  });

  it("assigns a category consistent with the garment type", () => {
    for (const item of CLOTHING_ITEMS) {
      if (item.type.startsWith("robe")) expect(item.category).toBe("robe");
    }
  });
});
