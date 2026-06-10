import Papa from 'papaparse';

/**
 * Triggers a CSV file download from an array of objects.
 * @param data - Array of objects to export
 * @param filename - Desired filename (without extension)
 * @param columns - Optional column definition: { key: string; header: string }[]
 */
export function exportToCsv<T>(
  data: T[],
  filename: string,
  columns?: { key: string; header: string }[]
) {
  if (data.length === 0) return;

  const csv = Papa.unparse(data, {
    columns: columns?.map(c => c.key as string),
    header: true,
  });

  // If custom headers are provided, prepend a header line with the display names
  const content = columns
    ? columns.map(c => `"${c.header}"`).join(',') + '\n' + csv.split('\n').slice(1).join('\n')
    : csv;

  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
