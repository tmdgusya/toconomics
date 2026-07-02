# toconomics 원화 LLM 토큰 가격 비교 사이트 Implementation Plan

> **Worker note:** Execute this plan task-by-task using the run-plan skill or subagents. Each step uses checkbox (`- [ ]`) syntax for progress tracking.

**Goal:** SOTA LLM 모델들의 토큰 가격(USD)을 원/달러 환율로 환산해 비교 테이블로 보여주는 Next.js 사이트를 만든다.

**Architecture:** Next.js App Router 서버 컴포넌트에서 OpenRouter Models API(가격)와 open.er-api.com(환율)을 fetch하고, Next의 fetch 캐시(`revalidate`)로 서버사이드 캐싱한다. 큐레이션된 모델 목록(코드 내 배열)과 API 응답을 병합하는 순수 함수를 데이터 레이어로 분리해 vitest로 단위 테스트한다. 디자인 토큰은 Tailwind v4 `@theme`으로 정의한다(오프화이트 paper / 블랙 ink / 레드 accent, 뉴스페이퍼 무드).

**Tech Stack:** Next.js 15+ (App Router, TypeScript, src-dir), Tailwind CSS v4, vitest, next/font (Noto Serif KR, IBM Plex Sans KR, IBM Plex Mono)

**Work Scope:**
- **In scope:** 가격 비교 테이블 단일 페이지, OpenRouter 가격 자동 수집 + 큐레이션 필터, 환율 일 1회 자동 갱신(서버 캐시), 원화 + USD 병기, 환율 갱신 시각 표시, 디자인 토큰 체계, 데이터 레이어 단위 테스트
- **Out of scope:** 비용 계산기, 시계열 차트, 캐시 가격/컨텍스트 윈도우 컬럼, 사용자 계정, 다국어, Vercel 배포 자체(배포 준비까지만)

**Verification Strategy:**
- **Level:** test-suite + build
- **Command:** `npm run test && npm run build`
- **What it validates:** 데이터 변환/병합 로직의 정확성(vitest) + 전체 앱이 타입 에러·린트 에러 없이 프로덕션 빌드됨

---

## File Structure

```
toconomics/
├── package.json                  # Task 1 (create-next-app + vitest)
├── vitest.config.ts              # Task 1
├── src/
│   ├── app/
│   │   ├── globals.css           # Task 3 (디자인 토큰)
│   │   ├── layout.tsx            # Task 3 (폰트, 메타데이터)
│   │   └── page.tsx              # Task 4 (데이터 fetch + 조립)
│   ├── components/
│   │   └── PriceTable.tsx        # Task 4
│   └── lib/
│       ├── fx.ts                 # Task 2 (환율)
│       ├── models.ts             # Task 2 (큐레이션 목록)
│       └── pricing.ts            # Task 2 (가격 fetch/변환/병합)
├── tests/
│   └── pricing.test.ts           # Task 2
└── docs/engineering-discipline/  # 기존 (건드리지 않음)
```

---

### Task 1: 프로젝트 스캐폴딩 + 검증 인프라

**Dependencies:** None (첫 번째 태스크)
**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `src/app/*` (create-next-app 산출물)
- Create: `vitest.config.ts`

- [ ] **Step 1: create-next-app으로 현재 디렉터리에 스캐폴딩**

주의: 현재 디렉터리에 `docs/` 폴더가 이미 있어 create-next-app이 비어있지 않다고 거부할 수 있다. 그 경우 임시 폴더에 생성 후 내용물을 이동한다.

Run (PowerShell):

```powershell
npx create-next-app@latest scaffold --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes
Get-ChildItem -Force scaffold | Where-Object Name -ne ".git" | Move-Item -Destination .
Remove-Item -Recurse -Force scaffold
```

Expected: `package.json`, `src/app/page.tsx`, `src/app/globals.css` 등이 워크스페이스 루트에 생성됨. `git status`에 새 파일들이 보임 (git repo가 없다면 `git init` 먼저 실행).

- [ ] **Step 2: vitest 설치**

Run: `npm install -D vitest`
Expected: `package.json` devDependencies에 vitest 추가됨

