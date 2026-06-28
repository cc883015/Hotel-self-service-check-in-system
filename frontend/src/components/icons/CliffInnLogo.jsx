/**
 * Original Cliff Inn mark — Queensland-inspired (maroon + gold + river)
 * without copying the official State Badge (no cross/crown/roundel).
 */
export default function CliffInnLogo({
  className = "w-11 h-11 md:w-12 md:h-12",
  title = "Cliff Inn — Kangaroo Point, Queensland",
}) {
  return (
    <svg
      className={`flex-shrink-0 drop-shadow-[0_4px_12px_rgba(122,0,25,0.28)] ${className}`}
      viewBox="0 0 64 64"
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="ci-sky" x1="32" y1="4" x2="32" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#B45309" />
          <stop offset="0.45" stopColor="#7A0019" />
          <stop offset="1" stopColor="#4A0010" />
        </linearGradient>
        <linearGradient id="ci-sun" x1="46" y1="10" x2="46" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FDE68A" />
          <stop offset="1" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id="ci-river" x1="32" y1="44" x2="32" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#67E8F9" stopOpacity="0.85" />
          <stop offset="1" stopColor="#0E7490" stopOpacity="0.9" />
        </linearGradient>
      </defs>

      {/* Badge circle */}
      <circle cx="32" cy="32" r="30" fill="url(#ci-sky)" stroke="rgba(255,255,255,0.92)" strokeWidth="2" />

      {/* Queensland sun */}
      <circle cx="46" cy="18" r="9" fill="url(#ci-sun)" opacity="0.95" />

      {/* Kangaroo Point–style cliff silhouette */}
      <path
        fill="#1C0A08"
        fillOpacity="0.72"
        d="M6 46 L14 30 L22 38 L30 22 L38 34 L48 26 L58 40 V58 H6 Z"
      />
      <path
        fill="#FFF7ED"
        fillOpacity="0.22"
        d="M30 22 L38 34 L48 26 L42 24 L34 28 Z"
      />

      {/* Brisbane River hint */}
      <path
        fill="url(#ci-river)"
        d="M4 48 C18 43 28 45 32 44 C38 43 48 46 60 48 C60 52 58 56 32 56 C10 56 6 52 4 48 Z"
      />

      {/* Small “C” monogram — brand, not a government emblem */}
      <text
        x="17"
        y="41"
        fill="#FFFBEB"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="15"
        fontWeight="700"
        opacity="0.95"
      >
        C
      </text>
    </svg>
  );
}
