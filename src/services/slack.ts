import { SlackApiResponse, GeneratedWordData } from "../types";

export async function postToSlack(
  botToken: string,
  channelId: string,
  wordData: GeneratedWordData,
  isDbSuccess?: boolean
): Promise<boolean> {
  const dbState = isDbSuccess == null ? "" : isDbSuccess ? "🌐 ⭕️" : "🌐 ❌";
  const message = `🔔---🔔---🔔---🔔---🔔  ${dbState}\n\n🇺🇸 : ${wordData.word}\n🇯🇵 : ${wordData.translate}\n\n🇺🇸 : ${wordData.example}\n🇯🇵 : ${wordData.exampleTranslate}`;

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
      }),
    });

    const responseBodyText = await response.text();

    const responseData = JSON.parse(responseBodyText) as SlackApiResponse;

    if (!responseData.ok) {
      console.error(
        `Error posting to Slack: ok=${responseData.ok}, error=${responseData.error}, responseBody=${responseBodyText}`
      );
      return false;
    }

    console.log("Successfully posted to Slack:", responseData);
    return true;
  } catch (error) {
    console.error("Failed to post message to Slack (exception):", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return false;
  }
}
