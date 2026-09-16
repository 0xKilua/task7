import { describe, expect, it } from "vitest";
import { getClothingProvider, getHairstyleProvider } from "./factory";

describe("provider factory", () => {
  it("falls back to not-configured providers without a token", () => {
    const hairstyle = getHairstyleProvider({});
    const clothing = getClothingProvider({});
    expect(hairstyle.name).toBe("not_configured");
    expect(clothing.name).toBe("not_configured");
    expect(hairstyle.isConfigured()).toBe(false);
    expect(clothing.isConfigured()).toBe(false);
  });

  it("selects the replicate provider when a token is present", () => {
    const hairstyle = getHairstyleProvider({ REPLICATE_API_TOKEN: "tok_123" });
    const clothing = getClothingProvider({ REPLICATE_API_TOKEN: "tok_123" });
    expect(hairstyle.name).toBe("replicate");
    expect(clothing.name).toBe("replicate");
    expect(hairstyle.isConfigured()).toBe(true);
    expect(clothing.isConfigured()).toBe(true);
  });

  it("respects an explicit unknown AI_PROVIDER by falling back safely", () => {
    const hairstyle = getHairstyleProvider({
      AI_PROVIDER: "some_future_provider",
      REPLICATE_API_TOKEN: "tok_123",
    });
    expect(hairstyle.name).toBe("not_configured");
  });
});
