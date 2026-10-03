const PREFERRED = ["USD", "EUR", "GBP", "NPR", "INR", "AUD", "CAD", "JPY", "CNY", "CHF", "SGD", "THB", "AED", "KRW"];

const FALLBACK = ["USD", "EUR", "GBP", "NPR", "INR", "AUD", "CAD", "JPY", "CNY", "CHF", "SGD", "THB", "AED", "KRW", "NZD", "HKD", "MYR", "PHP", "IDR", "VND", "LKR", "BDT", "PKR", "QAR", "SAR", "ZAR"];

function currencyCodes(): string[] {
  const intl = Intl as typeof Intl & { supportedValuesOf?: (key: "currency") => string[] };

  if (typeof intl.supportedValuesOf === "function") {
    return intl.supportedValuesOf("currency");
  }

  return FALLBACK;
}

const names = new Intl.DisplayNames(["en"], { type: "currency" });

export const CURRENCIES: Array<{ code: string; label: string }> = (() => {
  const codes = [...new Set(currencyCodes().map((code) => code.toUpperCase()))];
  const preferred = PREFERRED.filter((code) => codes.includes(code));
  const rest = codes
    .filter((code) => !preferred.includes(code))
    .sort((left, right) => left.localeCompare(right));

  return [...preferred, ...rest].map((code) => ({
    code,
    label: `${code} — ${names.of(code) ?? code}`,
  }));
})();
