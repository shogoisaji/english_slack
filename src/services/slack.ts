import type { Bindings, WordCard } from "../types";

type SlackApiResponse =
  | { ok: true }
  | {
      ok: false;
      error?: string;
    };

export function formatWordMessage(card: WordCard): string {
  return [
    `🇺🇸 : ${card.word}`,
    `🇯🇵 : ${card.translate}`,
    "",
    `🇺🇸 : ${card.example}`,
    `🇯🇵 : ${card.exampleTranslate}`,
  ].join("\n");
}

export async function postWord(env: Bindings, card: WordCard): Promise<void> {
  const response = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    signal: AbortSignal.timeout(10_000),
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: `Bearer ${env.SLACK_BOT_TOKEN}`,
    },
    body: JSON.stringify({
      channel: env.SLACK_CHANNEL_ID,
      text: formatWordMessage(card),
    }),
  });

  if (!response.ok) {
    await response.body?.cancel();
    throw new Error(`Slack HTTP error: ${response.status}`);
  }

  const body = await response.text();
  let data: SlackApiResponse;
  try {
    data = JSON.parse(body) as SlackApiResponse;
  } catch {
    throw new Error(
      `Slack response was not JSON (status ${response.status})`
    );
  }

  if (!data.ok) {
    throw new Error(`Slack API error: ${data.error ?? "unknown"}`);
  }
}
