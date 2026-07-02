import { CandleChart, NewsprintText, TornBand } from "@/components/Collage";
import { PriceTable } from "@/components/PriceTable";
import { getUsdKrwRate } from "@/lib/fx";
import { getModelPrices } from "@/lib/pricing";

export const revalidate = 3600;

const krwFmt = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 2 });
const dateFmt = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "long",
});

export default async function Home() {
  const [prices, fx] = await Promise.all([getModelPrices(), getUsdKrwRate()]);
  const today = dateFmt.format(new Date());

  return (
    <main className="mx-auto max-w-4xl px-6 pt-10 pb-16">
      {/* ── 신문 마스트헤드 ── */}
      <header>
        <div className="border-t-[6px] border-ink pt-[3px]">
          <div className="border-t border-ink" />
        </div>
        <div className="flex items-baseline justify-between py-2 text-[11px] tracking-[0.2em] text-ink-soft uppercase">
          <span>Token Economics Daily</span>
          <span className="hidden sm:inline">제1판 — 서울</span>
          <span>{today}</span>
        </div>
        <div className="border-t border-ink" />

        {/* 헤드라인 + 콜라주 */}
        <div className="grid grid-cols-1 gap-6 py-8 sm:grid-cols-[1fr_280px]">
          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute -top-3 -left-3 h-20 w-52 -rotate-2 bg-accent"
              style={{
                clipPath:
                  "polygon(2% 8%, 97% 0%, 100% 88%, 64% 96%, 30% 90%, 0% 100%)",
              }}
            />
            <h1 className="relative font-[family-name:var(--font-display)] text-6xl font-black tracking-tight sm:text-7xl">
              toconomics
            </h1>
            <p className="relative mt-4 max-w-sm border-l-2 border-accent pl-3 text-sm leading-relaxed text-ink-soft">
              SOTA LLM 토큰 가격을 오늘의 원/달러 환율로 환산해 비교합니다.
              환율이 바뀌면, 시세표의 모든 숫자가 다시 쓰입니다.
            </p>
          </div>
          <div className="relative hidden sm:block">
            <NewsprintText className="absolute inset-0 columns-2 gap-3 overflow-hidden" />
            <CandleChart className="relative h-full w-full" />
          </div>
        </div>
      </header>

      {/* ── 환율 티커 (블랙 스트립) ── */}
      <div className="flex items-baseline gap-3 bg-ink px-4 py-2.5 text-paper">
        <span className="text-[10px] tracking-[0.25em] text-paper/60 uppercase">
          USD/KRW
        </span>
        <span className="font-[family-name:var(--font-numeric)] text-xl font-semibold text-accent">
          ₩{krwFmt.format(fx.krwPerUsd)}
        </span>
        <span className="ml-auto hidden font-[family-name:var(--font-numeric)] text-[10px] text-paper/60 sm:inline">
          갱신 {fx.lastUpdatedUtc}
        </span>
      </div>
      <TornBand className="h-4 w-full" />

      {/* ── 시세표 섹션 ── */}
      <section className="mt-10">
        <div className="mb-4 flex items-baseline justify-between border-b-2 border-ink pb-2">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">
            오늘의 시세표
          </h2>
          <span className="text-[10px] tracking-[0.25em] text-ink-soft uppercase">
            Token Price Index — ₩ / 1M tokens
          </span>
        </div>
        <PriceTable prices={prices} fx={fx} />
      </section>

      {/* ── 콜로폰 ── */}
      <footer className="mt-12">
        <div className="border-t-2 border-ink pt-[2px]">
          <div className="border-t border-ink" />
        </div>
        <div className="space-y-1 pt-3 text-xs text-ink-soft">
          <p>
            가격 출처: OpenRouter Models API (경유가 기준, 고시가 표기는 공식
            가격) · 1M 토큰당 가격
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
        </div>
      </footer>
    </main>
  );
}
