import { describe, expect, it, vi } from "vitest";
import { extractFirstImageUrl, ReplicateClient, ReplicateError } from "./replicate-client";

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

describe("extractFirstImageUrl", () => {
  it("handles a plain string output", () => {
    expect(extractFirstImageUrl("https://x/img.png")).toBe("https://x/img.png");
  });
  it("handles an array output", () => {
    expect(extractFirstImageUrl(["https://x/img.png", "https://x/other.png"])).toBe(
      "https://x/img.png",
    );
  });
  it("handles an object with an image field", () => {
    expect(extractFirstImageUrl({ image: "https://x/img.png" })).toBe("https://x/img.png");
  });
  it("returns null for unrecognized shapes", () => {
    expect(extractFirstImageUrl(null)).toBeNull();
    expect(extractFirstImageUrl(42)).toBeNull();
    expect(extractFirstImageUrl({})).toBeNull();
  });
});

describe("ReplicateClient.runModel", () => {
  it("polls until the prediction succeeds and returns it", async () => {
    const fetchImpl = vi
      .fn()
      // create
      .mockResolvedValueOnce(jsonResponse({ id: "pred_1", status: "starting", output: null, error: null }))
      // poll #1: still processing
      .mockResolvedValueOnce(
        jsonResponse({ id: "pred_1", status: "processing", output: null, error: null }),
      )
      // poll #2: succeeded
      .mockResolvedValueOnce(
        jsonResponse({
          id: "pred_1",
          status: "succeeded",
          output: "https://replicate.delivery/out.png",
          error: null,
        }),
      );

    const client = new ReplicateClient({
      apiToken: "tok",
      fetchImpl: fetchImpl as unknown as typeof fetch,
      pollIntervalMs: 1,
    });

    const prediction = await client.runModel("owner", "model", { image: "data:..." });
    expect(prediction.status).toBe("succeeded");
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(fetchImpl.mock.calls[0]?.[0]).toContain("/models/owner/model/predictions");
  });

  it("throws ReplicateError when creation is rejected", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(jsonResponse({ detail: "bad token" }, false, 401));
    const client = new ReplicateClient({
      apiToken: "bad",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    await expect(client.runModel("owner", "model", {})).rejects.toThrow(ReplicateError);
  });

  it("throws ReplicateError on poll timeout", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(jsonResponse({ id: "pred_1", status: "processing", output: null, error: null }));
    const client = new ReplicateClient({
      apiToken: "tok",
      fetchImpl: fetchImpl as unknown as typeof fetch,
      pollIntervalMs: 1,
      timeoutMs: 5,
    });
    await expect(client.runModel("owner", "model", {})).rejects.toThrow(/Delai d'attente/);
  });
});

describe("ReplicateClient.downloadOutputImage", () => {
  it("downloads the output image bytes", async () => {
    const imageBytes = new Uint8Array([137, 80, 78, 71]);
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: async () => imageBytes.buffer,
    } as unknown as Response);
    const client = new ReplicateClient({ apiToken: "tok", fetchImpl: fetchImpl as unknown as typeof fetch });
    const buffer = await client.downloadOutputImage({
      id: "p",
      status: "succeeded",
      output: "https://replicate.delivery/out.png",
      error: null,
    });
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBe(4);
  });

  it("throws when no output image url is present", async () => {
    const client = new ReplicateClient({ apiToken: "tok" });
    await expect(
      client.downloadOutputImage({ id: "p", status: "succeeded", output: null, error: null }),
    ).rejects.toThrow(ReplicateError);
  });
});
