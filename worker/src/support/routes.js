import { Hono } from "hono";
import {
  getQuickFaqs,
  getFaqByIntent,
  getAllFaqKeywords,
  insertChatLog,
  checkRateLimit,
} from "./db.js";
import { matchFaqIntent, faqActions } from "./faqEngine.js";
import { enrichFaqAnswer, buildSystemPrompt, fallbackMessage } from "./knowledge.js";
import { generateWithFallback } from "./llm/registry.js";

const support = new Hono();

const RATE_LIMIT = 30;
const RATE_WINDOW = 60;
const MAX_HISTORY = 8;

function parseLocale(raw) {
  return raw === "zh" ? "zh" : "en";
}

function maxInputChars(env) {
  const n = parseInt(String(env.MAX_INPUT_CHARS || "2000"), 10);
  return Number.isFinite(n) && n > 0 ? n : 2000;
}

function chatLogsEnabled(env) {
  return String(env.ENABLE_CHAT_LOGS || "false").toLowerCase() === "true";
}

function sanitizeInput(raw, maxLen) {
  if (typeof raw !== "string") return "";
  return raw.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim().slice(0, maxLen);
}

function getClientIP(c) {
  const cf = c.req.header("CF-Connecting-IP") || c.req.header("Cf-Connecting-Ip");
  if (cf) return cf.trim();
  const xff = c.req.header("X-Forwarded-For");
  if (xff) {
    const first = xff.split(",")[0];
    if (first) return first.trim();
  }
  return "unknown";
}

async function maybeLog(env, row) {
  if (!chatLogsEnabled(env)) return;
  try {
    await insertChatLog(env.DB, row);
  } catch (err) {
    console.error("[support chat log]", err);
  }
}

async function buildFaqResponse(env, intent, locale) {
  const row = await getFaqByIntent(env.DB, intent, locale);
  if (!row) return null;
  const answer = await enrichFaqAnswer(env.DB, intent, row.answer, locale);
  return {
    source: "faq",
    intent,
    answer,
    actions: faqActions(intent),
  };
}

support.get("/quick-questions", async (c) => {
  const locale = parseLocale(c.req.query("locale"));
  const rows = await getQuickFaqs(c.env.DB, locale);
  const enriched = await Promise.all(
    rows.map(async (r) => ({
      id: r.id,
      intent: r.intent,
      question: r.question,
      answer: await enrichFaqAnswer(c.env.DB, r.intent, r.answer, locale),
      sort_order: r.sort_order,
      actions: faqActions(r.intent),
    }))
  );
  return c.json({ questions: enriched });
});

support.get("/settings/contact", (c) => {
  const locale = parseLocale(c.req.query("locale"));
  return c.json({
    contact_in_person: true,
    message:
      locale === "zh"
        ? "请前往前台当面联系 reception。"
        : "Please contact reception in person at the front desk.",
  });
});

