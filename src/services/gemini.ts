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

    let promptText = `Generate an easy-to-intermediate English word and its Japanese translation, along with an example sentence and its translation. Provide the output strictly in the following JSON format:
{
  "word": "string",
  "translate": "string",
  "example": "string",
  "exampleTranslate": "string"
}
Choose a word that is suitable for TOEIC 400-700 or CEFR A2-B1. Prefer practical words that are useful in everyday conversation, travel, study, or simple workplace communication. Avoid very basic words such as "book", "eat", or "go", and avoid advanced, abstract, or highly specialized vocabulary.
example:
{
  "word": "improve",
  "translate": "改善する、向上させる",
  "example": "I want to improve my English speaking skills.",
  "exampleTranslate": "英語を話す力を向上させたいです。"
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
