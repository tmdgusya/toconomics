/**
 * 레퍼런스 콜라주 그래픽 요소들.
 * - CandleChart: 하락 캔들차트 + 레드 선(red sun) — 레퍼런스 1·3의 증시 모티프
 * - NewsprintText: 배경용 신문 본문 텍스처
 * - TornBand: 찢긴 종이 느낌의 레드 밴드 — 레퍼런스 1의 레드 매스
 */

interface Candle {
  x: number;
  wickTop: number;
  wickBottom: number;
  bodyY: number;
  bodyH: number;
  red: boolean;
}

const CANDLES: Candle[] = [
  { x: 6, wickTop: 10, wickBottom: 56, bodyY: 18, bodyH: 30, red: false },
  { x: 30, wickTop: 22, wickBottom: 62, bodyY: 30, bodyH: 24, red: true },
  { x: 54, wickTop: 34, wickBottom: 78, bodyY: 40, bodyH: 30, red: false },
  { x: 78, wickTop: 44, wickBottom: 82, bodyY: 52, bodyH: 22, red: false },
  { x: 102, wickTop: 54, wickBottom: 98, bodyY: 60, bodyH: 30, red: true },
  { x: 126, wickTop: 66, wickBottom: 106, bodyY: 74, bodyH: 24, red: false },
  { x: 150, wickTop: 74, wickBottom: 122, bodyY: 82, bodyH: 32, red: true },
  { x: 174, wickTop: 88, wickBottom: 126, bodyY: 96, bodyH: 22, red: false },
  { x: 198, wickTop: 96, wickBottom: 142, bodyY: 104, bodyH: 30, red: false },
  { x: 222, wickTop: 108, wickBottom: 148, bodyY: 116, bodyH: 24, red: true },
  { x: 246, wickTop: 116, wickBottom: 164, bodyY: 124, bodyH: 32, red: false },
  { x: 270, wickTop: 130, wickBottom: 170, bodyY: 138, bodyH: 24, red: true },
  { x: 294, wickTop: 138, wickBottom: 188, bodyY: 146, bodyH: 34, red: false },
  { x: 318, wickTop: 152, wickBottom: 196, bodyY: 160, bodyH: 28, red: true },
];

export function CandleChart({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 340 220"
      className={className}
      aria-hidden="true"
      role="presentation"
    >
      {[30, 70, 110, 150, 190].map((y) => (
        <line
          key={y}
          x1="0"
          y1={y}
          x2="340"
          y2={y}
          stroke="var(--color-line)"
          strokeWidth="1"
        />
      ))}
      <polygon
        points="30,26 128,18 136,96 92,108 44,100 24,110"
        fill="var(--color-accent)"
      />
      {CANDLES.map((c) => (
        <g key={c.x}>
          <line
            x1={c.x + 6}
            y1={c.wickTop}
            x2={c.x + 6}
            y2={c.wickBottom}
            stroke={c.red ? "var(--color-accent-deep)" : "var(--color-ink)"}
            strokeWidth="1.5"
          />
          <rect
            x={c.x}
            y={c.bodyY}
            width="12"
            height={c.bodyH}
            fill={c.red ? "var(--color-accent)" : "var(--color-ink)"}
          />
        </g>
      ))}
    </svg>
  );
}

const NEWSPRINT_PARAGRAPH =
  "토큰 이코노미의 아침, 시장은 다시 원화의 무게를 시험한다. 지난밤 달러는 소폭 강세를 보였고 추론 비용은 백만 토큰 단위로 재계산되었다. 모델 단가의 하방 경쟁은 멈추지 않는다. 컨텍스트는 길어지고 단가는 낮아지며, 오늘의 시세표는 어제의 시세표를 대체한다. 프런티어 랩들은 출력 토큰의 프리미엄을 방어하고, 오픈웨이트 진영은 가격표로 응수한다. 환율 고시가 도착하면 표의 모든 숫자가 다시 쓰인다. 거래는 계속된다. ";

export function NewsprintText({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`select-none text-justify font-[family-name:var(--font-sans)] text-[9px] leading-[13px] text-ink/35 ${className ?? ""}`}
    >
      {Array.from({ length: 5 }, () => NEWSPRINT_PARAGRAPH).join("")}
    </div>
  );
}

export function TornBand({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`bg-accent ${className ?? ""}`}
      style={{
        clipPath:
          "polygon(0 46%, 4% 18%, 9% 58%, 15% 22%, 22% 62%, 28% 28%, 36% 66%, 44% 20%, 52% 60%, 60% 26%, 68% 70%, 76% 32%, 84% 64%, 92% 24%, 100% 52%, 100% 100%, 0 100%)",
      }}
    />
  );
}
