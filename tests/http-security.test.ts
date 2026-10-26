import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import worker from "../src/index";
import { createDb, listRecentWords } from "../src/services/d1";

vi.mock("../src/services/d1", () => ({
  createDb: vi.fn(),
  listRecentWords: vi.fn(),
  hasRecentPost: vi.fn(),
  takeNextWord: vi.fn(),
  markWordPosted: vi.fn(),
}));

describe("HTTP security", () => {
  const limit = vi.fn().mockResolvedValue({ success: true });
  const env = { READ_RATE_LIMITER: { limit } };

  beforeEach(() => {
    vi.clearAllMocks();
    limit.mockResolvedValue({ success: true });
    vi.mocked(listRecentWords).mockResolvedValue([]);
    vi.stubGlobal("fetch", vi.fn(() => {
      throw new Error("HTTP requests must never post to Slack");
    }));
  });

  afterEach(() => vi.unstubAllGlobals());

  it.each([
    ["POST", "/word-list/random"],
    ["POST", "/word-list/random/"],
    ["POST", "/word-list/%72andom"],
    ["GET", "/word-list/random"],
    ["PUT", "/word-list/random"],
    ["DELETE", "/word-list/random"],
  ])("rejects the removed posting route: %s %s", async (method, path) => {
    const response = await worker.fetch(
      new Request(`https://example.com${path}`, { method }),
      env
    );
    expect(response.status).toBe(404);
    expect(createDb).not.toHaveBeenCalled();
    expect(limit).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("does not process Slack URL verification on the removed route", async () => {
    const response = await worker.fetch(new Request("https://example.com/word-list/random", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "url_verification", challenge: "test" }),
    }), env);
    expect(response.status).toBe(404);
    expect(createDb).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects excess reads before accessing D1", async () => {
    limit.mockResolvedValue({ success: false });
    const response = await worker.fetch(new Request("https://example.com/word-list", {
      headers: { "CF-Connecting-IP": "192.0.2.1" },
    }), env);
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("60");
    expect(limit).toHaveBeenCalledWith({ key: "word-list:192.0.2.1" });
    expect(createDb).not.toHaveBeenCalled();
  });

  it("keeps allowed reads working", async () => {
    const response = await worker.fetch(new Request("https://example.com/word-list"), env);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
    expect(listRecentWords).toHaveBeenCalledOnce();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("fails closed if the read limiter fails", async () => {
    limit.mockRejectedValueOnce(new Error("Limiter unavailable"));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const response = await worker.fetch(new Request("https://example.com/word-list"), env);
      expect(response.status).toBe(500);
      expect(createDb).not.toHaveBeenCalled();
    } finally {
      log.mockRestore();
    }
  });

  it("does not advertise POST in CORS preflight", async () => {
    const response = await worker.fetch(new Request("https://example.com/word-list/random", {
      method: "OPTIONS",
      headers: { Origin: "https://example.org", "Access-Control-Request-Method": "POST" },
    }), env);
    expect(response.headers.get("Access-Control-Allow-Methods")).not.toContain("POST");
    expect(createDb).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
});
