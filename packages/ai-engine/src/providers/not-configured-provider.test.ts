import { describe, expect, it } from "vitest";
import type { HairstyleCatalogItem, ClothingCatalogItem } from "@relook/types";
import { NotConfiguredClothingProvider, NotConfiguredHairstyleProvider } from "./not-configured-provider";

const hairstyle: HairstyleCatalogItem = {
  id: "h1",
  name: "Carre",
  description: "desc",
  length: "courts",
  texture: "lisses",
  family: "carre",
  tags: [],
  referenceImageUrl: "/x.jpg",
  transformParams: { strength: 0.5, preserveHairline: true },
  suitableForFraming: ["portrait"],
};

const garment: ClothingCatalogItem = {
  id: "c1",
  name: "T-shirt",
  category: "haut",
  type: "tshirt",
  fit: "regular",
  color: "blanc",
  material: "coton",
  style: "casual",
  season: "toutes_saisons",
  occasion: "quotidien",
  tags: [],
  garmentImageUrl: "/g.jpg",
};

describe("NotConfiguredHairstyleProvider", () => {
  it("never claims success", async () => {
    const provider = new NotConfiguredHairstyleProvider();
    expect(provider.isConfigured()).toBe(false);
    const result = await provider.generate({
      photoBuffer: Buffer.from(""),
      photoMimeType: "image/png",
      hairstyle,
    });
    expect(result.status).toBe("provider_not_configured");
  });
});

describe("NotConfiguredClothingProvider", () => {
  it("never claims success", async () => {
    const provider = new NotConfiguredClothingProvider();
    expect(provider.isConfigured()).toBe(false);
    const result = await provider.generate({
      photoBuffer: Buffer.from(""),
      photoMimeType: "image/png",
      garments: [garment],
    });
    expect(result.status).toBe("provider_not_configured");
  });
});
