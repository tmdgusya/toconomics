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
