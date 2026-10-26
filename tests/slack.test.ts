import { afterEach, describe, expect, it, vi } from "vitest";
import { postWord } from "../src/services/slack";
import type { Bindings } from "../src/types";

const card = { word: "test", translate: "試験", example: "A test.", exampleTranslate: "試験です。" };
// postWord only needs the Slack credentials; it must not use D1 or the read limiter.
const env = {
  SLACK_BOT_TOKEN: "test-token",
  SLACK_CHANNEL_ID: "test-channel",
  get DB(): D1Database { throw new Error("Unexpected DB access"); },
  get READ_RATE_LIMITER(): RateLimit { throw new Error("Unexpected limiter access"); },
} satisfies Bindings;

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("Slack delivery", () => {
  it("accepts a successful response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ ok: true })));
    await expect(postWord(env, card)).resolves.toBeUndefined();
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("propagates a request timeout without retrying", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("Request timed out", "TimeoutError")));
    await expect(postWord(env, card)).rejects.toThrow("Request timed out");
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("reports Slack rate limiting without retrying or exposing credentials", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("rate limited", { status: 429 })));
    await expect(postWord(env, card)).rejects.toThrow("Slack HTTP error: 429");
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("reports API-level errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ ok: false, error: "invalid_auth" })));
    await expect(postWord(env, card)).rejects.toThrow("Slack API error: invalid_auth");
  });
});
