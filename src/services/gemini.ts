import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  GenerationConfig,
  SafetySetting,
  SchemaType,
  ObjectSchema,
} from "@google/generative-ai";
import { GeneratedWordData } from "../types"; // types.tsからインポート

// --- Gemini API 呼び出し関数 ---
export async function generateWordData(
  apiKey: string
): Promise<GeneratedWordData | null> {
  console.log("Generating word data using Gemini...");
  try {
    const genAI = new GoogleGenerativeAI(apiKey); // APIキーを引数で受け取る
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-pro-exp-03-25",
    });

    const schema: ObjectSchema = {
      type: SchemaType.OBJECT,
      properties: {
        word: {
          type: SchemaType.STRING,
        },
        translate: {
          type: SchemaType.STRING,
        },
        example: {
          type: SchemaType.STRING,
        },
        exampleTranslate: {
          type: SchemaType.STRING,
        },
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

    const parts = [
      {
        text: `IT分野で一般的に使用される英単語をランダムに1つ選択してください。選択した単語、その日本語訳、その単語を使った例文（英語）、そしてその例文の日本語訳を提供してください。
出力は、以下のJSON形式に厳密に従ってください。

{
  "word": "string", // 選択された英単語
  "translate": "string", // 単語の日本語訳
  "example": "string", // 単語を使った英語の例文
  "exampleTranslate": "string" // 例文の日本語訳
}

例：
{
  "word": "algorithm",
  "translate": "アルゴリズム",
  "example": "Searching through large datasets requires an efficient algorithm.",
  "exampleTranslate": "大規模なデータセットを検索するには、効率的なアルゴリズムが必要です。"
}`,
      },
    ];

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
