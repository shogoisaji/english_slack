import { SlackApiResponse, GeneratedWordData } from "../types"; // types.tsからインポート

// --- Slack投稿関数 (fetchを使用) ---
export async function postToSlack(
  botToken: string,
  channelId: string,
  wordData: GeneratedWordData
): Promise<boolean> {
  console.log(`Posting to Slack channel ${channelId}...`);
  const message = `*今日の英単語📝*\n\n*単語:* ${wordData.word}\n*意味:* ${wordData.translate}\n\n*例文:* ${wordData.example}\n*例文訳:* ${wordData.exampleTranslate}`;

  try {
    const response = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Bearer ${botToken}`,
      },
      body: JSON.stringify({
        channel: channelId,
        text: message,
        // blocks: [] // よりリッチなメッセージにしたい場合はBlocksを使う
      }),
    });

    const responseData = (await response.json()) as SlackApiResponse;

    if (!responseData.ok) {
      console.error("Error posting to Slack:", responseData.error);
      return false; // 失敗を示すためにfalseを返す
    }

    console.log("Successfully posted to Slack:", responseData);
    return true; // 成功を示すためにtrueを返す
  } catch (error) {
    console.error("Failed to post message to Slack:", error);
    return false; // 失敗を示すためにfalseを返す
  }
}
