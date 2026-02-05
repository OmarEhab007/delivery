export interface PdfSection {
  title: string;
  columns: string[];
  rows: Array<Record<string, string | number>>;
}

interface PdfOptions {
  title: string;
  subtitle?: string;
  filename: string;
  sections: PdfSection[];
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

export const exportToPDF = ({ title, subtitle, filename, sections }: PdfOptions) => {
  if (typeof window === 'undefined') return;

  const sectionHtml = sections
    .map((section) => {
      const header = `<h2 style="font-size:16px;margin:24px 0 12px;">${escapeHtml(section.title)}</h2>`;
      const columns = section.columns
        .map((column) => `<th style="border-bottom:1px solid #E2D2BE;padding:8px;text-align:right;">${escapeHtml(column)}</th>`)
        .join('');
      const rows = section.rows
        .map((row) => {
          const cells = section.columns
            .map((column) => {
              const raw = row[column] ?? '';
              return `<td style="border-bottom:1px solid #F1E6D8;padding:8px;text-align:right;">${escapeHtml(String(raw))}</td>`;
            })
            .join('');
          return `<tr>${cells}</tr>`;
        })
        .join('');

      return `${header}<table style="width:100%;border-collapse:collapse;font-size:12px;">${`<thead><tr>${columns}</tr></thead>`}<tbody>${rows}</tbody></table>`;
    })
    .join('');

  const html = `<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(filename)}</title>
  </head>
  <body style="font-family: 'Cairo', Arial, sans-serif; padding:24px; color:#1E2633;">
    <h1 style="margin:0 0 8px;font-size:20px;">${escapeHtml(title)}</h1>
    ${subtitle ? `<p style="margin:0 0 16px;color:#5A6A7A;font-size:12px;">${escapeHtml(subtitle)}</p>` : ''}
    ${sectionHtml}
    <p style="margin-top:24px;color:#5A6A7A;font-size:11px;">تم إنشاء التقرير في ${new Date().toLocaleString('ar-SA')}</p>
  </body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 350);
};

export default exportToPDF;
