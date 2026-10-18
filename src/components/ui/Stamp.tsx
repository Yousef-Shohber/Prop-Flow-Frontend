import { useId } from "react";

const NAVY = "#1d2b5f";

/** Round seal carrying the site name. Pure SVG so it prints sharply and ignores dark mode. */
export function Stamp({ date, status }: { date: string; status: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      viewBox="0 0 200 200"
      width="132"
      height="132"
      role="img"
      aria-label="PropFlow"
      style={{ transform: "rotate(-9deg)" }}
    >
      <defs>
        <path
          id={`ring-${id}`}
          d="M100,100 m-70,0 a70,70 0 1,1 140,0 a70,70 0 1,1 -140,0"
        />
      </defs>
      <circle
        cx="100"
        cy="100"
        r="94"
        fill="none"
        stroke={NAVY}
        strokeWidth="4"
      />
      <circle
        cx="100"
        cy="100"
        r="87"
        fill="none"
        stroke={NAVY}
        strokeWidth="1.2"
      />
      <circle
        cx="100"
        cy="100"
        r="52"
        fill="none"
        stroke={NAVY}
        strokeWidth="1.2"
      />
      <text
        fontSize="14.5"
        fontWeight="700"
        letterSpacing="3.2"
        fill={NAVY}
        fontFamily="Arial, Helvetica, sans-serif"
      >
        <textPath href={`#ring-${id}`} startOffset="0">
          PROPFLOW • PROPERTY MANAGEMENT •
        </textPath>
      </text>
      <path
        d="M100 68 123 87v26a4 4 0 0 1-4 4H81a4 4 0 0 1-4-4V87Z"
        fill="none"
        stroke={NAVY}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <text
        x="100"
        y="140"
        textAnchor="middle"
        fontSize="19"
        fontWeight="800"
        fill={NAVY}
        fontFamily="Arial, Helvetica, sans-serif"
        letterSpacing="1"
      >
        PropFlow
      </text>
      <text
        x="100"
        y="157"
        textAnchor="middle"
        fontSize="10"
        fontWeight="700"
        fill={NAVY}
        fontFamily="Arial, Helvetica, sans-serif"
        letterSpacing="2"
      >
        {status}
      </text>
      <text
        x="100"
        y="169"
        textAnchor="middle"
        fontSize="9"
        fill={NAVY}
        fontFamily="Arial, Helvetica, sans-serif"
      >
        {date}
      </text>
    </svg>
  );
}
