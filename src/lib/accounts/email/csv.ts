/**
 * One cell of a file a spreadsheet opens. A cell that begins like a formula is kept as text, so a
 * spreadsheet does not run it. Every cell is in quotation marks, always: some spreadsheets split a
 * line on a semicolon and not a comma, and a quoted cell stays one cell whichever they use.
 */
export const cell = (value: unknown) => {
  const text = value == null ? "" : String(value);
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
};

/** A whole file: a head and its rows. The byte order mark is what Excel needs to read accents. */
export const csv = (head: string[], rows: unknown[][]) => `﻿${[head, ...rows].map((row) => row.map(cell).join(",")).join("\n")}\n`;
