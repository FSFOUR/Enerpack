import { GoogleGenAI, Type } from "@google/genai";
import { JobCardData } from "../types";

const parseJobOrderText = async (text: string): Promise<Partial<JobCardData>[]> => {
  if (!process.env.API_KEY) {
    console.error("API Key missing");
    return [];
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Parse the following text which contains one or more printing work orders (often from WhatsApp messages). 
      Extract the details into a structured JSON list.
      
      The input text often follows patterns like: "JobName Size-GSM Quantity (Company) Type".
      It might also contain an Item Code (e.g., "FW10057").
      Example: "Fw10057 Vkc pl3 50x81-200 gsm 70 gross ( Ener ) Reprint"
      
      Map fields as follows:
      - workName: The main identifier or description (e.g., "Vkc pl3", "Leeds ladies"). If an item code is present at the start, separate it.
      - itemCode: specific code like "FW10057", "LD123", etc. usually appearing at start. If not found, leave empty.
      - size: Dimensions (e.g., "50*81", "54*86")
      - gsm: Paper weight (e.g., "200", "280")
      - totalGross: Quantity (e.g., "70 gross", "250gross")
      - deliveryLocation: extract standard codes if present: "EP", "AKP", "KKP", "FP". If not found, use implied location or leave empty.
      
      Text to parse:
      """
      ${text}
      """
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              workName: { type: Type.STRING },
              itemCode: { type: Type.STRING },
              size: { type: Type.STRING },
              gsm: { type: Type.STRING },
              totalGross: { type: Type.STRING },
              deliveryLocation: { type: Type.STRING },
            },
            required: ["workName", "size", "gsm", "totalGross"],
          },
        },
      },
    });

    const parsedData = JSON.parse(response.text || "[]");
    
    // Add default dates and empty fields
    const today = new Date().toISOString().split('T')[0];
    
    return parsedData.map((item: any) => ({
      ...item,
      date: today,
      jobCardNo: `JC-${Math.floor(Math.random() * 10000)}`, // Temporary ID generation
      loadingDate: "",
      supervisorSign: "",
      accountantSign: ""
    }));

  } catch (error) {
    console.error("Error parsing job order:", error);
    throw error;
  }
};

export { parseJobOrderText };