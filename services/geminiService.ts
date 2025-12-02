import { GoogleGenAI, Type } from "@google/genai";
import { FieldSchema, MappingPair } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key not found");
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

export const suggestMapping = async (
  sourceSchema: FieldSchema[],
  targetSchema: FieldSchema[]
): Promise<MappingPair[]> => {
  try {
    const client = getClient();
    
    const prompt = `
      I need to map fields from a Notion database (Source) to a Lark/Feishu Base (Target).
      
      Source Schema (Notion):
      ${JSON.stringify(sourceSchema, null, 2)}
      
      Target Schema (Lark):
      ${JSON.stringify(targetSchema, null, 2)}
      
      Please analyze the field names and data types. Return a JSON array of objects where each object has "sourceFieldId" and "targetFieldId".
      Only map fields that are semantically similar and have compatible data types.
      Do not invent fields. Only use the IDs provided.
    `;

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              sourceFieldId: { type: Type.STRING },
              targetFieldId: { type: Type.STRING },
            },
            required: ["sourceFieldId", "targetFieldId"]
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) return [];
    
    const mapping = JSON.parse(jsonText) as MappingPair[];
    return mapping;

  } catch (error) {
    console.error("Gemini mapping failed", error);
    return [];
  }
};