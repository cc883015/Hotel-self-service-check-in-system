/** Workers AI provider — default fallback, no external API key. */

/**
 * @param {import('@cloudflare/workers-types').Ai} ai
 * @param {string} model
 * @param {{ system: string, messages: { role: string, content: string }[], signal: AbortSignal }} args
 */
export async function workersAIGenerate(ai, model, { system, messages, signal }) {
  const allMessages = [{ role: "system", content: system }, ...messages];

  try {
    const stream = await ai.run(model, { messages: allMessages, stream: true }, { signal });
    if (stream instanceof ReadableStream) {
      return { kind: "stream", stream };
    }
  } catch (err) {
    console.error("[llm workers-ai stream failed]", err);
  }

  try {
    const result = await ai.run(model, { messages: allMessages }, { signal });
    const text = extractWorkersAIText(result);
    return { kind: "text", text };
  } catch (err) {
    console.error("[llm workers-ai failed]", err);
    throw err;
  }
}

function extractWorkersAIText(result) {
  if (typeof result === "string") return result;
  if (result && typeof result.response === "string") return result.response;
  if (result && typeof result.text === "string") return result.text;
  return JSON.stringify(result ?? "");
}

/** Normalize Workers AI stream chunks to plain text tokens. */
export function workersAIStreamToTextStream(source) {
  const decoder = new TextDecoder();
  const reader = source.getReader();
  let buffer = "";

  return new ReadableStream({
    async pull(controller) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          if (buffer) {
            const t = parseChunk(buffer);
            if (t) controller.enqueue(t);
          }
          controller.close();
          return;
        }
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n");
        buffer = parts.pop() || "";
        for (const part of parts) {
          const t = parseChunk(part);
          if (t) controller.enqueue(t);
        }
      }
    },
  });
}

function parseChunk(raw) {
  const line = raw.trim();
  if (!line) return "";
  try {
    const json = JSON.parse(line);
    if (typeof json.response === "string") return json.response;
    if (typeof json.text === "string") return json.text;
  } catch {
    /* plain text chunk */
  }
  return line;
}
