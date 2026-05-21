function toRad(deg) { return (deg - 90) * Math.PI / 180; }

function arcPath(cx, cy, r, start, end) {
  if (end - start >= 359.99) {
    return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`;
  }
  const s = { x: cx + r * Math.cos(toRad(start)), y: cy + r * Math.sin(toRad(start)) };
  const e = { x: cx + r * Math.cos(toRad(end)),   y: cy + r * Math.sin(toRad(end)) };
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${end - start > 180 ? 1 : 0} 1 ${e.x} ${e.y}`;
}

export function DonutChart({ data, size = 176 }) {
  const cx = size / 2, cy = size / 2, r = 62, sw = 22;
  const total = data.reduce((s, d) => s + d.value, 0);
  const nonZero = data.filter((d) => d.value > 0);

  let angle = 0;
  const segments = nonZero.map((d) => {
    const sweep = (d.value / total) * 360;
    const seg   = { ...d, start: angle, end: angle + sweep - 1.5 };
    angle += sweep;
    return seg;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#EEF2FF" strokeWidth={sw} />
          {total === 0 ? (
            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
                  fontSize={12} fill="#94A3B8">No data</text>
          ) : (
            segments.map((s) => (
              <path
                key={s.label}
                d={arcPath(cx, cy, r, s.start, s.end)}
                fill="none"
                stroke={s.color}
                strokeWidth={sw}
                strokeLinecap="round"
              />
            ))
          )}
        </svg>
        {total > 0 && (
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%,-50%)", textAlign: "center", pointerEvents: "none",
          }}>
            <div style={{
              fontSize: 26, fontWeight: 800, lineHeight: 1,
              fontFamily: "'Syne',sans-serif", color: "var(--text)",
            }}>{total}</div>
            <div style={{ fontSize: 10.5, color: "var(--text-3)", marginTop: 2, fontWeight: 600, letterSpacing: ".04em" }}>
              TOTAL
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
