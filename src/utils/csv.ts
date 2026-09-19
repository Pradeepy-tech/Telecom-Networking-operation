export function downloadCSV<T extends object>(data: T[], filename: string) {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]) as (keyof T)[];
  const csvRows: string[] = [];

  csvRows.push(headers.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(','));

  for (const row of data) {
    const values = headers.map((header) => {
      const val = row[header];
      if (val === null || val === undefined) return '""';
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvRows.join('\n'));
  const link = document.createElement('a');
  link.setAttribute('href', csvContent);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
