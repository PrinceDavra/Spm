"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
  Legend,
} from "recharts";

interface WorkloadBarChartProps {
  data: Array<{
    facultyName: string;
    assignedWeeklyPeriods: number;
    scheduledWeeklyPeriods: number;
    theoryPeriods: number;
    labPeriods: number;
  }>;
  height?: number;
}

export function WorkloadBarChart({
  data,
  height = 260,
}: WorkloadBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl"
        style={{ height }}
      >
        No faculty workload telemetry available.
      </div>
    );
  }

  // Shorten names for X-axis
  const chartData = data.map((d) => {
    const parts = d.facultyName.split(" ");
    const shortName = parts.length > 1 ? `${parts[0][0]}. ${parts[parts.length - 1]}` : d.facultyName;
    return {
      ...d,
      shortName,
    };
  });

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 20, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
          <XAxis
            dataKey="shortName"
            tickLine={false}
            tick={{ fontSize: 11, fill: "#64748b" }}
          />
          <YAxis
            domain={[0, 24]}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#64748b" }}
            unit="h"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(15, 23, 42, 0.9)",
              borderRadius: "12px",
              border: "none",
              color: "#fff",
              fontSize: "12px",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
            }}
            formatter={(val: unknown, name: unknown) => [`${val} hrs/wk`, String(name)]}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            formatter={(value) => (
              <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                {value}
              </span>
            )}
          />
          <ReferenceLine
            y={20}
            stroke="#ef4444"
            strokeDasharray="4 4"
            label={{
              value: "Max Teaching Cap (20h)",
              fill: "#ef4444",
              fontSize: 10,
              position: "top",
            }}
          />
          <Bar
            name="Assigned Weekly Periods"
            dataKey="assignedWeeklyPeriods"
            fill="#8b5cf6"
            radius={[6, 6, 0, 0]}
          />
          <Bar
            name="Scheduled Weekly Periods"
            dataKey="scheduledWeeklyPeriods"
            fill="#10b981"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
