/** Workers AI provider — default fallback, no external API key. */

const MODELS = [
  "@cf/meta/llama-3.1-8b-instruct",
  "@cf/meta/llama-3.1-8b-instruct-fp8",
];

/**
 * @param {import('@cloudflare/workers-types').Ai} ai
 * @param {{ system: string, messages: { role: string, content: string }[] }} args
 */
export async function workersAIGenerate(ai, { system, messages }) {
  const allMessages = [{ role: "system", content: system }, ...messages];
  const inputs = {
    messages: allMessages,
    max_tokens: 512,
    temperature: 0.4,
  };

  for (const model of MODELS) {
    try {
      const result = await ai.run(model, inputs);
      const text = extractWorkersAIText(result);
      if (text?.trim()) {
        return { kind: "text", text: text.trim(), model };
      }
    } catch (err) {
      console.error(`[llm workers-ai sync ${model}]`, err?.message || err);
    }

    try {
      const stream = await ai.run(model, { ...inputs, stream: true });
      if (stream instanceof ReadableStream) {
        return { kind: "stream", stream, model };
      }
    } catch (err) {
      console.error(`[llm workers-ai stream ${model}]`, err?.message || err);
    }
  }

  throw new Error("workers-ai unavailable");
}

function extractWorkersAIText(result) {
  if (typeof result === "string") return result;
  if (result && typeof result.response === "string") return result.response;
  if (result && typeof result.text === "string") return result.text;
  if (result?.result && typeof result.result.response === "string") return result.result.response;
  return "";
}

/** Normalize Workers AI SSE stream chunks to plain text tokens. */
export function workersAIStreamToTextStream(source) {
  const decoder = new TextDecoder();
  const reader = source.getReader();
  let buffer = "";

  return new ReadableStream({
    async pull(controller) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          flushBuffer(buffer, controller);
          buffer = "";
          controller.close();
          return;
        }
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split(/\r?\n/);
        buffer = parts.pop() || "";
        for (const part of parts) {
          const t = parseChunk(part);
          if (t) controller.enqueue(t);
        }
      }
    },
  });
}

function flushBuffer(buffer, controller) {
  for (const part of buffer.split(/\r?\n/)) {
    const t = parseChunk(part);
    if (t) controller.enqueue(t);
  }
}

function parseChunk(raw) {
  let line = raw.trim();
  if (!line || line === "[DONE]" || line === "data: [DONE]") return "";
  if (line.startsWith("data:")) line = line.slice(5).trim();
  if (!line) return "";
  try {
    const json = JSON.parse(line);
    if (typeof json.response === "string") return json.response;
    if (typeof json.text === "string") return json.text;
  } catch {
    /* plain text chunk */
  }
  if (line.startsWith("{")) return "";
  return line;
}
