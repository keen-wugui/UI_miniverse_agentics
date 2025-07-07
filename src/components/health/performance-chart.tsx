"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface PerformanceChartProps {
  data: {
    timestamp: string;
    value: number;
  }[];
  title: string;
  dataKey: string;
  unit: string;
}

export function PerformanceChart({
  data,
  title,
  dataKey,
  unit,
}: PerformanceChartProps) {
  if (!data || data.length === 0) {
    return (
      <div>
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="flex items-center justify-center h-[300px] bg-gray-50 rounded-md">
          <p className="text-muted-foreground">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={(time: string) =>
              new Date(time).toLocaleTimeString()
            }
          />
          <YAxis unit={unit} />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke="#8884d8"
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
