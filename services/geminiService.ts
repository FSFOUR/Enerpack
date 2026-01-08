import { GoogleGenAI, Type } from "@google/genai";

const schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      workName: { type: Type.STRING, description: "The name of the printing job or customer." },
      itemCode: { type: Type.STRING, description: "The alphanumeric item code (e.g., FW10083, OT10125, FW10152)." },
      size: { type: Type.STRING, description: "The size dimension of the paper." },
      gsm: { type: Type.STRING, description: "The paper thickness/gsm." },
      totalGross: { type: Type.STRING, description: "The total quantity or gross amount." },
      deliveryLocation: { type: Type.STRING, description: "The destination location." },
      date: { type: Type.STRING, description: "The date of the order if specified (YYYY-MM-DD)." }
    },
    required: ["workName", "size", "gsm", "totalGross"]
  }
};

export async function parseJobOrderText(text: string) {
  // Initialize AI instance inside the function for better reliability and context refresh
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Parse the following printing work order text into structured job card data: \n\n${text}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
      systemInstruction: "You are an assistant specialized in parsing printing workflow orders. Pay special attention to alphanumeric codes like 'FW10083', 'FW10152', or 'OT10125' and extract them as 'itemCode'. Extract customer names, dimensions, gsm, and quantities precisely."
    }
  });

  return JSON.parse(response.text || '[]');
}