- [ ] **Step 3: vitest 설정 파일 작성**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
  },
});
```

- [ ] **Step 4: package.json에 test 스크립트 추가**

`package.json`의 `scripts`에 다음 항목 추가:

```json
"test": "vitest run"
```

- [ ] **Step 5: 검증 인프라 동작 확인**

Run: `npm run test`
Expected: "No test files found" 류의 메시지와 함께 실패 또는 통과 — vitest가 실행된다는 사실만 확인 (테스트는 Task 2에서 추가)

Run: `npm run build`
Expected: 스캐폴드 기본 페이지가 에러 없이 빌드됨

- [ ] **Step 6: Commit**

```powershell
git add -A
git commit -m "chore: scaffold Next.js app with vitest verification setup"
```

---

### Task 2: 데이터 레이어 (환율 + 가격 + 큐레이션)

**Dependencies:** Task 1 완료 후 (Task 3과 병렬 실행 가능)
**Files:**
- Create: `src/lib/fx.ts`
- Create: `src/lib/models.ts`
- Create: `src/lib/pricing.ts`
- Test: `tests/pricing.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

Create `tests/pricing.test.ts`:

```ts
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
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm run test`
Expected: FAIL — `src/lib/pricing` 모듈이 없어서 import 에러

- [ ] **Step 3: 큐레이션 모델 목록 작성**

Create `src/lib/models.ts`:

```ts
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
    id: "deepseek/deepseek-v4",
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
```

- [ ] **Step 4: 실제 OpenRouter 모델 ID 확인 및 보정**

위 배열의 `id` 값은 후보 추정치다. 라이브 API에서 실제 ID를 확인하고 다르면 `models.ts`의 `id`를 수정한다 (name/vendor/fallbackUsd는 유지).

Run (PowerShell):

```powershell
node -e "fetch('https://openrouter.ai/api/v1/models').then(r=>r.json()).then(d=>d.data.map(m=>m.id).filter(id=>/fable|opus|gpt-5|kimi|glm|deepseek/i.test(id)).forEach(id=>console.log(id)))"
```

Expected: 매칭되는 모델 ID 목록 출력. 각 큐레이션 모델에 대해 가장 가까운 실제 ID로 교체. API에 존재하지 않는 모델(예: Fable 5가 OpenRouter에 없는 경우)은 ID를 그대로 두면 fallback 가격으로 표시되므로 문제 없음.

- [ ] **Step 5: 가격 모듈 구현**

Create `src/lib/pricing.ts`:

```ts
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
```

- [ ] **Step 6: 환율 모듈 구현**

Create `src/lib/fx.ts`:

```ts
const FX_URL = "https://open.er-api.com/v6/latest/USD";

export interface FxRate {
  krwPerUsd: number;
  /** 예: "Fri, 03 Jul 2026 00:02:31 +0000" */
  lastUpdatedUtc: string;
}

export async function getUsdKrwRate(): Promise<FxRate> {
  const res = await fetch(FX_URL, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`FX API failed: ${res.status}`);
  const data = await res.json();
  if (data.result !== "success" || typeof data.rates?.KRW !== "number") {
    throw new Error("FX API returned unexpected payload");
  }
  return {
    krwPerUsd: data.rates.KRW,
    lastUpdatedUtc: data.time_last_update_utc,
  };
}
```

- [ ] **Step 7: 테스트 통과 확인**

Run: `npm run test`
Expected: PASS — 전체 테스트 통과

- [ ] **Step 8: Commit**

```powershell
git add src/lib tests
git commit -m "feat: add pricing and fx data layer with curated SOTA model list"
```

---

### Task 3: 디자인 토큰 + 레이아웃

**Dependencies:** Task 1 완료 후 (Task 2와 병렬 실행 가능)
**Files:**
- Modify: `src/app/globals.css` (전체 교체)
- Modify: `src/app/layout.tsx` (전체 교체)

디자인 방향: 레퍼런스 2번 이미지 — 오프화이트 신문지 바탕, 블랙 잉크 모노크롬, 강렬한 레드 액센트, 증시 차트/뉴스페이퍼 콜라주 무드. 세리프 헤드라인 + 모노스페이스 숫자.

