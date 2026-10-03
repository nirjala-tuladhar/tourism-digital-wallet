import { CURRENCIES } from "../../lib/currencies";

type CurrencySelectProps = {
  value: string;
  onChange: (code: string) => void;
  id?: string;
  className?: string;
};

export function CurrencySelect({ value, onChange, id, className }: CurrencySelectProps) {
  const selected = value.trim().toUpperCase() || "USD";
  const known = CURRENCIES.some((currency) => currency.code === selected);

  return (
    <select
      id={id}
      className={className}
      value={selected}
      onChange={(event) => onChange(event.target.value)}
    >
      {!known ? <option value={selected}>{selected}</option> : null}
      {CURRENCIES.map((currency) => (
        <option key={currency.code} value={currency.code}>
          {currency.label}
        </option>
      ))}
    </select>
  );
}
