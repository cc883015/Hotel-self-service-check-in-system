const BASE = import.meta.env.VITE_API_BASE || "";

export async function fetchQuickQuestions(locale) {
  const res = await fetch(`${BASE}/api/support/quick-questions?locale=${locale}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchContact(locale) {
  const res = await fetch(`${BASE}/api/support/settings/contact?locale=${locale}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * FAQ intent shortcut — deterministic, no LLM.
 */
export async function chatIntent(sessionId, intent, locale) {
  const res = await fetch(`${BASE}/api/support/chat`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, intent, locale, message: "" }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return res.json();
}

/**
 * Free-text chat — tries FAQ server-side; falls back to SSE stream.
 * @param {{ sessionId: string, message: string, locale: string, history: object[], onToken: (t: string) => void, onDone: (meta: object) => void, onFaq: (data: object) => void, onError: (msg: string) => void, signal?: AbortSignal }} opts
 */
export async function chatStream(opts) {
  const { sessionId, message, locale, history, onToken, onDone, onFaq, onError, signal } = opts;

  const res = await fetch(`${BASE}/api/support/chat`, {
    method: "POST",
    credentials: "include",
    signal,
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({
      sessionId,
      message,
      locale,
      history,
      stream: true,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (res.status === 429) {
      onError(body.message || "rate_limited");
      return;
    }
    onError(body.message || `HTTP ${res.status}`);
    return;
  }

  const ct = res.headers.get("Content-Type") || "";
  if (ct.includes("application/json")) {
    const data = await res.json();
    onFaq(data);
    return;
  }

  if (!res.body) {
    onError("no_stream");
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const blocks = buf.split("\n\n");
    buf = blocks.pop() || "";

    for (const block of blocks) {
      const lines = block.split("\n");
      let event = "message";
      let data = "";
      for (const line of lines) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        if (line.startsWith("data:")) data = line.slice(5).trim();
      }
      if (!data) continue;
      try {
        const parsed = JSON.parse(data);
        if (event === "token" && parsed.text) onToken(parsed.text);
        if (event === "done") onDone(parsed);
      } catch {
        /* skip */
      }
    }
  }
}
