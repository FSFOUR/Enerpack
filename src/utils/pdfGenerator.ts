import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface JobCardData {
  id?: string;
  jobCardNo: string;
  date: string;
  workName: string;
  size: string;
  gsm: string;
  totalGross: string;
  deliveryLoc: string;
  loadingDate: string;
}

const labels = [
  "JOB CARD NO:",
  "DATE:",
  "WORK NAME",
  "SIZE",
  "GSM",
  "TOTAL GROSS",
  "DELIVERY LOCATION",
  "LOADING DATE:",
  "SUPERVISOR SIGN",
  "ACCOUNTANT SIGN"
];

export async function generateJobCardsPdf(jobCards: JobCardData[]): Promise<void> {
  if (!jobCards || jobCards.length === 0) {
    throw new Error('No job cards provided for PDF generation.');
  }

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Calculate number of pages needed (2 cards per page, side-by-side)
  const totalPages = Math.ceil(jobCards.length / 2);

  // Helper to draw master template card borders and labels directly
  const drawVectorCardTemplate = (page: any, startX: number) => {
    const cardWidth = 360;
    const cardHeight = 450;
    const startY = 510;
    const rowHeight = 45;

    // Header above card: "Ener Pack" and "JOB CARD"
    page.drawText("Ener Pack", {
      x: startX,
      y: startY + 25,
      size: 15,
      font: font,
      color: rgb(0.11, 0.24, 0.45),
    });

    page.drawText("JOB CARD", {
      x: startX + cardWidth - 60,
      y: startY + 27,
      size: 9,
      font: font,
      color: rgb(0.11, 0.24, 0.45),
    });

    // Horizontal blue line under header
    page.drawLine({
      start: { x: startX, y: startY + 15 },
      end: { x: startX + cardWidth, y: startY + 15 },
      thickness: 1.5,
      color: rgb(0.11, 0.24, 0.45),
    });

    // Outer border
    page.drawRectangle({
      x: startX,
      y: startY - cardHeight,
      width: cardWidth,
      height: cardHeight,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1.5,
    });

    for (let i = 0; i < 10; i++) {
      const y = startY - (i + 1) * rowHeight;
      // Horizontal line
      page.drawLine({
        start: { x: startX, y },
        end: { x: startX + cardWidth, y },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      // Label
      page.drawText(labels[i], {
        x: startX + 10,
        y: y + 15,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      });
    }

    // Vertical separator between label column and value column
    page.drawLine({
      start: { x: startX + 140, y: startY },
      end: { x: startX + 140, y: startY - cardHeight },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // Footer on page
    page.drawText("Ener Pack | Job Card", {
      x: 380,
      y: 20,
      size: 8,
      font: regularFont,
      color: rgb(0.4, 0.4, 0.4),
    });
  };

  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    const page = pdfDoc.addPage([841.89, 595.27]);
    drawVectorCardTemplate(page, 40);
    drawVectorCardTemplate(page, 450);

    const leftCard = jobCards[pageIdx * 2];
    const rightCard = jobCards[pageIdx * 2 + 1]; // Might be undefined if odd number

    // Helper to draw text on a card column with precise vertical row centering
    const drawCardData = (card: JobCardData, startX: number) => {
      const startY = 510;
      const rowHeight = 45;
      const valueX = startX + 145;
      const maxWidth = 205;

      const rows = [
        card.jobCardNo || '',
        card.date ? formatDateDisplay(card.date) : '',
        card.workName || '',
        card.size || '',
        card.gsm || '',
        card.totalGross || '',
        card.deliveryLoc || '',
        card.loadingDate ? formatDateDisplay(card.loadingDate) : ''
      ];

      rows.forEach((text, i) => {
        if (!text) return;
        const y = startY - i * rowHeight - (rowHeight / 2) - 3.5; // exact vertical center baseline

        let fontSize = 10;
        if (text.length > 20) fontSize = 9;
        if (text.length > 30) fontSize = 8;
        if (text.length > 45) fontSize = 7;

        page.drawText(text, {
          x: valueX,
          y,
          size: fontSize,
          font: font,
          color: rgb(0, 0, 0),
          maxWidth: maxWidth,
        });
      });
    };

    if (leftCard) {
      drawCardData(leftCard, 40);
    }
    if (rightCard) {
      drawCardData(rightCard, 450);
    }
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `JobCards_${new Date().toISOString().split('T')[0]}.pdf`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  // If already DD-MM-YYYY or similar
  if (dateStr.includes('-') && dateStr.split('-')[0].length === 4) {
    const parts = dateStr.split('-');
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
}

