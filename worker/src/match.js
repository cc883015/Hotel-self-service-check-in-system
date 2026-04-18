// Fuzzy name matching.
//
// Rules:
//   1. Strip all whitespace + punctuation, lowercase both strings.
//   2. If exact match after normalization → instant hit.
//   3. Else allow ≤2 character edit distance (Levenshtein).
//   4. Else allow similarity ≥ 0.80 (1 - dist/maxLen).
//
// Short names (≤4 chars) only allow ≤1 edit to avoid "Amy" → "Bob" false hits.

export function normalize(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")   // strip accents
    .replace(/[^a-z0-9]/g, "");        // drop spaces, punctuation, everything non-alphanumeric
}

// Classic Levenshtein — iterative, O(m*n) time, O(min(m,n)) space.
export function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  if (a.length > b.length) [a, b] = [b, a];

  let prev = new Array(a.length + 1);
  let curr = new Array(a.length + 1);
  for (let i = 0; i <= a.length; i++) prev[i] = i;

  for (let j = 1; j <= b.length; j++) {
    curr[0] = j;
    for (let i = 1; i <= a.length; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[i] = Math.min(
        curr[i - 1] + 1,     // insertion
        prev[i] + 1,         // deletion
        prev[i - 1] + cost   // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[a.length];
}

// Best match from candidates list, or null.
// candidates: [{ id, name, name_normalized, ... }, ...]
export function findBestMatch(query, candidates) {
  const q = normalize(query);
  if (!q) return null;

  // Exact normalized match wins.
  const exact = candidates.find((c) => c.name_normalized === q);
  if (exact) return { guest: exact, score: 1, distance: 0 };

  let best = null;
  for (const c of candidates) {
    const n = c.name_normalized;
    const dist = levenshtein(q, n);
    const maxLen = Math.max(q.length, n.length);
    const similarity = maxLen === 0 ? 0 : 1 - dist / maxLen;

    // Short-name guard: if either string is ≤4 chars, require dist ≤ 1.
    const limit = Math.min(q.length, n.length) <= 4 ? 1 : 2;
    if (dist > limit && similarity < 0.80) continue;

    if (!best || dist < best.distance) {
      best = { guest: c, score: similarity, distance: dist };
    }
  }
  return best;
}
