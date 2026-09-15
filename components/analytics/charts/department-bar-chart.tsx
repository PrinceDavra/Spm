"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

interface DepartmentBarChartProps {
  data: Array<{
    departmentName: string;
    attendanceRate: number;
    assignmentSubmissionRate: number;
    placementApplications?: number;
  }>;
  height?: number;
}

export function DepartmentBarChart({
  data,
  height = 260,
}: DepartmentBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl"
        style={{ height }}
      >
        No department telemetry available.
      </div>
    );
  }

  // Shorten names for cleaner X-axis
  const chartData = data.map((d) => ({
    ...d,
    shortName:
      d.departmentName.includes("Computer")
        ? "Computer"
        : d.departmentName.includes("Information")
        ? "IT"
        : d.departmentName.includes("Telecom")
        ? "EXTC"
        : d.departmentName,
  }));

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
            domain={[0, 100]}
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
            formatter={(val: unknown, name: unknown) => [`${val}%`, String(name)]}
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
          <Bar
            name="Attendance Rate"
            dataKey="attendanceRate"
            fill="#4f46e5"
            radius={[6, 6, 0, 0]}
          />
          <Bar
            name="Assignment Submission"
            dataKey="assignmentSubmissionRate"
            fill="#06b6d4"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
