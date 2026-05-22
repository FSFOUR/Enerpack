import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes go here
  app.use(express.json());
  
  app.post("/api/generate-job-cards", async (req, res) => {
    const { whatsappOrder } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Gemini API key is not configured" });
    }

    try {
      const { GoogleGenAI, Type } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-preview",
        contents: `Parse the following WhatsApp order and extract job card details. 
        Return an array of objects with these fields: date (YYYY-MM-DD), workName, size, gsm, totalGross, deliveryLoc, loadingDate (YYYY-MM-DD).
        If multiple items are in the order, return multiple objects.
        Order: ${whatsappOrder}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                date: { type: Type.STRING },
                workName: { type: Type.STRING },
                size: { type: Type.STRING },
                gsm: { type: Type.STRING },
                totalGross: { type: Type.STRING },
                deliveryLoc: { type: Type.STRING },
                loadingDate: { type: Type.STRING },
              },
              required: ["workName", "size", "gsm"]
            }
          }
        }
      });

      if (!response.text) {
        throw new Error('AI returned an empty response.');
      }

      res.json(JSON.parse(response.text));
    } catch (error) {
      console.error("AI Generation Error:", error);
      res.status(500).json({ error: "Failed to generate job cards" });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
