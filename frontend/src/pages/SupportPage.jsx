import { useCallback, useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { t } from "../lib/i18n.js";
import { fetchQuickQuestions, chatStream } from "../lib/supportApi.js";
import QuickQuestions from "../components/support/QuickQuestions.jsx";
import MessageBubble from "../components/support/MessageBubble.jsx";
import HouseRulesPanel from "../components/support/HouseRulesPanel.jsx";

const SESSION_KEY = "cliff_support_session";
const MAX_HISTORY = 8;

function getSessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

export default function SupportPage() {
  const { locale } = useOutletContext();
  const [questions, setQuestions] = useState([]);
  const [loadingQ, setLoadingQ] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [sessionId] = useState(getSessionId);
  const bottomRef = useRef(null);
  const abortRef = useRef(null);

  const scrollBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadingQ(true);
    fetchQuickQuestions(locale)
      .then((data) => {
        if (!cancelled) setQuestions(data.questions || []);
      })
      .catch(() => {
        if (!cancelled) setQuestions([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingQ(false);
      });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  useEffect(() => {
    scrollBottom();
  }, [messages, streaming, scrollBottom]);

  function pushMessage(msg) {
    setMessages((prev) => [...prev, msg]);
  }

  function historyForApi(excludeLastAssistant) {
    const slice = excludeLastAssistant ? messages.slice(0, -1) : messages;
    return slice
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(-MAX_HISTORY)
      .map((m) => ({ role: m.role, content: m.content }));
  }

  function handleQuickSelect(q) {
    if (streaming) return;
    pushMessage({ role: "user", content: q.question });
    pushMessage({
      role: "assistant",
      content: q.answer,
      actions: q.actions || [],
      source: "faq",
    });
  }

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    pushMessage({ role: "user", content: text });
    setStreaming(true);

    pushMessage({ role: "assistant", content: "", actions: [], source: "pending" });

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    let acc = "";
    await chatStream({
      sessionId,
      message: text,
      locale,
      history: historyForApi(false).slice(0, -1),
      signal: abortRef.current.signal,
      onFaq(data) {
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.role === "assistant") {
            next[next.length - 1] = {
              role: "assistant",
              content: data.answer,
              actions: data.actions || [],
              source: data.source || "faq",
            };
          }
          return next;
        });
        setStreaming(false);
      },
      onToken(token) {
        acc += token;
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.role === "assistant") {
            next[next.length - 1] = { ...last, content: acc, source: "llm" };
          }
          return next;
        });
      },
      onDone(meta) {
        setStreaming(false);
        if (meta?.source === "fallback") {
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role === "assistant" && !last.content) {
              next[next.length - 1] = {
                role: "assistant",
                content: acc || t(locale, "aiUnavailable") + " " + t(locale, "tryQuick"),
                actions: ["contact_front_desk"],
                source: "fallback",
              };
            } else if (last?.role === "assistant") {
              next[next.length - 1] = { ...last, actions: last.actions?.length ? last.actions : [] };
            }
            return next;
          });
        }
      },
      onError(msg) {
        setStreaming(false);
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.role === "assistant") {
            next[next.length - 1] = {
              role: "assistant",
              content: msg || t(locale, "rateLimited"),
              actions: ["contact_front_desk"],
              source: "error",
            };
          }
          return next;
        });
      },
    });
  }

  const showWelcome = messages.length === 0;

  return (
    <main className="flex-1 flex flex-col px-4 md:px-8 py-4 max-w-2xl mx-auto w-full min-h-0">
      <HouseRulesPanel locale={locale} />

      <div className="flex-1 flex flex-col card p-4 md:p-5 min-h-[420px] shadow-2xl shadow-black/30">
        {showWelcome && (
          <p className="text-sm text-amber-100/85 mb-4 leading-relaxed">{renderWelcome(t(locale, "welcome"))}</p>
        )}

        <h2 className="text-[11px] uppercase tracking-[0.2em] text-amber-400/80 mb-2">
          {t(locale, "commonQuestions")}
        </h2>
        <QuickQuestions
          questions={questions}
          loading={loadingQ}
          locale={locale}
          onSelect={handleQuickSelect}
        />

        <div
          className="flex-1 overflow-y-auto min-h-[160px] max-h-[45vh] md:max-h-[50vh] pr-1 -mr-1"
          aria-live="polite"
          aria-label="Chat messages"
        >
          {messages.map((m, i) => (
            <MessageBubble
              key={i}
              role={m.role}
              content={m.content || (streaming && i === messages.length - 1 ? t(locale, "thinking") : "")}
              actions={m.actions}
              locale={locale}
            />
          ))}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} className="mt-3 pt-3 border-t border-ink-800">
          <label htmlFor="support-input" className="sr-only">
            {t(locale, "placeholder")}
          </label>
          <div className="flex gap-2">
            <input
              id="support-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t(locale, "placeholder")}
              className="input flex-1 text-base"
              disabled={streaming}
              autoComplete="off"
              enterKeyHint="send"
            />
            <button type="submit" disabled={streaming || !input.trim()} className="btn-primary px-5 min-w-[80px]">
              {t(locale, "send")}
            </button>
          </div>
          <p className="mt-2 text-xs text-ink-600 text-center">{t(locale, "footerHint")}</p>
        </form>
      </div>

      <p className="mt-4 mb-6 text-[10px] leading-relaxed text-ink-600 text-center px-2">
        {t(locale, "disclaimer")}
      </p>
    </main>
  );
}

function renderWelcome(text) {
  const parts = text.split("**");
  return parts.map((p, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="text-amber-200">
        {p}
      </strong>
    ) : (
      <span key={i}>{p}</span>
    )
  );
}