- [ ] **Step 1: globals.css를 디자인 토큰 체계로 교체**

Replace `src/app/globals.css` 전체 내용:

```css
@import "tailwindcss";

@theme {
  /* 색상 — 레퍼런스 2번: 신문지 오프화이트 / 블랙 잉크 / 증시 레드 */
  --color-paper: #f2ede1;
  --color-paper-deep: #e8e1cf;
  --color-ink: #141414;
  --color-ink-soft: #55524a;
  --color-line: rgba(20, 20, 20, 0.16);
  --color-accent: #d0342c;
  --color-accent-deep: #a02015;

  /* 타이포그래피 */
  --font-display: var(--font-noto-serif-kr), serif;
  --font-sans: var(--font-plex-sans-kr), sans-serif;
  --font-numeric: var(--font-plex-mono), monospace;
}

body {
  background-color: var(--color-paper);
  color: var(--color-ink);
  font-family: var(--font-sans);
}
```

- [ ] **Step 2: layout.tsx를 폰트/메타데이터 포함 버전으로 교체**

Replace `src/app/layout.tsx` 전체 내용:

```tsx
import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans_KR, Noto_Serif_KR } from "next/font/google";
import "./globals.css";

const serif = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["600", "900"],
  variable: "--font-noto-serif-kr",
});

const sans = IBM_Plex_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-plex-sans-kr",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: "toconomics — 원화로 보는 LLM 토큰 가격",
  description:
    "SOTA LLM 모델들의 토큰 가격을 오늘의 원/달러 환율로 환산해 비교합니다.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ko"
      className={`${serif.variable} ${sans.variable} ${mono.variable}`}
    >
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: 빌드 확인**

Run: `npm run build`
Expected: 에러 없이 빌드 (page.tsx는 아직 스캐폴드 기본 상태여도 무방)

- [ ] **Step 4: Commit**

```powershell
git add src/app/globals.css src/app/layout.tsx
git commit -m "feat: add newspaper-style design tokens and Korean typography"
```

---

### Task 4: 가격 테이블 UI + 페이지 조립

**Dependencies:** Task 2, Task 3 완료 후
**Files:**
- Create: `src/components/PriceTable.tsx`
- Modify: `src/app/page.tsx` (전체 교체)

- [ ] **Step 1: PriceTable 컴포넌트 작성**

Create `src/components/PriceTable.tsx`:

```tsx
import type { FxRate } from "@/lib/fx";
import type { ModelPrice } from "@/lib/pricing";

const krwFmt = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 });
const usdFmt = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function PriceCell({ usd, krwPerUsd }: { usd: number; krwPerUsd: number }) {
  return (
    <td className="px-4 py-4 text-right align-baseline">
      <span className="font-[family-name:var(--font-numeric)] text-lg font-semibold">
        ₩{krwFmt.format(usd * krwPerUsd)}
      </span>
      <span className="ml-2 font-[family-name:var(--font-numeric)] text-xs text-ink-soft">
        ${usdFmt.format(usd)}
      </span>
    </td>
  );
}

