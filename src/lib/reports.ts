import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportColumn {
  key: string;
  header: string;
}

/**
 * Generates and downloads an Excel (.xlsx) file from an array of objects.
 */
export function exportToExcel<T>(
  data: T[],
  filename: string,
  columns: ReportColumn[],
  sheetName: string = 'Report',
  title?: string
) {
  if (data.length === 0) return;

  // Build data array with column headers
  const headerRow = columns.map(c => c.header);
  const dataRows = data.map(row =>
    columns.map(c => {
      const val = (row as any)[c.key];
      if (val === null || val === undefined) return '';
      if (typeof val === 'string' && !isNaN(Date.parse(val)) && val.includes('T')) {
        return new Date(val).toLocaleString();
      }
      return val;
    })
  );

  const sheetData = title
    ? [[title], [], headerRow, ...dataRows]
    : [headerRow, ...dataRows];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Style: auto-width columns
  const colWidths = columns.map(c =>
    Math.max(
      c.header.length * 1.3,
      ...data.map(row => {
        const val = (row as any)[c.key];
        return val ? String(val).length * 1.1 : 10;
      })
    )
  );
  ws['!cols'] = colWidths.map(w => ({ wch: Math.min(40, w) }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/**
 * Generates and downloads a PDF file from an array of objects.
 */
export function exportToPdf<T>(
  data: T[],
  filename: string,
  columns: ReportColumn[],
  title: string,
  subtitle?: string
) {
  if (data.length === 0) return;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 20);

  // Subtitle / metadata
  if (subtitle) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(subtitle, 14, 28);
  }

  // Generation date
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, subtitle ? 34 : 28);

  // Table
  const headers = columns.map(c => c.header);
  const body = data.map(row =>
    columns.map(c => {
      const val = (row as any)[c.key];
      if (val === null || val === undefined) return '';
      if (typeof val === 'string' && !isNaN(Date.parse(val)) && val.includes('T')) {
        return new Date(val).toLocaleString();
      }
      return String(val);
    })
  );

  autoTable(doc, {
    head: [headers],
    body,
    startY: subtitle ? 38 : 32,
    styles: {
      fontSize: 8,
      cellPadding: 3,
      overflow: 'linebreak',
      halign: 'left',
    },
    headStyles: {
      fillColor: [79, 70, 229], // indigo-600
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },
    margin: { top: 40 },
    didDrawPage: (data: any) => {
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text(
        `Page ${data.pageNumber}`,
        doc.internal.pageSize.width - 25,
        doc.internal.pageSize.height - 10
      );
    },
  });

  doc.save(`${filename}.pdf`);
}
