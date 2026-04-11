/**
 * @example formatUsdWeekly(2680) => "$2,680/wk"
 */
export function formatUsdWeekly(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return "—";
  return (
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount) + "/wk"
  );
}

/**
 * Weekly pay with FTE annual estimate (salary ÷ 52 stored as weekly in the pipeline).
 * @example formatTechPay(3654) => "$3,654/wk (~$190,008/yr)"
 */
export function formatTechPay(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return "—";
  const weekly = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
  const annual = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.round(amount * 52));
  return `${weekly}/wk (~${annual}/yr)`;
}

/** @example formatScore(0.84) => "0.84" */
export function formatScore(x: number): string {
  return x.toFixed(2);
}
