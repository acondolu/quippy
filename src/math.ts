import { Parser } from "expr-eval";

// Evaluate an arithmetic expression to a number
export function evalExpr(str: string): number | null {
  try {
    let s = fixDecimalSeparator(str);
    if (!s || s.length == 0) return null;
    const parser = new Parser();
    let expr = parser.parse(s);
    let res = expr.evaluate({});
    if (typeof res !== "number") return null;
    if (isNaN(res)) return null;
    return res;
  } catch {
    return null;
  }
}

/**
 * Try and use some common sense about decimal separators.
 * Either "." or "," is allowed, and no digit grouping.
 */
export function fixDecimalSeparator(str: string): string | null {
  const hasComma = str.indexOf(",") != -1;
  const hasDot = str.indexOf(".") != -1;
  if (hasComma) {
    if (hasDot) {
      // Cannot contain both kinds of sepators. Sorry !
      return null;
    }
    return str.replace(",", ".");
  }
  return str;
}

// Round a number to two decimal places.
export function round(n: number): string {
  return (+n).toFixed(2);
}
