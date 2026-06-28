import { useState } from "react";
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
    <>
      <main className="flex-1 flex items-start md:items-center justify-center px-4 py-5 md:px-6 md:py-8">
        <div className="w-full max-w-xl">
          {!result ? (
            <div className="animate-fade-up glass-panel p-6 md:p-10">
              <div className="text-center mb-6 md:mb-8">
                <div className="inline-block text-label-lg mb-3">Late Check-in · 24/7</div>
                <h1 className="font-display text-3xl md:text-[2.75rem] leading-[1.08] text-stone-800">
                  Welcome home,
                  <span className="italic text-amber-700"> weary traveller</span>
                </h1>
              </div>

              {/* Booking name first — visible immediately after QR scan */}
              <form onSubmit={handleSubmit} className="glass-panel-inner p-5 md:p-7 mb-6 md:mb-7">
                <label htmlFor="booking-name" className="block text-label-lg mb-3 md:mb-4">
                  Enter your booking name
                </label>
                <p className="text-base md:text-lg text-stone-600 mb-4 md:mb-5 leading-snug">
                  Type the <strong className="text-stone-800">exact name on your reservation</strong> — as shown on Booking.com, Expedia, Trip.com, or your booking confirmation.
                </p>
                <input
                  id="booking-name"
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
                  className="input-hero"
                  disabled={loading}
                />

                {error && (
                  <div className="mt-4 alert-warn text-base">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="btn-primary-lg w-full mt-5 md:mt-6"
                >
                  {loading ? "Looking up…" : "Find my room →"}
                </button>
              </form>

              <div className="glass-panel-inner p-4 md:p-5 text-left">
                <p className="text-base md:text-lg font-semibold text-stone-800 leading-snug">
                  Booked on a platform?
                </p>
                <p className="mt-2 text-base md:text-lg text-stone-700 leading-relaxed">
                  Match your order&apos;s{" "}
                  <span className="font-bold text-amber-900">First name</span> and{" "}
                  <span className="font-bold text-amber-900">Last name</span> exactly.
                  If it doesn&apos;t work, try swapping first and last name.
                </p>
              </div>

              <p className="mt-6 md:mt-7 text-center text-sm md:text-base text-stone-500 px-2">
                Can&apos;t find your booking? Visit reception at the front desk.
              </p>
            </div>
          ) : (
            <WelcomeMessage result={result} onReset={reset} />
          )}
        </div>
      </main>

      <footer className="px-5 py-4 text-center text-[10px] md:text-xs uppercase tracking-[0.2em] text-stone-500/90">
        532 Main Street · Kangaroo Point
      </footer>
    </>
  );
}

function WelcomeMessage({ result, onReset }) {
  return (
    <div className="animate-fade-up glass-panel p-6 md:p-10 relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-300/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative">
        <div className="text-label-lg mb-3 md:mb-4">You&apos;re all set</div>
        <h2 className="font-display text-3xl md:text-4xl text-stone-800 leading-tight break-words">
          Hi <span className="italic text-amber-700">{result.guest_name}</span>,
        </h2>
        <p className="mt-3 md:mt-4 text-stone-600 leading-relaxed text-base md:text-lg">
          Thanks for your booking. For your late check-in at Cliff Inn (Cliff House Motel), follow these steps:
        </p>

        <ol className="mt-6 md:mt-8 space-y-4 md:space-y-5">
          <Step n={1} title="Find the safe box">
            On the <span className="text-amber-700 font-semibold">left of the reception</span>.
          </Step>
          <Step n={2} title="Enter this code">
            <CodeBlock>{result.safe_code}#</CodeBlock>
          </Step>
          <Step n={3} title="Collect your key">
            Key <CodeBlock compact>{result.room_number}</CodeBlock>
          </Step>
          <Step n={4} title="Close the safe">
            Turn the dial. That&apos;s it.
          </Step>
        </ol>

        <div className="divider my-6 md:my-8" />

        <div className="text-center">
          <p className="font-display text-xl md:text-2xl text-amber-800 italic">Sleep well.</p>
          <p className="mt-2 text-sm md:text-base text-stone-500">
            532 Main Street, Kangaroo Point
            <br />
            <span className="text-amber-700/80">— Johnson</span>
          </p>
        </div>

        <button onClick={onReset} className="btn-ghost w-full mt-6 md:mt-8 text-base">
          Not you? Try another name
        </button>
      </div>
    </div>
  );
}

function Step({ n, title, children }) {
  return (
    <li className="flex gap-3 md:gap-4 glass-panel-inner p-3 md:p-4">
      <div className="flex-shrink-0 w-9 h-9 md:w-10 md:h-10 rounded-full border border-amber-400/50 bg-white/50 flex items-center justify-center shadow-sm">
        <span className="font-display text-base text-amber-700">{n}</span>
      </div>
      <div className="flex-1 pt-0.5 min-w-0">
        <div className="text-xs md:text-sm uppercase tracking-wider text-amber-700/90 mb-1 font-semibold">
          {title}
        </div>
        <div className="text-stone-700 text-base md:text-lg break-words">{children}</div>
      </div>
    </li>
  );
}

function CodeBlock({ children, compact }) {
  return (
    <span
      className={`font-mono font-semibold bg-white/60 border border-amber-300/50 text-amber-900 rounded-xl
                  ${compact ? "px-2.5 py-1 text-lg" : "px-4 py-1.5 text-xl md:text-2xl"}`}
    >
      {children}
    </span>
  );
}
