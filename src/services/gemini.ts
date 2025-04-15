import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  GenerationConfig,
  SafetySetting,
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
      model: "gemini-2.5-pro-exp-0325",
    });

    const generationConfig: GenerationConfig = {
      responseMimeType: "application/json",
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

    // ★ プロンプトを除外リストに応じて変更
    let promptText = `Generate an English word and its Japanese translation, along with an example sentence and its translation. Provide the output strictly in the following JSON format:
{
  "word": "string",
  "translate": "string",
  "example": "string",
  "exampleTranslate": "string"
}
Choose a word that is practical for everyday conversation or business situations. Ensure the example sentence clearly demonstrates the usage of the word.`;

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
    console.log("Gemini raw response:", jsonText);

    const wordData = JSON.parse(jsonText) as GeneratedWordData;

    if (
      !wordData ||
      typeof wordData.word !== "string" ||
      typeof wordData.translate !== "string" ||
      typeof wordData.example !== "string" ||
      typeof wordData.exampleTranslate !== "string"
    ) {
      console.error("Invalid JSON format received from Gemini:", wordData);
      return null;
    }

    console.log("Parsed word data:", wordData);
    return wordData;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return null;
  }
}
