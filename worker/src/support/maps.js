/** Google Maps deep-links from D1 place data — never let the LLM invent URLs. */

export function mapsSearchUrl(name, address, placeId) {
  const q = encodeURIComponent(`${name}, ${address}`);
  const base = `https://www.google.com/maps/search/?api=1&query=${q}`;
  return placeId ? `${base}&query_place_id=${encodeURIComponent(placeId)}` : base;
}

export function mapsDirectionsUrl(name, address, placeId) {
  const dest = encodeURIComponent(`${name}, ${address}`);
  const base = `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
  return placeId ? `${base}&destination_place_id=${encodeURIComponent(placeId)}` : base;
}

export function mapsSearchQueryUrl(query) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** @param {{ name: string, address: string, place_id: string, note?: string | null }[]} places */
export function formatPlacesBlock(places, locale) {
  if (!places?.length) return "";
  const mapLabel = locale === "zh" ? "地图" : "Map";
  const dirLabel = locale === "zh" ? "导航" : "Directions";
  const lines = places.map((p) => {
    const note = p.note ? ` (${p.note})` : "";
    const search = mapsSearchUrl(p.name, p.address, p.place_id);
    const dir = mapsDirectionsUrl(p.name, p.address, p.place_id);
    return `- **${p.name}** — ${p.address}${note}\n  [📍 ${mapLabel}](${search}) · [🧭 ${dirLabel}](${dir})`;
  });
  return "\n\n" + lines.join("\n");
}
