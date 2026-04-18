import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api.js";

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("cliffinnadmin");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // If already logged in, bounce to /admin.
  useEffect(() => {
    let cancelled = false;
    api.me()
      .then((r) => { if (!cancelled && r.authenticated) navigate("/admin", { replace: true }); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;
    setLoading(true); setError("");
    try {
      await api.login(username.trim(), password);
      navigate("/admin", { replace: true });
    } catch (err) {
      if (err.status === 429) {
        const sec = err.body?.retry_after || 900;
        setError(`Too many failed attempts. Try again in ${Math.ceil(sec / 60)} minute(s).`);
      } else if (err.status === 503 || err.body?.error === "server_misconfigured") {
        setError(
          "Server missing JWT secret. On your PC run: cd worker && npx wrangler secret put JWT_SECRET — then deploy again."
        );
      } else if (err.status >= 500) {
        setError(`Server error (${err.status}). Check Cloudflare Worker logs or JWT / database bindings.`);
      } else {
        setError("Incorrect username or password. Default username is cliffinnadmin (cliff + inn + admin).");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative z-10 min-h-screen flex flex-col safe-top safe-bottom">
      <header className="flex items-center justify-between px-5 py-4 md:px-10 md:py-5">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-full border border-amber-400/50 flex items-center justify-center">
            <span className="font-display text-amber-400 text-lg leading-none">C</span>
          </div>
          <div className="leading-tight">
            <div className="font-display text-amber-100 text-base md:text-lg group-hover:text-amber-300 transition">
              Cliff Inn
            </div>
            <div className="text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-ink-600">
              Staff area
            </div>
          </div>
        </Link>
        <Link to="/" className="text-xs uppercase tracking-[0.15em] text-ink-600 hover:text-amber-300 transition">
          ← Back
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-5 py-8">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="text-center mb-8">
            <div className="text-[10px] md:text-[11px] uppercase tracking-[0.3em] text-amber-400/80 mb-3">
              Restricted access
            </div>
            <h1 className="font-display text-3xl md:text-4xl text-amber-50 italic">
              Staff sign in
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="card p-6 md:p-8 shadow-2xl shadow-black/40 space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-[0.2em] text-amber-400/80 mb-2">
                Username
              </label>
              <input
                type="text"
                autoComplete="username"
                autoCapitalize="off"
                spellCheck="false"
                placeholder="cliffinnadmin"
                title="Default: cliffinnadmin (cliff + inn + admin)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-[0.2em] text-amber-400/80 mb-2">
                Password
              </label>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                disabled={loading}
                required
              />
            </div>

            {error && (
              <div className="text-sm text-red-300/90 bg-red-900/20 border border-red-800/40 rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password || !username.trim()}
              className="btn-primary w-full"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-6 text-center text-[11px] uppercase tracking-[0.15em] text-ink-700">
            Authorised personnel only
          </div>
        </div>
      </main>
    </div>
  );
}
