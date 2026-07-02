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
