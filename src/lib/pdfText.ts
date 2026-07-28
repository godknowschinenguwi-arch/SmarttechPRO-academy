// pdf-lib's standard fonts only support WinAnsi encoding and throw on any
// character outside it - typographic punctuation (curly quotes, en/em dashes,
// ellipsis) and symbols like "~", arrows, checkmarks or emoji are common in
// free-text fields (client names, notes) and will crash PDF generation
// entirely if not sanitized first.
const PDF_SAFE_REPLACEMENTS: Record<string, string> = {
  [String.fromCharCode(0x2018)]: "'",
  [String.fromCharCode(0x2019)]: "'",
  [String.fromCharCode(0x201c)]: '"',
  [String.fromCharCode(0x201d)]: '"',
  [String.fromCharCode(0x2013)]: '-',
  [String.fromCharCode(0x2014)]: '-',
  [String.fromCharCode(0x2026)]: '...',
  [String.fromCharCode(0x2248)]: '~',
  [String.fromCharCode(0x2192)]: '->',
  [String.fromCharCode(0x2190)]: '<-',
  [String.fromCharCode(0x2713)]: 'v',
  [String.fromCharCode(0x2714)]: 'v',
  [String.fromCharCode(0x00d7)]: 'x',
  [String.fromCharCode(0x2022)]: '-',
};

const NON_LATIN1_PATTERN = /[Ā-￿]/g;

export function sanitizeForPdf(str: string): string {
  return str.replace(NON_LATIN1_PATTERN, (ch) => PDF_SAFE_REPLACEMENTS[ch] ?? '');
}
