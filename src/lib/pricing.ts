import { CURATED_MODELS, type CuratedModel } from "./models";

const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";

export interface OpenRouterModel {
  id: string;
  pricing: { prompt: string; completion: string };
}

export interface ModelPrice {
  id: string;
  name: string;
  vendor: string;
  /** 1M 토큰당 USD */
  inputUsd: number;
  outputUsd: number;
  source: "openrouter" | "fallback";
}

/** OpenRouter의 토큰 1개당 USD 문자열을 1M 토큰당 USD 숫자로 변환 */
export function toPerMillionUsd(perToken: string): number | null {
  if (perToken.trim() === "") return null;
  const n = Number(perToken);
  if (!Number.isFinite(n) || n < 0) return null;
  return n * 1_000_000;
}

export function mergePricing(
  curated: CuratedModel[],
  apiModels: OpenRouterModel[],
): ModelPrice[] {
  const byId = new Map(apiModels.map((m) => [m.id, m]));
  const result: ModelPrice[] = [];

  for (const c of curated) {
    const api = byId.get(c.id);
    const inputUsd = api ? toPerMillionUsd(api.pricing.prompt) : null;
    const outputUsd = api ? toPerMillionUsd(api.pricing.completion) : null;

    if (inputUsd !== null && outputUsd !== null) {
      result.push({
        id: c.id,
        name: c.name,
        vendor: c.vendor,
        inputUsd,
        outputUsd,
        source: "openrouter",
      });
    } else if (c.fallbackUsd) {
      result.push({
        id: c.id,
        name: c.name,
        vendor: c.vendor,
        inputUsd: c.fallbackUsd.input,
        outputUsd: c.fallbackUsd.output,
        source: "fallback",
      });
    }
  }

  return result;
}

export async function getModelPrices(): Promise<ModelPrice[]> {
  try {
    const res = await fetch(OPENROUTER_MODELS_URL, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`OpenRouter API failed: ${res.status}`);
    const data: { data: OpenRouterModel[] } = await res.json();
    return mergePricing(CURATED_MODELS, data.data);
  } catch {
    // API 장애 시에도 fallback 가격으로 테이블은 렌더링
    return mergePricing(CURATED_MODELS, []);
  }
}
