import { useCallback, useEffect, useRef, useState } from "react";
import { t, LOCALE } from "../lib/i18n.js";
import { fetchQuickQuestions, chatStream } from "../lib/supportApi.js";
import { QUICK_FAQ_FALLBACK } from "../lib/quickFaqFallback.js";
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
  const [questions, setQuestions] = useState([]);
  const [loadingQ, setLoadingQ] = useState(true);
  const [faqFromFallback, setFaqFromFallback] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [sessionId] = useState(getSessionId);
  const bottomRef = useRef(null);
  const abortRef = useRef(null);

  const scrollBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const loadQuestions = useCallback(() => {
    setLoadingQ(true);
    setFaqFromFallback(false);
    return fetchQuickQuestions(LOCALE)
      .then((data) => {
        const qs = data.questions?.length ? data.questions : QUICK_FAQ_FALLBACK;
        setQuestions(qs);
        setFaqFromFallback(!data.questions?.length);
      })
      .catch(() => {
        setQuestions(QUICK_FAQ_FALLBACK);
        setFaqFromFallback(true);
      })
      .finally(() => setLoadingQ(false));
  }, []);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

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
      locale: LOCALE,
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
                content: acc || `${t("aiUnavailable")} ${t("tryQuick")}`,
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
        const friendly =
          !msg || /^HTTP \d+/i.test(msg)
            ? `${t("aiUnavailable")} ${t("tryQuick")}`
            : msg;
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.role === "assistant") {
            next[next.length - 1] = {
              role: "assistant",
              content: friendly,
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
    <main className="flex-1 flex flex-col px-4 md:px-8 py-4 max-w-2xl mx-auto w-full min-h-0 gap-4">
      <section className="glass-input-bar sticky top-0 z-30 p-4 md:p-5 shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md">
            <span className="text-white text-sm">✦</span>
          </div>
          <div>
            <div className="font-display text-stone-800 text-base">{t("moduleName")}</div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-stone-500">Cliff Inn · AI Assistant</div>
          </div>
        </div>
        <form onSubmit={handleSend}>
          <label htmlFor="support-input" className="sr-only">
            {t("placeholder")}
          </label>
          <div className="flex gap-2">
            <input
              id="support-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("placeholder")}
              className="input flex-1 text-base shadow-sm"
              disabled={streaming}
              autoComplete="off"
              enterKeyHint="send"
            />
            <button type="submit" disabled={streaming || !input.trim()} className="btn-primary px-5 min-w-[88px] shrink-0">
              {t("send")}
            </button>
          </div>
          <p className="mt-2.5 text-xs text-stone-500 text-center">{t("footerHint")}</p>
        </form>
      </section>

      <div className="glass-strong flex-1 flex flex-col p-4 md:p-5 min-h-[360px]">
        {showWelcome && (
          <p className="text-sm text-stone-600 mb-4 leading-relaxed">{renderWelcome(t("welcome"))}</p>
        )}

        <h2 className="text-label-lg mb-3">{t("commonQuestions")}</h2>
        <QuickQuestions
          questions={questions}
          loading={loadingQ}
          onSelect={handleQuickSelect}
        />
        {faqFromFallback && !loadingQ && (
          <p className="text-xs text-stone-500 mb-3 -mt-2">
            Showing saved answers — tap a question below.{" "}
            <button type="button" onClick={loadQuestions} className="underline text-amber-800 font-semibold">
              Retry sync
            </button>
          </p>
        )}

        <div
          className="flex-1 overflow-y-auto min-h-[140px] max-h-[42vh] md:max-h-[48vh] pr-1 -mr-1 mt-1"
          aria-live="polite"
          aria-label="Chat messages"
        >
          {messages.length === 0 && !showWelcome && (
            <p className="text-sm text-stone-400 text-center py-6">—</p>
          )}
          {messages.map((m, i) => (
            <MessageBubble
              key={i}
              role={m.role}
              content={m.content || (streaming && i === messages.length - 1 ? t("thinking") : "")}
              actions={m.actions}
            />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      <HouseRulesPanel />

      <p className="mb-6 text-[10px] leading-relaxed text-stone-400 text-center px-2">
        {t("disclaimer")}
      </p>
    </main>
  );
}

function renderWelcome(text) {
  const parts = text.split("**");
  return parts.map((p, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="text-amber-800 font-medium">
        {p}
      </strong>
    ) : (
      <span key={i}>{p}</span>
    )
  );
}
