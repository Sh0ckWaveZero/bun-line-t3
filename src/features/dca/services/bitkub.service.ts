// Bitkub API Service for fetching cryptocurrency prices

interface BitkubTickerResponse {
  [key: string]: {
    last: number;
    high: number;
    low: number;
    vol: number;
    percentChange: number;
  };
}

interface BitkubPrice {
  symbol: string;
  lastPrice: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  percentChange24h: number;
}

const BITKUB_API_BASE = "https://api.bitkub.com/api/market";

/**
 * ดึงราคาล่าสุดจาก Bitkub API
 *
 * @param symbol - เช่น "THB_BTC", "THB_ETH"
 * @returns ราคาล่าสุดและข้อมูล 24 ชม.
 */
export async function getTicker(symbol: string): Promise<BitkubPrice | null> {
  try {
    const response = await fetch(`${BITKUB_API_BASE}/ticker`);

    if (!response.ok) {
      console.error(`Bitkub API error: ${response.status}`);
      return null;
    }

    const data = (await response.json()) as BitkubTickerResponse;

    if (!data[symbol]) {
      console.error(`Symbol ${symbol} not found in Bitkub API`);
      return null;
    }

    const ticker = data[symbol];

    return {
      symbol,
      lastPrice: ticker.last,
      high24h: ticker.high,
      low24h: ticker.low,
      volume24h: ticker.vol,
      percentChange24h: ticker.percentChange,
    };
  } catch (error) {
    console.error("Failed to fetch Bitkub ticker:", error);
    return null;
  }
}

/**
 * ดึงราคา BTC ล่าสุด (shortcut)
 */
export async function getBTCPrice(): Promise<number | null> {
  const ticker = await getTicker("THB_BTC");
  return ticker?.lastPrice ?? null;
}

/**
 * คำนวณ PnL % จาก average price และ current price
 *
 * @param averagePrice - ราคาเฉลี่ยของเรา
 * @param currentPrice - ราคาปัจจุบันจาก Bitkub
 * @returns PnL % (ค่าบวก = กำไร, ค่าลบ = ขาดทุน)
 */
export function calculatePnLPercent(
  averagePrice: number,
  currentPrice: number,
): number {
  if (averagePrice === 0) return 0;
  return ((currentPrice - averagePrice) / averagePrice) * 100;
}

/**
 * ดึงราคาและคำนวณ PnL ในครั้งเดียว
 *
 * @param averagePrice - ราคาเฉลี่ยของเรา
 * @returns { currentPrice, pnlPercent } หรือ null ถ้าดึงราคาไม่ได้
 */
export async function getPnLFromBitkub(averagePrice: number): Promise<{
  currentPrice: number;
  pnlPercent: number;
} | null> {
  const currentPrice = await getBTCPrice();

  if (!currentPrice) return null;

  return {
    currentPrice,
    pnlPercent: calculatePnLPercent(averagePrice, currentPrice),
  };
}
