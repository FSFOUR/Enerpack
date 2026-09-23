import express from "express";
import path from "path";

async function startServer() {
  const app = express();
  // In development sandbox behind nginx proxy, listen on port 3000.
  // In Cloud Run production deployment, listen on PORT env variable provided by Cloud Run (default 8080).
  const PORT = 3000;

  // API routes go here
  app.use(express.json());
  
  app.post("/api/generate-job-cards", async (req, res) => {
    const { whatsappOrder } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Gemini API key is not configured" });
    }

    try {
      const modelsToTry = [
        process.env.GEMINI_MODEL,
        "gemini-3.6-flash",
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite"
      ].filter(Boolean) as string[];

      let response: any = null;
      let lastError: any = null;

      const { GoogleGenAI, Type } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

      for (const modelName of modelsToTry) {
        try {
          response = await ai.models.generateContent({
            model: modelName,
            contents: `Parse the following WhatsApp order and extract job card details. 
            Extract: workName, size, gsm, totalGross. Preserve exact values, units, numbers and strings as written in the order without modifying them or adding extra words.
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
          if (response && response.text) {
            break; // success
          }
        } catch (err: any) {
          console.warn(`Model ${modelName} failed:`, err?.message || err);
          lastError = err;
        }
      }

      if (!response || !response.text) {
        throw lastError || new Error('AI returned an empty response across all models.');
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
        } else if (errorMessage.includes("not found") || errorMessage.includes("404")) {
          errorMessage = "AI model currently unavailable.";
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
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;
      try {
        const fs = await import("fs");
        let template = fs.readFileSync(path.resolve(process.cwd(), "index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        next(e);
      }
    });
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
