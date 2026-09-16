import { describe, expect, it, vi } from "vitest";
import type { ClothingCatalogItem } from "@relook/types";
import { ClothingReplicateProvider } from "./clothing-replicate-provider";

const top: ClothingCatalogItem = {
  id: "c1",
  name: "T-shirt blanc",
  category: "haut",
  type: "tshirt",
  fit: "regular",
  color: "blanc",
  material: "coton",
  style: "casual",
  season: "toutes_saisons",
  occasion: "quotidien",
  tags: [],
  garmentImageUrl: "/tshirt.jpg",
};

const bottom: ClothingCatalogItem = {
  id: "c2",
  name: "Jean droit",
  category: "bas",
  type: "jean",
  fit: "droit",
  color: "bleu",
  material: "denim",
  style: "casual",
  season: "toutes_saisons",
  occasion: "quotidien",
  tags: [],
  garmentImageUrl: "/jean.jpg",
};

function jsonResponse(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body, text: async () => JSON.stringify(body) } as Response;
}

function imageResponse(byte: number) {
  return {
    ok: true,
    status: 200,
    arrayBuffer: async () => new Uint8Array([byte]).buffer,
  } as Response;
}

describe("ClothingReplicateProvider", () => {
  it("returns provider_not_configured without a token", async () => {
    const provider = new ClothingReplicateProvider({ apiToken: undefined });
    const result = await provider.generate({
      photoBuffer: Buffer.from(""),
      photoMimeType: "image/png",
      garments: [top],
    });
    expect(result.status).toBe("provider_not_configured");
  });

  it("fails fast when no garment is selected", async () => {
    const provider = new ClothingReplicateProvider({ apiToken: "tok" });
    const result = await provider.generate({
      photoBuffer: Buffer.from(""),
      photoMimeType: "image/png",
      garments: [],
    });
    expect(result.status).toBe("failed");
  });

  it("chains multiple garments sequentially through the provider", async () => {
    const fetchImpl = vi
      .fn()
      // garment 1: create + poll succeeded + download
      .mockResolvedValueOnce(jsonResponse({ id: "p1", status: "starting", output: null, error: null }))
      .mockResolvedValueOnce(
        jsonResponse({ id: "p1", status: "succeeded", output: "https://x/1.png", error: null }),
      )
      .mockResolvedValueOnce(imageResponse(1))
      // garment 2: create + poll succeeded + download
      .mockResolvedValueOnce(jsonResponse({ id: "p2", status: "starting", output: null, error: null }))
      .mockResolvedValueOnce(
        jsonResponse({ id: "p2", status: "succeeded", output: "https://x/2.png", error: null }),
      )
      .mockResolvedValueOnce(imageResponse(2));

    const provider = new ClothingReplicateProvider({
      apiToken: "tok",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    const result = await provider.generate({
      photoBuffer: Buffer.from("original"),
      photoMimeType: "image/jpeg",
      garments: [top, bottom],
    });

    expect(result.status).toBe("completed");
    if (result.status === "completed") {
      // Le dernier octet telecharge doit correspondre au 2e vetement (chaine sequentielle).
      expect(result.imageBuffer[0]).toBe(2);
    }
    expect(fetchImpl).toHaveBeenCalledTimes(6);
  });

  it("stops and returns failed if an intermediate garment fails", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ id: "p1", status: "starting", output: null, error: null }))
      .mockResolvedValueOnce(
        jsonResponse({ id: "p1", status: "failed", output: null, error: "echec garment 1" }),
      );

    const provider = new ClothingReplicateProvider({
      apiToken: "tok",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    const result = await provider.generate({
      photoBuffer: Buffer.from("original"),
      photoMimeType: "image/jpeg",
      garments: [top, bottom],
    });

    expect(result.status).toBe("failed");
    // Le 2e vetement ne doit jamais etre tente.
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});
