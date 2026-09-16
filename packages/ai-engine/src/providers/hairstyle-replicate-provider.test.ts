import { describe, expect, it, vi } from "vitest";
import type { HairstyleCatalogItem } from "@relook/types";
import { HairstyleReplicateProvider, buildHairstylePrompt } from "./hairstyle-replicate-provider";

const hairstyle: HairstyleCatalogItem = {
  id: "h1",
  name: "Carre plongeant",
  description: "Carre plus court derriere",
  length: "courts",
  texture: "lisses",
  family: "carre_plongeant",
  tags: [],
  referenceImageUrl: "/x.jpg",
  transformParams: { strength: 0.5, preserveHairline: true },
  suitableForFraming: ["portrait"],
};

function jsonResponse(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body, text: async () => JSON.stringify(body) } as Response;
}

describe("buildHairstylePrompt", () => {
  it("includes the hairstyle name, length and texture", () => {
    const prompt = buildHairstylePrompt({
      photoBuffer: Buffer.from(""),
      photoMimeType: "image/png",
      hairstyle,
    });
    expect(prompt).toContain("Carre plongeant");
    expect(prompt).toContain("courts");
    expect(prompt).toContain("lisses");
  });
});

describe("HairstyleReplicateProvider", () => {
  it("returns provider_not_configured without an api token", async () => {
    const provider = new HairstyleReplicateProvider({ apiToken: undefined });
    const result = await provider.generate({
      photoBuffer: Buffer.from(""),
      photoMimeType: "image/png",
      hairstyle,
    });
    expect(result.status).toBe("provider_not_configured");
  });

  it("returns a completed result end-to-end with a mocked Replicate API", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ id: "p1", status: "starting", output: null, error: null }))
      .mockResolvedValueOnce(
        jsonResponse({ id: "p1", status: "succeeded", output: "https://replicate.delivery/out.png", error: null }),
      )
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
      } as Response);

    const provider = new HairstyleReplicateProvider({
      apiToken: "tok",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    const result = await provider.generate({
      photoBuffer: Buffer.from("fake-jpeg"),
      photoMimeType: "image/jpeg",
      hairstyle,
    });

    expect(result.status).toBe("completed");
    if (result.status === "completed") {
      expect(result.imageBuffer.length).toBe(3);
      expect(result.providerName).toBe("replicate");
    }
  });

  it("returns failed when Replicate reports a failure", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ id: "p1", status: "starting", output: null, error: null }))
      .mockResolvedValueOnce(
        jsonResponse({ id: "p1", status: "failed", output: null, error: "modele indisponible" }),
      );

    const provider = new HairstyleReplicateProvider({
      apiToken: "tok",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    const result = await provider.generate({
      photoBuffer: Buffer.from("fake-jpeg"),
      photoMimeType: "image/jpeg",
      hairstyle,
    });

    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.errorMessage).toContain("modele indisponible");
    }
  });
});
