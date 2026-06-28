import { workersAIGenerate, workersAIStreamToTextStream } from "./workersAI.js";

/**
 * @param {Record<string, unknown>} env
 * @param {{ system: string, messages: { role: string, content: string }[], signal: AbortSignal }} args
 * @returns {Promise<{ provider: string, stream?: ReadableStream<string>, text?: string } | null>}
 */
export async function generateWithFallback(env, args) {
  const order = String(env.LLM_PROVIDER_ORDER || "workers-ai")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const timeoutMs = parseInt(String(env.LLM_TIMEOUT_MS || "8000"), 10) || 8000;

  for (const id of order) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const linked = args.signal;
    if (linked?.aborted) {
      clearTimeout(timer);
      break;
    }
    linked?.addEventListener("abort", () => controller.abort(), { once: true });

    try {
      if (id === "workers-ai" && env.AI) {
        const result = await workersAIGenerate(env.AI, {
          system: args.system,
          messages: args.messages,
        });
        clearTimeout(timer);
        if (result.kind === "stream") {
          const textStream = workersAIStreamToTextStream(result.stream);
          return { provider: "workers-ai", stream: textStream };
        }
        if (result.kind === "text" && result.text) {
          return { provider: "workers-ai", text: result.text };
        }
      }

      if (id === "groq" && env.GROQ_API_KEY) {
        const out = await groqGenerate(env.GROQ_API_KEY, args, controller.signal);
        clearTimeout(timer);
        if (out) return { provider: "groq", ...out };
      }

      if (id === "gemini" && env.GEMINI_API_KEY) {
        const out = await geminiGenerate(env.GEMINI_API_KEY, args, controller.signal);
        clearTimeout(timer);
        if (out) return { provider: "gemini", ...out };
      }

      if (id === "openrouter" && env.OPENROUTER_API_KEY) {
        const out = await openrouterGenerate(env.OPENROUTER_API_KEY, args, controller.signal);
        clearTimeout(timer);
        if (out) return { provider: "openrouter", ...out };
      }
    } catch (err) {
      clearTimeout(timer);
      console.error(`[llm ${id}]`, err);
    }
  }

  return null;
}

async function groqGenerate(apiKey, { system, messages }, signal) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    signal,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      stream: true,
      messages: [{ role: "system", content: system }, ...messages],
    }),
  });
  if (!res.ok) throw new Error(`groq ${res.status}`);
  if (!res.body) throw new Error("groq no body");
  return { stream: openAICompatSSEToText(res.body) };
}

async function geminiGenerate(apiKey, { system, messages }, signal) {
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?alt=sse&key=" +
    encodeURIComponent(apiKey);
  const res = await fetch(url, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents,
    }),
  });
  if (!res.ok) throw new Error(`gemini ${res.status}`);
  if (!res.body) throw new Error("gemini no body");
  return { stream: geminiSSEToText(res.body) };
}

async function openrouterGenerate(apiKey, { system, messages }, signal) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    signal,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "meta-llama/llama-3.1-8b-instruct:free",
      stream: true,
      messages: [{ role: "system", content: system }, ...messages],
    }),
  });
  if (!res.ok) throw new Error(`openrouter ${res.status}`);
  if (!res.body) throw new Error("openrouter no body");
  return { stream: openAICompatSSEToText(res.body) };
}

function openAICompatSSEToText(body) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  return new ReadableStream({
    async pull(controller) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          return;
        }
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() || "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const data = trimmed.slice(5).trim();
          if (data === "[DONE]") continue;
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) controller.enqueue(delta);
          } catch {
            /* skip */
          }
        }
      }
    },
  });
}

function geminiSSEToText(body) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  return new ReadableStream({
    async pull(controller) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          return;
        }
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() || "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const data = trimmed.slice(5).trim();
          try {
            const json = JSON.parse(data);
            const parts = json.candidates?.[0]?.content?.parts;
            if (parts) {
              for (const p of parts) {
                if (p.text) controller.enqueue(p.text);
              }
            }
          } catch {
            /* skip */
          }
        }
      }
    },
  });
}
