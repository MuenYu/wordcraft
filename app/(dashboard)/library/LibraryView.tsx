'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, TrendingUp, Clock, CheckCircle } from 'lucide-react';

// Mock data for the donut chart - word learning status
const wordStatusData = [
  { label: 'Deep Matured', value: 45, color: '#22c55e' }, // green
  { label: 'Matured', value: 120, color: '#3b82f6' }, // blue
  { label: 'Memorizing', value: 85, color: '#f59e0b' }, // amber
  { label: 'Pending', value: 50, color: '#94a3b8' }, // gray
];

// Mock data for the line chart - daily word memorization (last 7 days)
const dailyActivityData = [
  { day: 'Mon', words: 12 },
  { day: 'Tue', words: 19 },
  { day: 'Wed', words: 8 },
  { day: 'Thu', words: 25 },
  { day: 'Fri', words: 15 },
  { day: 'Sat', words: 32 },
  { day: 'Sun', words: 21 },
];

function DonutChart({
  data,
  centerLabel,
  centerValue,
}: {
  data: { label: string; value: number; color: string }[];
  centerLabel: string;
  centerValue: string;
}) {
  const total = data.reduce((acc, item) => acc + item.value, 0);
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  const segments = data.map((item) => {
    const percentage = item.value / total;
    const segmentLength = percentage * circumference;
    const strokeDasharray = `${segmentLength} ${circumference - segmentLength}`;
    const strokeDashoffset = -offset;
    offset += segmentLength;
    return { ...item, strokeDasharray, strokeDashoffset, percentage };
  });

  return (
    <div className="relative flex items-center justify-center">
      <svg width="200" height="200" className="transform -rotate-90">
        {segments.map((segment, index) => (
          <circle
            key={index}
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            strokeWidth="24"
            strokeDasharray={segment.strokeDasharray}
            strokeDashoffset={segment.strokeDashoffset}
            stroke={segment.color}
            className="transition-all duration-500 ease-out"
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-gray-900">{centerValue}</span>
        <span className="text-sm text-gray-500">{centerLabel}</span>
      </div>
    </div>
  );
}

function LineChart({ data }: { data: { day: string; words: number }[] }) {
  const maxWords = Math.max(...data.map((d) => d.words));
  const padding = 20;
  const width = 280;
  const height = 120;
  const graphWidth = width - padding * 2;
  const graphHeight = height - padding * 2;

  const points = data
    .map((item, index) => {
      const x = padding + (index / (data.length - 1)) * graphWidth;
      const y = padding + graphHeight - (item.words / maxWords) * graphHeight;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="w-full">
      <svg
        width="100%"
        height="150"
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
      >
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={i}
            x1={padding}
            y1={padding + (i / 4) * graphHeight}
            x2={width - padding}
            y2={padding + (i / 4) * graphHeight}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        ))}

        {/* Y-axis labels */}
        {[
          { value: maxWords, y: padding },
          { value: Math.round(maxWords * 0.5), y: padding + graphHeight / 2 },
          { value: 0, y: padding + graphHeight },
        ].map((label, i) => (
          <text
            key={i}
            x={padding - 8}
            y={label.y + 4}
            textAnchor="end"
            className="text-xs fill-gray-500"
          >
            {label.value}
          </text>
        ))}

        {/* Line */}
        <polyline
          fill="none"
          stroke="#ec4899"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />

        {/* Data points */}
        {data.map((item, index) => {
          const x = padding + (index / (data.length - 1)) * graphWidth;
          const y = padding + graphHeight - (item.words / maxWords) * graphHeight;
          return (
            <g key={index}>
              <circle
                cx={x}
                cy={y}
                r="6"
                fill="white"
                stroke="#ec4899"
                strokeWidth="3"
                className="cursor-pointer transition-all hover:r-8"
              />
              <text
                x={x}
                y={y - 12}
                textAnchor="middle"
                className="text-xs font-medium fill-gray-700"
              >
                {item.words}
              </text>
            </g>
          );
        })}

        {/* X-axis labels */}
        {data.map((item, index) => {
          const x = padding + (index / (data.length - 1)) * graphWidth;
          return (
            <text
              key={index}
              x={x}
              y={height - 2}
              textAnchor="middle"
              className="text-xs fill-gray-500"
            >
              {item.day}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

// eslint-disable-next-line import/no-default-export
export function LibraryView() {
  return (
    <div className="flex-1 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Library</h1>
          <p className="mt-2 text-gray-600">Track your vocabulary learning progress</p>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Donut Chart - Word Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Word Mastery Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <DonutChart data={wordStatusData} centerLabel="Total Words" centerValue="300" />
                <div className="mt-6 grid grid-cols-2 gap-3 w-full">
                  {wordStatusData.map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-gray-600">{item.label}</span>
                      <span className="text-sm font-medium text-gray-900 ml-auto">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line Chart - Daily Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Words Memorized (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <LineChart data={dailyActivityData} />
              <div className="mt-4 flex items-center justify-center gap-2">
                <div className="h-3 w-3 rounded-full bg-pink-500" />
                <span className="text-sm text-gray-600">Words learned per day</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
