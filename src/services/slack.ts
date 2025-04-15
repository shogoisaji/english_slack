import { SlackApiResponse, GeneratedWordData } from "../types";

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

    // レスポンスボディをテキストとして取得（JSONパースエラー対策）
    const responseBodyText = await response.text();
    // ★ レスポンスの生ログを追加 (デバッグ用にステータスとボディを出力)
    console.log(
      `Slack API Response Status: ${response.status}, Body: ${responseBodyText}`
    );

    // テキストからJSONをパース
    const responseData = JSON.parse(responseBodyText) as SlackApiResponse;

    // 型ガードを使って ok プロパティで成功/失敗を判断
    if (!responseData.ok) {
      // ★ エラーログを詳細化 (エラー内容とレスポンスボディ全体を出力)
      console.error(
        `Error posting to Slack: ok=${responseData.ok}, error=${responseData.error}, responseBody=${responseBodyText}`
      );
      return false; // 失敗を示すためにfalseを返す
    }

    // 成功した場合 (responseData は SlackSuccessResponse 型)
    console.log("Successfully posted to Slack:", responseData);
    return true; // 成功を示すためにtrueを返す
  } catch (error) {
    // fetch自体やJSONパースのエラー
    // ★ 例外エラーログを区別
    console.error("Failed to post message to Slack (exception):", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return false; // 失敗を示すためにfalseを返す
  }
}
