import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api.js";

export default function AdminPage() {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [tab, setTab] = useState("guests");

  useEffect(() => {
    api.me()
      .then((r) => {
        if (!r.authenticated) navigate("/login", { replace: true });
        else setAuthChecked(true);
      })
      .catch(() => navigate("/login", { replace: true }));
  }, [navigate]);

  async function handleLogout() {
    try { await api.logout(); } catch {}
    navigate("/login", { replace: true });
  }

  if (!authChecked) {
    return (
      <div className="relative z-10 min-h-screen flex items-center justify-center text-ink-500 text-sm">
        Loading…
      </div>
    );
  }

  return (
    <div className="relative z-10 min-h-screen flex flex-col safe-top safe-bottom">
      <header className="border-b border-ink-800/80 px-5 py-4 md:px-10 md:py-5">
        <div className="flex items-center justify-between max-w-5xl mx-auto w-full">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full border border-amber-400/50 flex items-center justify-center">
              <span className="font-display text-amber-400 text-lg leading-none">C</span>
            </div>
            <div className="leading-tight">
              <div className="font-display text-amber-100 text-base md:text-lg">Cliff Inn</div>
              <div className="text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-ink-600">
                Admin console
              </div>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            className="text-xs uppercase tracking-[0.15em] text-ink-500 hover:text-amber-300 transition"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Tab bar */}
      <div className="border-b border-ink-800/80 px-5 md:px-10">
        <div className="max-w-5xl mx-auto flex gap-1">
          <TabButton active={tab === "guests"}   onClick={() => setTab("guests")}>Guests</TabButton>
          <TabButton active={tab === "settings"} onClick={() => setTab("settings")}>Settings</TabButton>
        </div>
      </div>

      <main className="flex-1 px-5 py-6 md:px-10 md:py-8">
        <div className="max-w-5xl mx-auto">
          {tab === "guests"   && <GuestsTab />}
          {tab === "settings" && <SettingsTab />}
        </div>
      </main>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 text-sm tracking-wide transition border-b-2 -mb-px ${
        active
          ? "border-amber-400 text-amber-200"
          : "border-transparent text-ink-500 hover:text-amber-300"
      }`}
    >
      {children}
    </button>
  );
}

// ==================================================================
// Guests tab
// ==================================================================
function GuestsTab() {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setErr("");
    try {
      const r = await api.listGuests();
      setGuests(r.guests || []);
    } catch (e) {
      setErr("Failed to load guests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(data) {
    await api.addGuest(data);
    await load();
  }

  async function handleDelete(id) {
    if (!confirm("Delete this guest? This cannot be undone.")) return;
    await api.deleteGuest(id);
    await load();
  }

  async function handleExport() {
    try {
      const res = await api.exportCSV();
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const today = new Date().toISOString().slice(0, 10);
      a.download = `cliff-inn-${today}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert("Export failed. Please try again.");
    }
  }

  return (
    <div className="space-y-6">
      <AddGuestForm onAdd={handleAdd} />

      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-amber-100">Guests</h2>
          <p className="text-xs text-ink-500 mt-1">
            Showing last 2 days · auto-deleted after 2 days
          </p>
        </div>
        <button onClick={handleExport} className="btn-ghost text-sm">
          Export 7-day CSV
        </button>
      </div>

      {err && (
        <div className="text-sm text-red-300/90 bg-red-900/20 border border-red-800/40 rounded-lg px-4 py-3">
          {err}
        </div>
      )}

      {loading ? (
        <div className="text-ink-500 text-sm py-8 text-center">Loading…</div>
      ) : guests.length === 0 ? (
        <div className="card p-8 text-center text-ink-500 text-sm">
          No guests yet. Add one above.
        </div>
      ) : (
        <GuestList guests={guests} onDelete={handleDelete} />
      )}
    </div>
  );
}

