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
      model: "gemini-2.5-pro-exp-03-25",
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

    let promptText = `Generate an English word and its Japanese translation, along with an example sentence and its translation. Provide the output strictly in the following JSON format:
{
  "word": "string",
  "translate": "string",
  "example": "string",
  "exampleTranslate": "string"
}
Choose a word that is practical for everyday conversation or business situations. Ensure the example sentence clearly demonstrates the usage of the word.
example:
{
  "word": "negotiate",
  "translate": "交渉する",
  "example": "We need to negotiate the terms of the contract before signing.",
  "exampleTranslate": "署名する前に、契約条件を交渉する必要があります。"
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
