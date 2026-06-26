// RadarScores.jsx
// ---------------
// A futuristic neon radar (spider) chart of the four ATS sub-scores.

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

export default function RadarScores({ report }) {
  const data = [
    { metric: "Skills", value: report.skills_match },
    { metric: "Experience", value: report.experience_relevance },
    { metric: "Keywords", value: report.keyword_coverage },
    { metric: "Format", value: report.format_readability },
    { metric: "Semantic", value: report.semantic_match_score },
  ];

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="rgba(255,255,255,0.12)" />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fill: "#cbd5e1", fontSize: 12 }}
          />
          <PolarRadiusAxis
            domain={[0, 100]}
            tick={{ fill: "#64748b", fontSize: 10 }}
            axisLine={false}
          />
          <Radar
            dataKey="value"
            stroke="#a78bfa"
            strokeWidth={2}
            fill="#7c3aed"
            fillOpacity={0.45}
            isAnimationActive
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
