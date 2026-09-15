import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export interface ProcurementPdfRow {
  name: string;
  qty: string;
  notes?: string;
}

export async function createProcurementPdfBase64(
  title: string,
  rows: ProcurementPdfRow[]
): Promise<string> {
  const pdf = await PDFDocument.create();
  const regularFont = await pdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 42;
  const contentWidth = pageWidth - margin * 2;
  const rowHeight = 26;

  let page = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const drawHeader = () => {
    page.drawRectangle({
      x: 0,
      y: pageHeight - 88,
      width: pageWidth,
      height: 88,
      color: rgb(0.06, 0.09, 0.16),
    });
    page.drawText("SHOP SILO", {
      x: margin,
      y: pageHeight - 34,
      size: 18,
      font: boldFont,
      color: rgb(1, 1, 1),
    });
    page.drawText(title, {
      x: margin,
      y: pageHeight - 59,
      size: 10,
      font: regularFont,
      color: rgb(0.78, 0.82, 0.95),
      maxWidth: contentWidth,
    });
  };

  const drawTableHeader = () => {
    page.drawRectangle({
      x: margin,
      y: y - 22,
      width: contentWidth,
      height: 22,
      color: rgb(0.26, 0.22, 0.63),
    });
    page.drawText("#", { x: margin + 8, y: y - 15, size: 9, font: boldFont, color: rgb(1, 1, 1) });
    page.drawText("PRODUCT / ITEM", { x: margin + 32, y: y - 15, size: 9, font: boldFont, color: rgb(1, 1, 1) });
    page.drawText("QUANTITY", { x: margin + contentWidth - 155, y: y - 15, size: 9, font: boldFont, color: rgb(1, 1, 1) });
    page.drawText("NOTES", { x: margin + contentWidth - 78, y: y - 15, size: 9, font: boldFont, color: rgb(1, 1, 1) });
    y -= 30;
  };

  const drawRow = (row: ProcurementPdfRow, index: number) => {
    if (y < margin + 58) {
      page = pdf.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
      drawHeader();
      y -= 105;
      drawTableHeader();
    }

    if (index % 2 === 0) {
      page.drawRectangle({
        x: margin,
        y: y - rowHeight + 5,
        width: contentWidth,
        height: rowHeight,
        color: rgb(0.97, 0.98, 0.99),
      });
    }

    const name = row.name.trim() || "Procurement item";
    const qty = row.qty.trim() || "1";
    const notes = row.notes?.trim() || "Market reorder";
    page.drawText(String(index + 1), { x: margin + 8, y: y - 12, size: 9, font: regularFont, color: rgb(0.12, 0.16, 0.23) });
    page.drawText(name.slice(0, 42), { x: margin + 32, y: y - 12, size: 9, font: boldFont, color: rgb(0.12, 0.16, 0.23), maxWidth: 235 });
    page.drawText(qty.slice(0, 22), { x: margin + contentWidth - 155, y: y - 12, size: 9, font: boldFont, color: rgb(0.26, 0.22, 0.63), maxWidth: 72 });
    page.drawText(notes.slice(0, 16), { x: margin + contentWidth - 78, y: y - 12, size: 8, font: regularFont, color: rgb(0.39, 0.45, 0.55), maxWidth: 68 });
    y -= rowHeight;
  };

  drawHeader();
  y -= 112;
  page.drawText(`TOTAL ITEMS: ${rows.length}`, { x: margin, y, size: 12, font: boldFont, color: rgb(0.26, 0.22, 0.63) });
  y -= 28;
  drawTableHeader();

  rows.forEach(drawRow);

  page.drawText("Generated in ShopSilo • Verify quantities and supplier rates before ordering.", {
    x: margin,
    y: 28,
    size: 8,
    font: regularFont,
    color: rgb(0.55, 0.59, 0.66),
  });

  return pdf.saveAsBase64({ dataUri: false });
}