function AddGuestForm({ onAdd }) {
  const [name, setName] = useState("");
  const [room, setRoom] = useState("");
  const [safeCode, setSafeCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true); setErr(""); setOk(false);
    try {
      await onAdd({
        name: name.trim(),
        room_number: room.trim(),
        safe_code: safeCode.trim() || undefined,
      });
      setName(""); setRoom(""); setSafeCode("");
      setOk(true);
      setTimeout(() => setOk(false), 2000);
    } catch (e) {
      if (e.body?.error === "invalid_safe_code") setErr("Safe code must be 3–8 digits.");
      else setErr("Couldn't add guest. Please check the fields.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card p-5 md:p-6">
      <div className="text-xs uppercase tracking-[0.2em] text-amber-400/80 mb-4">
        Add guest
      </div>
      <div className="grid md:grid-cols-[1.4fr_0.7fr_0.7fr_auto] gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Guest name"
          className="input"
          autoCapitalize="words"
          autoCorrect="off"
          required
        />
        <input
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          placeholder="Room (e.g. A01)"
          className="input"
          autoCapitalize="characters"
          autoCorrect="off"
          required
        />
        <input
          value={safeCode}
          onChange={(e) => setSafeCode(e.target.value)}
          placeholder="Safe code (optional)"
          className="input"
          inputMode="numeric"
          pattern="\d{3,8}"
        />
        <button type="submit" disabled={submitting || !name.trim() || !room.trim()} className="btn-primary">
          {submitting ? "Adding…" : ok ? "Added ✓" : "Add"}
        </button>
      </div>
      {err && (
        <div className="mt-3 text-sm text-red-300/90">{err}</div>
      )}
      <div className="mt-3 text-xs text-ink-500">
        Leave safe code empty to use the default from Settings.
      </div>
    </form>
  );
}

function GuestList({ guests, onDelete }) {
  return (
    <div className="space-y-2">
      {guests.map((g) => <GuestRow key={g.id} guest={g} onDelete={onDelete} />)}
    </div>
  );
}

function GuestRow({ guest, onDelete }) {
  const scanned = guest.scan_count > 0;
  return (
    <div className="card p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-3 md:gap-5">
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-3 flex-wrap">
          <div className="font-display text-lg text-amber-50 truncate">{guest.name}</div>
          <div className="text-xs text-ink-500 uppercase tracking-wider">
            Room <span className="text-amber-300 font-mono">{guest.room_number}</span>
          </div>
          {guest.safe_code && (
            <div className="text-xs text-ink-500 uppercase tracking-wider">
              Safe <span className="text-amber-300 font-mono">{guest.safe_code}</span>
            </div>
          )}
        </div>
        <div className="mt-1.5 text-xs text-ink-500">
          Added {relativeTime(guest.created_at)}
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        <div className={`text-xs flex items-center gap-2 ${scanned ? "text-amber-300" : "text-ink-500"}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${scanned ? "bg-amber-400" : "bg-ink-600"}`} />
          {scanned
            ? <>Scanned {guest.scan_count}× · last {relativeTime(guest.last_scan_at)}</>
            : <>Not scanned yet</>}
        </div>
        <button onClick={() => onDelete(guest.id)} className="btn-danger text-xs">
          Delete
        </button>
      </div>
    </div>
  );
}

function relativeTime(tsSec) {
  if (!tsSec) return "—";
  const diff = Math.floor(Date.now() / 1000) - tsSec;
  if (diff < 60)  return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ==================================================================
// Settings tab
// ==================================================================
function SettingsTab() {
  return (
    <div className="space-y-8 max-w-xl">
      <DefaultSafeCodeCard />
      <ChangePasswordCard />
    </div>
  );
}

function DefaultSafeCodeCard() {
  const [value, setValue] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    api.getSettings()
      .then((s) => { setValue(s.default_safe_code || ""); setLoaded(true); })
      .catch(() => setErr("Failed to load settings."));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    if (saving) return;
    setSaving(true); setErr(""); setMsg("");
    try {
      await api.updateSettings({ default_safe_code: value.trim() });
      setMsg("Saved.");
      setTimeout(() => setMsg(""), 2500);
    } catch (e) {
      setErr(e.body?.error === "invalid_safe_code"
        ? "Must be 3–8 digits."
        : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="card p-5 md:p-6">
      <div className="text-xs uppercase tracking-[0.2em] text-amber-400/80 mb-2">
        Default safe code
      </div>
      <p className="text-xs text-ink-500 mb-4">
        Used when you add a guest without a custom safe code.
      </p>
      <div className="flex gap-3">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          inputMode="numeric"
          pattern="\d{3,8}"
          className="input flex-1 font-mono text-lg"
          disabled={!loaded || saving}
          placeholder="e.g. 5288"
        />
        <button type="submit" disabled={!loaded || saving} className="btn-primary">
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
      {msg && <div className="mt-3 text-sm text-amber-300">{msg}</div>}
      {err && <div className="mt-3 text-sm text-red-300/90">{err}</div>}
    </form>
  );
}

function ChangePasswordCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (saving) return;
    setErr(""); setMsg("");
    if (next.length < 8) { setErr("New password must be at least 8 characters."); return; }
    if (next !== confirm) { setErr("Passwords do not match."); return; }

    setSaving(true);
    try {
      await api.changePassword(current, next);
      setMsg("Password changed.");
      setCurrent(""); setNext(""); setConfirm("");
      setTimeout(() => setMsg(""), 3000);
    } catch (e) {
      if (e.body?.error === "wrong_current_password") setErr("Current password is incorrect.");
      else if (e.body?.error === "password_too_short") setErr("New password must be at least 8 characters.");
      else setErr("Could not change password.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card p-5 md:p-6 space-y-4">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-amber-400/80 mb-2">
          Change admin password
        </div>
        <p className="text-xs text-ink-500">
          At least 8 characters. Sign in again after changing.
        </p>
      </div>

      <input
        type="password"
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
        placeholder="Current password"
        autoComplete="current-password"
        className="input"
        required
      />
      <input
        type="password"
        value={next}
        onChange={(e) => setNext(e.target.value)}
        placeholder="New password"
        autoComplete="new-password"
        className="input"
        required
      />
      <input
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="Confirm new password"
        autoComplete="new-password"
        className="input"
        required
      />

      {msg && <div className="text-sm text-amber-300">{msg}</div>}
      {err && <div className="text-sm text-red-300/90">{err}</div>}

      <button type="submit" disabled={saving || !current || !next} className="btn-primary">
        {saving ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
