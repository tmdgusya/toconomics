export interface CuratedModel {
  /** OpenRouter model id (예: "openai/gpt-5.5") */
  id: string;
  name: string;
  vendor: string;
  /** OpenRouter에 없을 때 사용할 공식 가격 (1M 토큰당 USD) */
  fallbackUsd?: { input: number; output: number };
}

export const CURATED_MODELS: CuratedModel[] = [
  {
    id: "anthropic/claude-fable-5",
    name: "Claude Fable 5",
    vendor: "Anthropic",
    fallbackUsd: { input: 10, output: 50 },
  },
  {
    id: "openai/gpt-5.5",
    name: "GPT-5.5",
    vendor: "OpenAI",
    fallbackUsd: { input: 5, output: 30 },
  },
  {
    id: "anthropic/claude-opus-4.8",
    name: "Claude Opus 4.8",
    vendor: "Anthropic",
    fallbackUsd: { input: 5, output: 25 },
  },
  {
    id: "moonshotai/kimi-k2.7-code",
    name: "Kimi K2.7 Code",
    vendor: "Moonshot AI",
    fallbackUsd: { input: 0.95, output: 4 },
  },
  {
    id: "z-ai/glm-5.2",
    name: "GLM-5.2",
    vendor: "Z.ai",
    fallbackUsd: { input: 1.4, output: 4.4 },
  },
  {
    id: "deepseek/deepseek-v4-pro",
    name: "DeepSeek V4",
    vendor: "DeepSeek",
    fallbackUsd: { input: 0.435, output: 0.87 },
  },
  {
    id: "deepseek/deepseek-v4-flash",
    name: "DeepSeek V4 Flash",
    vendor: "DeepSeek",
    fallbackUsd: { input: 0.14, output: 0.28 },
  },
];