support.post("/chat", async (c) => {
  const ip = getClientIP(c);
  const body = await c.req.json().catch(() => ({}));
  const locale = parseLocale(body.locale);
  const maxLen = maxInputChars(c.env);
  const sessionId = sanitizeInput(body.sessionId || "anon", 64) || "anon";
  const message = sanitizeInput(body.message, maxLen);
  const intentDirect = typeof body.intent === "string" ? body.intent.trim() : "";

  const rateKey = `support:${ip}`;
  const rate = await checkRateLimit(c.env.DB, rateKey, RATE_LIMIT, RATE_WINDOW);
  if (!rate.ok) {
    return c.json(
      {
        error: "rate_limited",
        message:
          locale === "zh"
            ? "请求过于频繁，请稍后再试。"
            : "Too many requests. Please wait a moment.",
        retry_after: rate.retryAfter,
      },
      429
    );
  }

  if (intentDirect) {
    const faq = await buildFaqResponse(c.env, intentDirect, locale);
    if (faq) {
      await maybeLog(c.env, {
        id: crypto.randomUUID(),
        session_id: sessionId,
        role: "user",
        content: `[intent:${intentDirect}]`,
        matched_intent: intentDirect,
        provider: null,
        created_at: new Date().toISOString(),
      });
      return c.json(faq);
    }
  }

  if (!message) {
    return c.json({ error: "empty_message" }, 400);
  }

  const keywordRows = await getAllFaqKeywords(c.env.DB);
  const matched = matchFaqIntent(message, keywordRows);
  if (matched) {
    const faq = await buildFaqResponse(c.env, matched, locale);
    if (faq) {
      await maybeLog(c.env, {
        id: crypto.randomUUID(),
        session_id: sessionId,
        role: "user",
        content: message,
        matched_intent: matched,
        provider: null,
        created_at: new Date().toISOString(),
      });
      await maybeLog(c.env, {
        id: crypto.randomUUID(),
        session_id: sessionId,
        role: "assistant",
        content: faq.answer,
        matched_intent: matched,
        provider: null,
        created_at: new Date().toISOString(),
      });
      return c.json(faq);
    }
  }

  /** @type {{ role: string, content: string }[]} */
  let history = Array.isArray(body.history) ? body.history : [];
  history = history
    .filter((h) => h && (h.role === "user" || h.role === "assistant") && typeof h.content === "string")
    .slice(-MAX_HISTORY);

  const messages = [...history, { role: "user", content: message }];
  const system = await buildSystemPrompt(c.env.DB, locale);

  const accept = c.req.header("Accept") || "";
  const wantsStream = accept.includes("text/event-stream") || body.stream === true;

  const controller = new AbortController();
  c.req.raw.signal?.addEventListener("abort", () => controller.abort());

  const llm = await generateWithFallback(c.env, {
    system,
    messages,
    signal: controller.signal,
  });

  if (!llm) {
    const text = fallbackMessage(locale);
    if (wantsStream) {
      return sseTextResponse(text, { source: "fallback", provider: null });
    }
    return c.json({
      source: "fallback",
      answer: text,
      actions: ["contact_front_desk"],
    });
  }

  await maybeLog(c.env, {
    id: crypto.randomUUID(),
    session_id: sessionId,
    role: "user",
    content: message,
    matched_intent: null,
    provider: null,
    created_at: new Date().toISOString(),
  });

  if (llm.text) {
    await maybeLog(c.env, {
      id: crypto.randomUUID(),
      session_id: sessionId,
      role: "assistant",
      content: llm.text,
      matched_intent: null,
      provider: llm.provider,
      created_at: new Date().toISOString(),
    });
    if (wantsStream) {
      return sseTextResponse(llm.text, { source: "llm", provider: llm.provider });
    }
    return c.json({ source: "llm", answer: llm.text, provider: llm.provider });
  }

  if (llm.stream && wantsStream) {
    return sseFromStream(llm.stream, llm.provider, sessionId, c.env);
  }

  if (llm.stream) {
    const full = await readStreamToString(llm.stream);
    await maybeLog(c.env, {
      id: crypto.randomUUID(),
      session_id: sessionId,
      role: "assistant",
      content: full,
      matched_intent: null,
      provider: llm.provider,
      created_at: new Date().toISOString(),
    });
    return c.json({ source: "llm", answer: full, provider: llm.provider });
  }

  const text = fallbackMessage(locale);
  return c.json({ source: "fallback", answer: text, actions: ["contact_front_desk"] });
});

function sseTextResponse(text, meta) {
  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder();
      controller.enqueue(enc.encode(`event: token\ndata: ${JSON.stringify({ text })}\n\n`));
      controller.enqueue(
        enc.encode(`event: done\ndata: ${JSON.stringify(meta)}\n\n`)
      );
      controller.close();
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

function sseFromStream(source, provider, sessionId, env) {
  const enc = new TextEncoder();
  let full = "";
  const reader = source.getReader();

  const stream = new ReadableStream({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          controller.enqueue(
            enc.encode(`event: done\ndata: ${JSON.stringify({ source: "llm", provider })}\n\n`)
          );
          controller.close();
          await maybeLog(env, {
            id: crypto.randomUUID(),
            session_id: sessionId,
            role: "assistant",
            content: full,
            matched_intent: null,
            provider,
            created_at: new Date().toISOString(),
          });
          return;
        }
        const chunk = typeof value === "string" ? value : new TextDecoder().decode(value);
        full += chunk;
        controller.enqueue(
          enc.encode(`event: token\ndata: ${JSON.stringify({ text: chunk })}\n\n`)
        );
      } catch (err) {
        console.error("[support sse]", err);
        const locale = "en";
        const fb = fallbackMessage(locale);
        controller.enqueue(enc.encode(`event: token\ndata: ${JSON.stringify({ text: fb })}\n\n`));
        controller.enqueue(
          enc.encode(`event: done\ndata: ${JSON.stringify({ source: "fallback", provider: null })}\n\n`)
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

async function readStreamToString(stream) {
  const reader = stream.getReader();
  let out = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    out += typeof value === "string" ? value : new TextDecoder().decode(value);
  }
  return out;
}

export default support;
