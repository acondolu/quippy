export const CURRENCIES = new Map<string, string>([
  // Fiat currencies
  ["USD", "$"],
  ["EUR", "€"],
  ["GBP", "£"],
  ["JPY", "¥"],
  ["INR", "₹"],
  ["TND", "د.ت"],
  ["CNY", "¥"],
  ["KRW", "₩"],
  ["AUD", "$"],
  ["CAD", "$"],
  // Cryptocurrencies
  ["BTC", "₿"],
  ["ETH", "Ξ"],
  ["XMR", "ɱ"],
]);

export function prettyCcy(code: string): string {
  const symbol = CURRENCIES.get(code);
  if (symbol) {
    return symbol;
  } else {
    return code;
  }
}
