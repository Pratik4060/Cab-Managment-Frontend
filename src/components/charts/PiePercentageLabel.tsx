export const chartColors = ["#2388d9", "#10b981", "#f59e0b", "#ef4444", "#14b8a6", "#f97316", "#a7d8de", "#64748b"];

const RADIAN = Math.PI / 180;

type PieLabelProps = {
  cx?: number;
  cy?: number;
  midAngle?: number;
  outerRadius?: number;
  percent?: number;
  index?: number;
};

export function renderPiePercentageLabel({ cx = 0, cy = 0, midAngle = 0, outerRadius = 0, percent = 0, index = 0 }: PieLabelProps) {
  if (!percent || percent < 0.01) return null;

  const radius = outerRadius + 28;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  const color = chartColors[index % chartColors.length];

  return (
    <text
      x={x}
      y={y}
      fill={color}
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      className="text-sm font-semibold"
    >
      {`${Math.round(percent * 100)}%`}
    </text>
  );
}

export function renderPieLabelLine({ cx = 0, cy = 0, midAngle = 0, outerRadius = 0, index = 0 }: PieLabelProps) {
  const color = chartColors[index % chartColors.length];
  const startRadius = outerRadius + 2;
  const middleRadius = outerRadius + 14;
  const endRadius = outerRadius + 24;
  const sx = cx + startRadius * Math.cos(-midAngle * RADIAN);
  const sy = cy + startRadius * Math.sin(-midAngle * RADIAN);
  const mx = cx + middleRadius * Math.cos(-midAngle * RADIAN);
  const my = cy + middleRadius * Math.sin(-midAngle * RADIAN);
  const ex = cx + endRadius * Math.cos(-midAngle * RADIAN);
  const ey = cy + endRadius * Math.sin(-midAngle * RADIAN);

  return <polyline points={`${sx},${sy} ${mx},${my} ${ex},${ey}`} stroke={color} strokeWidth={1.4} fill="none" />;
}
