import type { FxRate } from "@/lib/fx";
import type { ModelPrice } from "@/lib/pricing";

const krwFmt = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 });
const usdFmt = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function PriceCell({
  usd,
  krwPerUsd,
  ratio,
}: {
  usd: number;
  krwPerUsd: number;
  /** 최고가 대비 비율 (0~1) — 하단 레드 바 길이 */
  ratio: number;
}) {
  return (
    <td className="px-4 py-5 text-right align-middle">
      <div>
        <span className="font-[family-name:var(--font-numeric)] text-lg font-semibold">
          ₩{krwFmt.format(usd * krwPerUsd)}
        </span>
        <span className="ml-2 font-[family-name:var(--font-numeric)] text-xs text-ink-soft">
          ${usdFmt.format(usd)}
        </span>
      </div>
      <div className="mt-1.5 flex justify-end">
        <div
          className="h-[3px] bg-accent"
          style={{ width: `${Math.max(ratio * 100, 2)}%` }}
        />
      </div>
    </td>
  );
}

/** 레퍼런스 2(객체 인식)의 바운딩 박스 + 라벨 태그 스타일 */
function DetectionBox({ model }: { model: ModelPrice }) {
  const label =
    model.source === "openrouter"
      ? `${model.vendor} · LIVE`
      : `${model.vendor} · 고시가`;
  return (
    <div className="relative mt-4 inline-block border border-ink/70 px-3 py-1.5">
      <span className="absolute -top-[17px] -left-px bg-accent px-1.5 py-px font-[family-name:var(--font-numeric)] text-[10px] font-semibold tracking-wide text-paper uppercase">
        {label}
      </span>
      <span className="font-[family-name:var(--font-display)] text-lg leading-tight font-semibold">
        {model.name}
      </span>
    </div>
  );
}

export function PriceTable({
  prices,
  fx,
}: {
  prices: ModelPrice[];
  fx: FxRate;
}) {
  const maxInput = Math.max(...prices.map((p) => p.inputUsd), 1e-9);
  const maxOutput = Math.max(...prices.map((p) => p.outputUsd), 1e-9);

  return (
    <table className="w-full">
      <thead>
        <tr className="bg-ink text-left text-xs tracking-widest text-paper uppercase">
          <th className="px-4 py-2.5 font-medium">모델</th>
          <th className="px-4 py-2.5 text-right font-medium">
            입력 <span className="normal-case">/ 1M 토큰</span>
          </th>
          <th className="px-4 py-2.5 text-right font-medium">
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
              <DetectionBox model={p} />
            </td>
            <PriceCell
              usd={p.inputUsd}
              krwPerUsd={fx.krwPerUsd}
              ratio={p.inputUsd / maxInput}
            />
            <PriceCell
              usd={p.outputUsd}
              krwPerUsd={fx.krwPerUsd}
              ratio={p.outputUsd / maxOutput}
            />
          </tr>
        ))}
      </tbody>
    </table>
  );
}
