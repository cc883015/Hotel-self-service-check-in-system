/** Minimal markdown: **bold**, [text](url), newlines. */

export function renderSimpleMarkdown(text) {
  if (!text) return null;
  const lines = String(text).split("\n");
  return lines.map((line, li) => {
    const parts = [];
    let rest = line;
    let key = 0;
    while (rest.length) {
      const link = rest.match(/\[([^\]]+)\]\(([^)]+)\)/);
      const bold = rest.match(/\*\*([^*]+)\*\*/);
      const pick =
        link && (!bold || link.index <= bold.index)
          ? { type: "link", m: link }
          : bold
            ? { type: "bold", m: bold }
            : null;

      if (!pick) {
        parts.push(<span key={key++}>{rest}</span>);
        break;
      }
      const idx = pick.m.index;
      if (idx > 0) parts.push(<span key={key++}>{rest.slice(0, idx)}</span>);
      if (pick.type === "link") {
        parts.push(
          <a
            key={key++}
            href={pick.m[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-700 underline underline-offset-2 break-all hover:text-amber-800"
          >
            {pick.m[1]}
          </a>
        );
        rest = rest.slice(idx + pick.m[0].length);
      } else {
        parts.push(
          <strong key={key++} className="text-stone-900 font-medium">
            {pick.m[1]}
          </strong>
        );
        rest = rest.slice(idx + pick.m[0].length);
      }
    }
    return (
      <span key={li} className="block">
        {parts.length ? parts : "\u00a0"}
      </span>
    );
  });
}

export function extractWifiPassword(text) {
  const m = String(text).match(/\*\*([^*]+)\*\*/);
  return m ? m[1] : null;
}
