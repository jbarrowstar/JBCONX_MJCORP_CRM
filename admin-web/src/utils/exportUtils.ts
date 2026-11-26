/**
 * Utility to convert an array of objects into a downloadable CSV (Excel-compatible) file.
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers?: { key: keyof T; label: string }[]
) {
  if (!data || !data.length) {
    alert('No data available to export.');
    return;
  }

  // Determine columns
  const cols = headers || Object.keys(data[0]).map((k) => ({ key: k as keyof T, label: k }));

  // Build CSV Header row
  const headerRow = cols.map((c) => `"${String(c.label).replace(/"/g, '""')}"`).join(',');

  // Build CSV Data rows
  const rows = data.map((item) =>
    cols
      .map((c) => {
        const val = item[c.key];
        let str = val === null || val === undefined ? '' : String(val);
        // Neutralise spreadsheet formula injection (=, +, -, @, tab, CR at the start of a cell).
        if (/^[=+\-@\t\r]/.test(str)) str = `'${str}`;
        return `"${str.replace(/"/g, '""')}"`;
      })
      .join(',')
  );

  // Combine into CSV text
  const csvContent = '\uFEFF' + [headerRow, ...rows].join('\r\n'); // UTF-8 BOM for Excel compatibility

  // Trigger browser download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

