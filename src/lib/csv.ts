export type CsvCell = string | number | boolean | null | undefined;

/**
 * Spreadsheet apps execute cells that start with = + - @ TAB or CR as formulas.
 * User-generated text is prefixed with an apostrophe so it is always read as text.
 */
const FORMULA_START = /^[=+\-@\t\r]/;

export function csvCell(v: CsvCell): string {
  if (v === null || v === undefined) return "";
  let s = typeof v === "boolean" ? (v ? "true" : "false") : String(v);
  if (typeof v === "string" && FORMULA_START.test(s)) s = `'${s}`;
  if (/[",\r\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCSV(headers: string[], rows: CsvCell[][]): string {
  const line = (cells: CsvCell[]) => cells.map(csvCell).join(",");
  return [line(headers), ...rows.map(line)].join("\r\n");
}

/** UTF-8 with BOM so Excel opens Arabic text correctly. */
export function downloadCSV(filename: string, csv: string): void {
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
