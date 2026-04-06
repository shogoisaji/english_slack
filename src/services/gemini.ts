import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  GenerationConfig,
  SafetySetting,
  SchemaType,
  ObjectSchema,
} from "@google/generative-ai";
import { GeneratedWordData } from "../types";

// --- Gemini API 呼び出し関数 ---
export async function generateWordData(
  apiKey: string,
  excludeWords: string[] = []
): Promise<GeneratedWordData | null> {
  console.log("Generating word data using Gemini...");
  if (excludeWords.length > 0) {
    console.log(
      `Excluding ${excludeWords.length} words:`,
      excludeWords.join(", ")
    );
  }
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
    });

    const schema: ObjectSchema = {
      type: SchemaType.OBJECT,
      properties: {
        word: { type: SchemaType.STRING },
        translate: { type: SchemaType.STRING },
        example: { type: SchemaType.STRING },
        exampleTranslate: { type: SchemaType.STRING },
      },
      required: ["word", "translate", "example", "exampleTranslate"],
    };

    const generationConfig: GenerationConfig = {
      responseMimeType: "application/json",
      responseSchema: schema,
    };

    const safetySettings: SafetySetting[] = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ];

    let promptText = `Generate a middle-to-high level English word and its Japanese translation, along with an example sentence and its translation. Provide the output strictly in the following JSON format:
{
  "word": "string",
  "translate": "string",
  "example": "string",
  "exampleTranslate": "string"
}
Choose a word that is at a intermediate to advanced level (suitable for TOEIC 600-900 or CEFR B1-C1). Avoid very basic words, but ensure the word is practical for business and professional communication.
example:
{
  "word": "facilitate",
  "translate": "促進する、容易にする",
  "example": "The new software is designed to facilitate better communication among team members.",
  "exampleTranslate": "新しいソフトウェアは、チームメンバー間のより良いコミュニケーションを促進するために設計されています。"
}
`;

    if (excludeWords.length > 0) {
      promptText += `\n\nIMPORTANT: Do NOT generate any of the following words: ${excludeWords.join(
        ", "
      )}.`;
    }

    const parts = [{ text: promptText }];

    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig,
      safetySettings,
    });

    const response = result.response;
    const jsonText = response.text();

    const wordData = JSON.parse(jsonText) as GeneratedWordData;

    if (
      !wordData ||
      Object.values(wordData).some((value) => typeof value !== "string")
    ) {
      console.error("Invalid JSON format received from Gemini:", wordData);
      return null;
    }

    return wordData;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return null;
  }
}
