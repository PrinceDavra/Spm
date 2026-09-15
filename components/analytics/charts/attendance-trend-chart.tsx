"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from "recharts";

interface AttendanceTrendChartProps {
  data: Array<{
    date: string;
    conducted: number;
    present: number;
    percentage: number;
  }>;
  height?: number;
}

export function AttendanceTrendChart({
  data,
  height = 260,
}: AttendanceTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl"
        style={{ height }}
      >
        No chronological attendance records available for selected filter window.
      </div>
    );
  }

  // Format date display
  const chartData = data.map((d) => ({
    ...d,
    formattedDate: d.date.length > 5 ? d.date.slice(5) : d.date,
  }));

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 20, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#e2e8f0"
            opacity={0.5}
          />
          <XAxis
            dataKey="formattedDate"
            tickLine={false}
            tick={{ fontSize: 11, fill: "#64748b" }}
          />
          <YAxis
            domain={[40, 100]}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#64748b" }}
            unit="%"
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
            formatter={(value: unknown) => {
              const num = typeof value === "number" ? value : Number(value);
              return [`${num}%`, "Attendance"];
            }}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <ReferenceLine
            y={75}
            stroke="#10b981"
            strokeDasharray="4 4"
            label={{
              value: "Safe Threshold (75%)",
              fill: "#10b981",
              fontSize: 10,
              position: "top",
            }}
          />
          <Area
            type="monotone"
            dataKey="percentage"
            stroke="#4f46e5"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#attendanceGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
