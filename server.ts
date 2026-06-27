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
        model: "gemini-1.5-flash",
        contents: `Parse the following WhatsApp order and extract job card details. 
        Extract: workName, size, gsm, totalGross (if available in quantity).
        Return an array of objects.
        Order: ${whatsappOrder}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                workName: { type: Type.STRING },
                size: { type: Type.STRING },
                gsm: { type: Type.STRING },
                totalGross: { type: Type.STRING },
              },
              required: ["workName", "size", "gsm"]
            }
          }
        }
      });

      if (!response.text) {
        throw new Error('AI returned an empty response.');
      }

      console.log("Raw AI Response:", response.text);

      // Clean markdown code blocks if any
      const cleanedText = response.text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

      res.json(JSON.parse(cleanedText));
    } catch (error) {
      console.error("AI Generation Error:", error);
      let errorMessage = "Failed to generate job cards";
      if (error instanceof Error) {
        errorMessage = error.message;
        if (errorMessage.includes("API key not valid")) {
          errorMessage = "The configured Gemini API key is invalid. Please check your settings.";
        }
      }
      res.status(500).json({ error: errorMessage });
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
