export const exportToCSV = (rows: Array<Record<string, unknown>>, filename: string) => {
  if (typeof window === 'undefined') return;
  if (!rows.length) return;

  const headers = Object.keys(rows[0]);
  const escapeValue = (value: unknown) => {
    if (value === null || value === undefined) return '';
    const text = String(value).replace(/"/g, '""');
    return /[",\n]/.test(text) ? `"${text}"` : text;
  };

  const csv = [headers.join(',')]
    .concat(
      rows.map((row) => headers.map((header) => escapeValue(row[header])).join(','))
    )
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default exportToCSV;
