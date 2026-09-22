import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

async function createMasterTemplate() {
  const pdfDoc = await PDFDocument.create();
  // A4 Landscape: 841.89 x 595.27 points
  const page = pdfDoc.addPage([841.89, 595.27]);
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Draw two cards side by side
  // Left card: x: 40 to 390 (width 350), y: 50 to 545 (height 495)
  // Right card: x: 450 to 800 (width 350), y: 50 to 545 (height 495)
  
  const cardWidth = 360;
  const cardHeight = 500;
  const startY = 545; // top y
  const rowHeight = 50; // 50pt per row * 10 rows = 500pt

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

  const drawCard = (startX: number) => {
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
    // Label column width = 140pt, value column = 220pt
    page.drawLine({
      start: { x: startX + 140, y: startY },
      end: { x: startX + 140, y: startY - cardHeight },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
  };

  drawCard(40);  // Left Card
  drawCard(450); // Right Card

  const pdfBytes = await pdfDoc.save();
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  fs.writeFileSync(path.join(publicDir, 'Job Card.pdf'), pdfBytes);
  fs.writeFileSync(path.join(publicDir, 'job-card-template.pdf'), pdfBytes);
  console.log("Master template Job Card.pdf created successfully in public/");
}

createMasterTemplate().catch(console.error);
