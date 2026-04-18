import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";

export default function GuestPage() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || loading) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const r = await api.lookup(name);
      if (!r.matched) {
        setError("Sorry, we couldn't find your booking. Please check the spelling and try again.");
      } else {
        setResult(r);
      }
    } catch (err) {
      if (err.status === 429) setError("Too many attempts. Please wait a minute and try again.");
      else setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setName(""); setResult(null); setError("");
  }

  return (
    <div className="relative z-10 min-h-screen flex flex-col safe-top safe-bottom">
      <header className="flex items-center justify-between px-5 py-4 md:px-10 md:py-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full border border-amber-400/50 flex items-center justify-center">
            <span className="font-display text-amber-400 text-lg leading-none">C</span>
          </div>
          <div className="leading-tight">
            <div className="font-display text-amber-100 text-base md:text-lg">Cliff Inn</div>
            <div className="text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-ink-600">
              Cliff House Motel
            </div>
          </div>
        </div>
        <Link
          to="/login"
          className="text-xs uppercase tracking-[0.15em] text-ink-600 hover:text-amber-300 transition"
        >
          Staff
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-5 py-6 md:px-6 md:py-8">
        <div className="w-full max-w-lg">
          {!result ? (
            <div className="animate-fade-up">
              <div className="mb-8 md:mb-10 text-center">
                <div className="inline-block text-[10px] md:text-[11px] uppercase tracking-[0.3em] text-amber-400/80 mb-4">
                  Late Check-in · 24/7
                </div>
                <h1 className="font-display text-[2rem] leading-[1.1] md:text-5xl text-amber-50">
                  Welcome home,<br />
                  <span className="italic text-amber-300">weary traveller.</span>
                </h1>
                <p className="mt-4 md:mt-5 text-ink-500 text-sm md:text-base max-w-sm mx-auto px-4">
                  Enter the name on your booking and we'll guide you to your room.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="card p-5 md:p-8 shadow-2xl shadow-black/40">
                <label className="block text-xs uppercase tracking-[0.2em] text-amber-400/80 mb-3">
                  Your booking name
                </label>
                <input
                  autoFocus
                  autoComplete="name"
                  autoCapitalize="words"
                  autoCorrect="off"
                  spellCheck="false"
                  inputMode="text"
                  enterKeyHint="go"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Smith"
                  className="input text-lg"
                  disabled={loading}
                />

                {error && (
                  <div className="mt-4 text-sm text-amber-200/90 bg-amber-900/20 border border-amber-800/40 rounded-lg px-4 py-3">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="btn-primary w-full mt-5"
                >
                  {loading ? "Looking up…" : "Find my room →"}
                </button>
              </form>

              <div className="mt-6 md:mt-8 text-center text-xs text-ink-600 px-4">
                Can't find your booking? Call reception.
              </div>
            </div>
          ) : (
            <WelcomeMessage result={result} onReset={reset} />
          )}
        </div>
      </main>

      <footer className="px-5 py-4 text-center text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-ink-700">
        532 Main Street · Kangaroo Point
      </footer>
    </div>
  );
}

function WelcomeMessage({ result, onReset }) {
  return (
    <div className="animate-fade-up card p-6 md:p-10 shadow-2xl shadow-black/40 relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative">
        <div className="text-[10px] md:text-[11px] uppercase tracking-[0.3em] text-amber-400 mb-3 md:mb-4">
          You're all set
        </div>
        <h2 className="font-display text-2xl md:text-4xl text-amber-50 leading-tight break-words">
          Hi <span className="italic text-amber-300">{result.guest_name}</span>,
        </h2>
        <p className="mt-3 md:mt-4 text-amber-100/80 leading-relaxed text-sm md:text-base">
          Thanks a lot for your booking. For your late check-in at Cliff Inn (Cliff House Motel), please follow these steps:
        </p>

        <ol className="mt-6 md:mt-7 space-y-4 md:space-y-5">
          <Step n={1} title="Find the safe box">
            On the <span className="text-amber-300">left of the reception</span>.
          </Step>
          <Step n={2} title="Enter this code">
            <CodeBlock>{result.safe_code}#</CodeBlock>
          </Step>
          <Step n={3} title="Collect your key">
            Key <CodeBlock compact>{result.room_number}</CodeBlock>
          </Step>
          <Step n={4} title="Close the safe">
            Turn the dial. That's it.
          </Step>
        </ol>

        <div className="divider my-6 md:my-8" />

        <div className="text-center">
          <p className="font-display text-lg md:text-xl text-amber-200 italic">Sleep well.</p>
          <p className="mt-2 text-xs md:text-sm text-ink-500">
            532 Main Street, Kangaroo Point<br />
            <span className="text-amber-300/80">— Johnson</span>
          </p>
        </div>

        <button onClick={onReset} className="btn-ghost w-full mt-6 md:mt-8 text-sm">
          Not you? Try another name
        </button>
      </div>
    </div>
  );
}

function Step({ n, title, children }) {
  return (
    <li className="flex gap-3 md:gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full border border-amber-500/40 flex items-center justify-center">
        <span className="font-display text-sm text-amber-300">{n}</span>
      </div>
      <div className="flex-1 pt-0.5 min-w-0">
        <div className="text-[11px] md:text-xs uppercase tracking-wider text-amber-400/70 mb-1">
          {title}
        </div>
        <div className="text-amber-50 text-sm md:text-base break-words">{children}</div>
      </div>
    </li>
  );
}

function CodeBlock({ children, compact }) {
  return (
    <span
      className={`font-mono font-medium bg-amber-400/10 border border-amber-400/30 text-amber-200 rounded-md
                  ${compact ? "px-2 py-0.5 text-base" : "px-3 py-1 text-lg md:text-xl"}`}
    >
      {children}
    </span>
  );
}
