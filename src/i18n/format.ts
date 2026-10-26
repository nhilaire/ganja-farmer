// Arcade-style formatting: zero-padded counters as in the source HUD (`Score: 0001500`, `Level: 03`), in every language.
export function pad(value: number, width: number): string {
  return String(Math.max(0, Math.floor(value))).padStart(width, '0');
}

// French typography: no-break space before ":" and "%", narrow no-break space before "!", "?" and ";".
// Escaped, not literal characters: an editor or a copy can silently turn them into plain spaces.
export const NBSP = ' ';
export const NNBSP = ' ';

// Locale-aware formatting, one formatter per language dictionary (used by the factory i18n tests).
export type Formatter = {
  integer(value: number): string;
  label(text: string, value: string | number): string;
};

export function formatter(locale: string): Formatter {
  const numbers = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  const beforeColon = locale.toLowerCase().startsWith('fr') ? NBSP : '';
  const integer = (value: number) => numbers.format(value);
  return {
    integer,
    label: (text, value) => `${text}${beforeColon}: ${typeof value === 'number' ? integer(value) : value}`,
  };
}
