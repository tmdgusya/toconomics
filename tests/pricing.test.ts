import { describe, expect, it } from "vitest";
import { mergePricing, toPerMillionUsd } from "../src/lib/pricing";
import type { CuratedModel } from "../src/lib/models";

describe("toPerMillionUsd", () => {
  it("converts per-token USD string to per-1M-token number", () => {
    expect(toPerMillionUsd("0.000005")).toBe(5);
    expect(toPerMillionUsd("0.00003")).toBeCloseTo(30);
  });

  it("returns null for invalid or negative values", () => {
    expect(toPerMillionUsd("abc")).toBeNull();
    expect(toPerMillionUsd("-0.001")).toBeNull();
    expect(toPerMillionUsd("")).toBeNull();
  });
});

describe("mergePricing", () => {
  const curated: CuratedModel[] = [
    {
      id: "openai/gpt-5.5",
      name: "GPT-5.5",
      vendor: "OpenAI",
      fallbackUsd: { input: 5, output: 30 },
    },
    {
      id: "vendor/missing-model",
      name: "Missing",
      vendor: "Vendor",
      fallbackUsd: { input: 1, output: 2 },
    },
    { id: "vendor/no-fallback", name: "NoFallback", vendor: "Vendor" },
  ];

  const apiModels = [
    {
      id: "openai/gpt-5.5",
      pricing: { prompt: "0.000005", completion: "0.00003" },
    },
  ];

  it("uses API pricing when the model exists on OpenRouter", () => {
    const result = mergePricing(curated, apiModels);
    const gpt = result.find((m) => m.id === "openai/gpt-5.5");
    expect(gpt).toMatchObject({
      inputUsd: 5,
      outputUsd: 30,
      source: "openrouter",
    });
  });

  it("falls back to curated prices when the model is missing from the API", () => {
    const result = mergePricing(curated, apiModels);
    const missing = result.find((m) => m.id === "vendor/missing-model");
    expect(missing).toMatchObject({
      inputUsd: 1,
      outputUsd: 2,
      source: "fallback",
    });
  });

  it("skips models with no API data and no fallback", () => {
    const result = mergePricing(curated, apiModels);
    expect(result.find((m) => m.id === "vendor/no-fallback")).toBeUndefined();
  });

  it("preserves curated order", () => {
    const result = mergePricing(curated, apiModels);
    expect(result.map((m) => m.id)).toEqual([
      "openai/gpt-5.5",
      "vendor/missing-model",
    ]);
  });
});
