export function formatMoney(amount: number, currency: string): string {
  const code = currency.trim().toUpperCase();

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${code} ${amount.toFixed(2)}`;
  }
}

export function roundMoney(amount: number): number {
  return Math.round((Number(amount) + Number.EPSILON) * 100) / 100;
}

export function sumInCurrency(
  entries: Array<{ amount: number; currency: string }>,
  currency: string | null | undefined,
): number {
  if (!currency) {
    return 0;
  }

  const code = currency.trim().toUpperCase();

  return roundMoney(
    entries.reduce((sum, entry) => {
      if (entry.currency.trim().toUpperCase() !== code) {
        return sum;
      }

      return sum + Number(entry.amount);
    }, 0),
  );
}

export function groupSpent(
  entries: Array<{ amount: number; currency: string }>,
): Array<{ currency: string; amount: number }> {
  const totals = new Map<string, number>();

  for (const entry of entries) {
    const code = entry.currency?.trim().toUpperCase();
    if (!code) continue;
    totals.set(code, roundMoney((totals.get(code) ?? 0) + Number(entry.amount)));
  }

  return [...totals.entries()]
    .map(([currency, amount]) => ({ currency, amount }))
    .sort((left, right) => left.currency.localeCompare(right.currency));
}

/**
 * Remaining = budget − the expenses that were recorded.
 * One currency is subtracted in full. Mixed currencies subtract only the budget currency.
 */
export function spentAgainstBudget(
  spent: Array<{ currency: string; amount: number }>,
  budgetCurrency: string | null | undefined,
): number {
  if (spent.length === 0) return 0;
  if (spent.length === 1) return roundMoney(spent[0].amount);
  return sumInCurrency(spent, budgetCurrency);
}

/** Remaining = budget − spent. */
export function remainingAfterExpenses(budget: number, spent: number): number {
  return roundMoney(Number(budget) - Number(spent));
}

export function spentInCurrency(
  spent: Array<{ currency: string; amount: number }>,
  currency: string | null | undefined,
): number {
  if (!currency) {
    return 0;
  }

  return sumInCurrency(spent, currency);
}

export function formatSpent(spent: Array<{ currency: string; amount: number }>): string {
  if (spent.length === 0) {
    return "—";
  }

  return spent.map((row) => formatMoney(row.amount, row.currency)).join(" · ");
}
