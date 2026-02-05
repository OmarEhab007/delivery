export { exportToCSV } from './csv';
export { exportToPDF } from './pdf';
export type { PdfSection } from './pdf';

export const formatExportFilename = (base: string, extension: 'csv' | 'pdf') => {
  const date = new Date().toISOString().split('T')[0];
  return `${base}-${date}.${extension}`;
};
