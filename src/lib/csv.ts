function spreadsheetSafe(value: string) {
  return /^[=+\-@]/.test(value.trimStart()) ? `'${value}` : value;
}

function csvCell(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = spreadsheetSafe(
    typeof value === "object" ? JSON.stringify(value) : String(value),
  );

  return `"${stringValue.replaceAll('"', '""')}"`;
}

export function createCsv(headers: string[], rows: unknown[][]) {
  return [headers.map(csvCell).join(","), ...rows.map((row) => row.map(csvCell).join(","))].join(
    "\r\n",
  );
}
