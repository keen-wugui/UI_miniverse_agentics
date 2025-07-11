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
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";

interface PerformanceDataPoint {
  timestamp: string;
  value: number;
  status?: 'good' | 'warning' | 'error';
  [key: string]: any;
}

interface PerformanceChartProps {
  data: PerformanceDataPoint[];
  title: string;
  dataKey: string;
  unit: string;
  type?: 'line' | 'area' | 'bar';
  showTimeRange?: boolean;
  showAnomalyDetection?: boolean;
  threshold?: {
    warning: number;
    error: number;
  };
}

type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d';

export function PerformanceChart({
  data,
  title,
  dataKey,
  unit,
  type = 'line',
  showTimeRange = true,
  showAnomalyDetection = true,
  threshold,
}: PerformanceChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>(type);

  // Generate sample data if no data provided (for demo purposes)
  const sampleData = data.length > 0 ? data : generateSampleData(timeRange);
  
  // Filter data based on time range
  const filteredData = filterDataByTimeRange(sampleData, timeRange);
  
  // Calculate statistics
  const stats = calculateStats(filteredData, dataKey);
  
  // Detect anomalies
  const anomalies = showAnomalyDetection ? detectAnomalies(filteredData, dataKey, threshold) : [];

  const renderChart = () => {
    const commonProps = {
      data: filteredData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    switch (chartType) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(time: string) =>
                new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
            />
            <YAxis unit={unit} />
            <Tooltip
              labelFormatter={(time: string) => new Date(time).toLocaleString()}
              formatter={(value: number) => [`${value}${unit}`, title]}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.3}
            />
          </AreaChart>
        );
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(time: string) =>
                new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
            />
            <YAxis unit={unit} />
            <Tooltip
              labelFormatter={(time: string) => new Date(time).toLocaleString()}
              formatter={(value: number) => [`${value}${unit}`, title]}
            />
            <Legend />
            <Bar dataKey={dataKey} fill="#8884d8" />
          </BarChart>
        );
      default:
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(time: string) =>
                new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
            />
            <YAxis unit={unit} />
            <Tooltip
              labelFormatter={(time: string) => new Date(time).toLocaleString()}
              formatter={(value: number) => [`${value}${unit}`, title]}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke="#8884d8"
              activeDot={{ r: 8 }}
              strokeWidth={2}
            />
            {/* Threshold lines */}
            {threshold && (
              <>
                <Line
                  type="monotone"
                  dataKey={() => threshold.warning}
                  stroke="#f59e0b"
                  strokeDasharray="5 5"
                  dot={false}
                  activeDot={false}
                />
                <Line
                  type="monotone"
                  dataKey={() => threshold.error}
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                  dot={false}
                  activeDot={false}
                />
              </>
            )}
          </LineChart>
        );
    }
  };

  if (!sampleData || sampleData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] bg-gray-50 rounded-md">
            <p className="text-muted-foreground">No data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <div className="flex items-center gap-2">
            {showTimeRange && (
              <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last Hour</SelectItem>
                  <SelectItem value="6h">Last 6 Hours</SelectItem>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            )}
            <Select value={chartType} onValueChange={(value) => setChartType(value as 'line' | 'area' | 'bar')}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">Line</SelectItem>
                <SelectItem value="area">Area</SelectItem>
                <SelectItem value="bar">Bar</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Statistics */}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Current:</span>
            <Badge variant={stats.current > (threshold?.error || Infinity) ? 'destructive' : 
                          stats.current > (threshold?.warning || Infinity) ? 'secondary' : 'default'}>
              {stats.current}{unit}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Avg:</span>
            <span className="text-sm">{stats.average}{unit}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Trend:</span>
            <div className="flex items-center gap-1">
              {stats.trend === 'up' ? (
                <TrendingUp className="h-4 w-4 text-red-500" />
              ) : stats.trend === 'down' ? (
                <TrendingDown className="h-4 w-4 text-green-500" />
              ) : (
                <div className="h-4 w-4" />
              )}
              <span className="text-sm">{stats.trendPercentage}%</span>
            </div>
          </div>
          {anomalies.length > 0 && (
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="text-sm">{anomalies.length} anomalies detected</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          {renderChart()}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Helper functions
function generateSampleData(timeRange: TimeRange): PerformanceDataPoint[] {
  const now = new Date();
  const points = timeRange === '1h' ? 60 : timeRange === '6h' ? 72 : timeRange === '24h' ? 96 : timeRange === '7d' ? 168 : 720;
  const interval = timeRange === '1h' ? 1 : timeRange === '6h' ? 5 : timeRange === '24h' ? 15 : timeRange === '7d' ? 60 : 60;
  
  const data: PerformanceDataPoint[] = [];
  for (let i = points; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * interval * 60 * 1000);
    const baseValue = 45 + Math.sin(i * 0.1) * 10;
    const noise = (Math.random() - 0.5) * 20;
    const value = Math.max(0, baseValue + noise);
    
    data.push({
      timestamp: timestamp.toISOString(),
      value: Math.round(value * 100) / 100,
      status: value > 80 ? 'error' : value > 60 ? 'warning' : 'good'
    });
  }
  
  return data;
}

function filterDataByTimeRange(data: PerformanceDataPoint[], timeRange: TimeRange): PerformanceDataPoint[] {
  const now = new Date();
  const timeRangeMs = {
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
  }[timeRange];
  
  const cutoff = new Date(now.getTime() - timeRangeMs);
  return data.filter(point => new Date(point.timestamp) >= cutoff);
}

function calculateStats(data: PerformanceDataPoint[], dataKey: string) {
  if (data.length === 0) {
    return { current: 0, average: 0, trend: 'stable' as const, trendPercentage: 0 };
  }
  
  const values = data.map(point => point[dataKey] as number);
  const current = values[values.length - 1] || 0;
  const average = Math.round((values.reduce((sum, val) => sum + val, 0) / values.length) * 100) / 100;
  
  // Calculate trend from last 25% of data points
  const trendWindow = Math.max(1, Math.floor(values.length * 0.25));
  const recentValues = values.slice(-trendWindow);
  const oldValues = values.slice(-trendWindow * 2, -trendWindow);
  
  const recentAvg = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length;
  const oldAvg = oldValues.length > 0 ? oldValues.reduce((sum, val) => sum + val, 0) / oldValues.length : recentAvg;
  
  const trendPercentage = oldAvg !== 0 ? Math.round(((recentAvg - oldAvg) / oldAvg) * 100) : 0;
  const trend = Math.abs(trendPercentage) < 5 ? 'stable' : trendPercentage > 0 ? 'up' : 'down';
  
  return { current, average, trend, trendPercentage: Math.abs(trendPercentage) };
}

function detectAnomalies(data: PerformanceDataPoint[], dataKey: string, threshold?: { warning: number; error: number }): PerformanceDataPoint[] {
  if (!threshold) return [];
  
  return data.filter(point => {
    const value = point[dataKey] as number;
    return value > threshold.error;
  });
}