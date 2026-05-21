type Props = {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: boolean;
  className?: string;
};

/**
 * Tiny stroke-based sparkline. Renders a smooth path over the given numeric
 * series. No deps, no axes, no labels — meant for inline use in dense cards.
 */
export function Sparkline({
  data,
  width = 120,
  height = 32,
  color = "var(--color-accent)",
  fill = true,
  className,
}: Props) {
  if (data.length < 2) return null;

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = Math.max(max - min, 1);
  const step = width / (data.length - 1);

  const points = data.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * height;
    return [x, y] as const;
  });

  // Smooth path via simple bezier between points
  let d = `M ${points[0][0]},${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i - 1];
    const [x2, y2] = points[i];
    const cx = (x1 + x2) / 2;
    d += ` C ${cx},${y1} ${cx},${y2} ${x2},${y2}`;
  }

  const fillPath = `${d} L ${width},${height} L 0,${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
    >
      {fill && (
        <path
          d={fillPath}
          fill={color}
          opacity={0.14}
        />
      )}
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
      <circle
        cx={points[points.length - 1][0]}
        cy={points[points.length - 1][1]}
        r={2}
        fill={color}
      />
    </svg>
  );
}
