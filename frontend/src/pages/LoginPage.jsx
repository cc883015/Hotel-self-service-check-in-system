import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api.js";

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("cliffinnadmin");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      await api.login(username.trim(), password.trim());
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
        setError(
          "Incorrect username or password. Defaults: cliffinnadmin / cliffinnadmin123 " +
          "(if you changed the password in Settings, use the new one)."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative z-10 min-h-screen flex flex-col safe-top safe-bottom">
      <header className="glass-nav flex items-center justify-between px-5 py-4 md:px-10 md:py-5">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400/90 to-amber-600 flex items-center justify-center border border-white/80 shadow-sm">
            <span className="font-display text-white text-lg leading-none">C</span>
          </div>
          <div className="leading-tight">
            <div className="font-display text-stone-800 text-base md:text-lg group-hover:text-amber-700 transition">
              Cliff Inn
            </div>
            <div className="text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-stone-400">
              Staff area
            </div>
          </div>
        </Link>
        <Link to="/" className="text-xs uppercase tracking-[0.15em] text-stone-500 hover:text-amber-700 transition">
          ← Back
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-5 py-8">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="text-center mb-8">
            <div className="text-label mb-3">
              Restricted access
            </div>
            <h1 className="font-display text-3xl md:text-4xl text-stone-800 italic">
              Staff sign in
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="glass-strong p-6 md:p-8 space-y-4">
            <div>
              <label className="block text-label mb-2">
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
              <label className="block text-label mb-2">
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
              <div className="alert-error">
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

          <div className="mt-6 text-center text-[11px] uppercase tracking-[0.15em] text-stone-400">
            Authorised personnel only
          </div>
        </div>
      </main>
    </div>
  );
}
