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

  // Attempt to load existing template PDF if available from multiple possible URLs
  let templateDoc: PDFDocument | null = null;
  const templateUrls = ['/job-card-template.pdf', '/Job%20Card.pdf', '/Job Card.pdf'];

  for (const url of templateUrls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const templateBytes = await response.arrayBuffer();
        const header = new Uint8Array(templateBytes.slice(0, 5));
        const isPdf = String.fromCharCode(...header).startsWith('%PDF');
        if (isPdf) {
          templateDoc = await PDFDocument.load(templateBytes);
          break;
        }
      }
    } catch {
      // Continue to next URL or vector fallback
    }
  }

  // Calculate number of pages needed (2 cards per page, side-by-side)
  const totalPages = Math.ceil(jobCards.length / 2);

  // Helper to draw master template card borders and labels directly if template PDF is unavailable
  const drawVectorCardTemplate = (page: any, startX: number) => {
    const cardWidth = 360;
    const cardHeight = 500;
    const startY = 545;
    const rowHeight = 50;

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
        y: y + 18,
        size: 11,
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
  };

  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    let page: any;
    if (templateDoc) {
      try {
        const [copiedPage] = await pdfDoc.copyPages(templateDoc, [0]);
        pdfDoc.addPage(copiedPage);
        page = pdfDoc.getPage(pageIdx);
      } catch {
        page = pdfDoc.addPage([841.89, 595.27]);
        drawVectorCardTemplate(page, 40);
        drawVectorCardTemplate(page, 450);
      }
    } else {
      // Create A4 Landscape page directly
      page = pdfDoc.addPage([841.89, 595.27]);
      drawVectorCardTemplate(page, 40);
      drawVectorCardTemplate(page, 450);
    }

    const leftCard = jobCards[pageIdx * 2];
    const rightCard = jobCards[pageIdx * 2 + 1]; // Might be undefined if odd number

    // Helper to draw text on a card column
    const drawCardData = (card: JobCardData, startX: number) => {
      const startY = 545;
      const rowHeight = 50;
      const valueX = startX + 145;
      const maxWidth = 200;

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
        const y = startY - i * rowHeight - 30; // vertical center of row

        // Adjust font size if text is too long (e.g., long work name or location)
        let fontSize = 11;
        if (text.length > 25 && i === 2) {
          fontSize = 9;
        } else if (text.length > 35 && i === 2) {
          fontSize = 8;
        }

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