export function PriceTable({
  prices,
  fx,
}: {
  prices: ModelPrice[];
  fx: FxRate;
}) {
  return (
    <table className="w-full border-t-4 border-ink">
      <thead>
        <tr className="border-b-2 border-ink text-left text-xs uppercase tracking-widest text-ink-soft">
          <th className="px-4 py-3 font-medium">모델</th>
          <th className="px-4 py-3 text-right font-medium">
            입력 <span className="normal-case">/ 1M 토큰</span>
          </th>
          <th className="px-4 py-3 text-right font-medium">
            출력 <span className="normal-case">/ 1M 토큰</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {prices.map((p) => (
          <tr
            key={p.id}
            className="border-b border-line transition-colors hover:bg-paper-deep"
          >
            <td className="px-4 py-4">
              <div className="font-[family-name:var(--font-display)] text-lg font-semibold">
                {p.name}
              </div>
              <div className="text-xs text-ink-soft">
                {p.vendor}
                {p.source === "fallback" && (
                  <span className="ml-1.5 text-accent" title="공식 고시가 기준">
                    ※ 고시가
                  </span>
                )}
              </div>
            </td>
            <PriceCell usd={p.inputUsd} krwPerUsd={fx.krwPerUsd} />
            <PriceCell usd={p.outputUsd} krwPerUsd={fx.krwPerUsd} />
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 2: page.tsx를 메인 화면으로 교체**

Replace `src/app/page.tsx` 전체 내용:

```tsx
import { PriceTable } from "@/components/PriceTable";
import { getUsdKrwRate } from "@/lib/fx";
import { getModelPrices } from "@/lib/pricing";

export const revalidate = 3600;

const krwFmt = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 2 });

export default async function Home() {
  const [prices, fx] = await Promise.all([getModelPrices(), getUsdKrwRate()]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-14">
      <header className="mb-10">
        <p className="mb-2 text-xs uppercase tracking-[0.3em] text-accent">
          Token Economics Daily
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-5xl font-black tracking-tight">
          toconomics
        </h1>
        <p className="mt-3 text-sm text-ink-soft">
          SOTA LLM 토큰 가격을 오늘의 원/달러 환율로 환산해 비교합니다.
        </p>
        <div className="mt-6 flex items-baseline gap-3 border-y-2 border-ink py-3">
          <span className="text-xs uppercase tracking-widest text-ink-soft">
            오늘의 환율
          </span>
          <span className="font-[family-name:var(--font-numeric)] text-2xl font-semibold text-accent">
            $1 = ₩{krwFmt.format(fx.krwPerUsd)}
          </span>
          <span className="ml-auto text-xs text-ink-soft">
            갱신: {fx.lastUpdatedUtc}
          </span>
        </div>
      </header>

      <PriceTable prices={prices} fx={fx} />

      <footer className="mt-10 space-y-1 text-xs text-ink-soft">
        <p>
          가격 출처: OpenRouter Models API (경유가 기준, ※ 표시는 공식 고시가) ·
          1M 토큰당 가격
        </p>
        <p>
          환율 출처:{" "}
          <a
            href="https://www.exchangerate-api.com"
            className="underline decoration-accent underline-offset-2"
          >
            Rates by Exchange Rate API
          </a>{" "}
          (일 1회 갱신)
        </p>
      </footer>
    </main>
  );
}
```

- [ ] **Step 3: 로컬 렌더링 확인**

Run: `npm run dev` (백그라운드 실행 후 브라우저 또는 curl로 확인)

```powershell
curl.exe -s http://localhost:3000 | Select-String "toconomics"
```

Expected: HTML에 "toconomics" 헤드라인, 모델명들, ₩ 가격이 포함됨. 확인 후 dev 서버 종료.

- [ ] **Step 4: Commit**

```powershell
git add src/components src/app/page.tsx
git commit -m "feat: add KRW price comparison table page"
```

---

### Task 5 (Final): End-to-End Verification

**Dependencies:** All preceding tasks
**Files:** None (read-only verification)

- [ ] **Step 1: Run highest-level verification**

Run: `npm run test && npm run build`
Expected: ALL PASS — 테스트 전체 통과 + 프로덕션 빌드 성공

- [ ] **Step 2: Verify plan success criteria**

`npm run start`로 프로덕션 서버를 띄우고 http://localhost:3000 에서 수동 확인:

- [ ] 큐레이션된 SOTA 모델들의 입력/출력 가격이 원화(+USD 병기)로 테이블에 표시된다
- [ ] 상단에 오늘의 환율($1 = ₩X,XXX)과 환율 갱신 시각이 표시된다
- [ ] OpenRouter에 없는 모델은 "※ 고시가" 표기와 함께 fallback 가격으로 표시된다
- [ ] 디자인이 오프화이트 바탕 + 블랙 잉크 + 레드 액센트 토큰으로 렌더링된다
- [ ] 푸터에 Exchange Rate API 출처 표기(링크)가 있다

- [ ] **Step 3: Run full test suite for regressions**

Run: `npm run test`
Expected: No regressions — 전체 통과

- [ ] **Step 4: Final commit (필요 시)**

검증 중 수정 사항이 있었다면:

```powershell
git add -A
git commit -m "fix: address issues found during final verification"
```
