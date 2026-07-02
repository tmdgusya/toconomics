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
