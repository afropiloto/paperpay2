import { NextResponse } from "next/server";
import { getLiveFiatToUsdtRates } from "@/lib/fx-rates";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getLiveFiatToUsdtRates();
  return NextResponse.json({
    rates: data.rates,
    asOf: data.asOf,
    live: data.live,
    source: data.source,
  });
}
