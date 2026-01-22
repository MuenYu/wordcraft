'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type LibraryOverview = {
  wordStatus: { label: string; value: number; color: string }[];
  totalWords: number;
  dailyStudy: { label: string; count: number }[];
  stubbornWords: { word: string; partOfSpeech: string; studyCount: number; masteryLevel: number }[];
};

function LineChart({
  data,
  averageLine,
}: {
  data: { label: string; count: number }[];
  averageLine: number;
}) {
  const maxCount = Math.max(...data.map((d) => d.count), averageLine);
  const width = 500;
  const height = 200;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const barWidth = chartWidth / data.length - 4;

  // Round to 2 decimal places to prevent hydration mismatch from floating-point precision
  const averageY =
    Math.round((height - padding - (averageLine / maxCount) * chartHeight) * 100) / 100;

  return (
    <div className="relative">
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
      >
        {/* Y-axis grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = Math.round(height - padding - ratio * chartHeight);
          // Add small epsilon before rounding to handle floating-point precision issues
          const value = Math.round(maxCount * ratio + 1e-9);
          return (
            <g key={ratio}>
              <line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
              <text x={padding - 8} y={y + 4} textAnchor="end" className="text-xs fill-gray-500">
                {value}
              </text>
            </g>
          );
        })}

        {/* Average line */}
        <line
          x1={padding}
          y1={averageY}
          x2={width - padding}
          y2={averageY}
          stroke="#9ca3af"
          strokeWidth="2"
          strokeDasharray="6,4"
        />
        <text
          x={width - padding + 8}
          y={averageY + 4}
          className="text-xs fill-gray-500 font-medium"
        >
          Avg: {averageLine}
        </text>

        {/* Bars */}
        {data.map((item, index) => {
          const x = Math.round(padding + index * (chartWidth / data.length) + 2);
          const barHeight = Math.round((item.count / maxCount) * chartHeight * 100) / 100;
          const y = Math.round(height - padding - barHeight);
          return (
            <g key={index}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx="3"
                fill="#ec4899"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                aria-label={`${item.label}: ${item.count} words`}
              />
            </g>
          );
        })}

        {/* X-axis labels */}
        {data
          .filter((_, index) => index % 5 === 0)
          .map((item, index) => {
            const originalIndex = index * 5;
            const x = Math.round(
              padding + originalIndex * (chartWidth / data.length) + barWidth / 2 + 2,
            );
            return (
              <text
                key={originalIndex}
                x={x}
                y={height - 10}
                textAnchor="middle"
                className="text-xs fill-gray-500"
              >
                {item.label}
              </text>
            );
          })}
      </svg>
    </div>
  );
}

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

// eslint-disable-next-line import/no-default-export
export function LibraryView({ data }: { data: LibraryOverview }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(data.stubbornWords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = data.stubbornWords.slice(startIndex, startIndex + itemsPerPage);

  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const averageStudyCount = Math.round(
    data.dailyStudy.reduce((acc, item) => acc + item.count, 0) / data.dailyStudy.length,
  );

  return (
    <div className="flex-1">
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
                <DonutChart
                  data={data.wordStatus}
                  centerLabel="Total Words"
                  centerValue={String(data.totalWords)}
                />
                <div className="mt-6 grid grid-cols-2 gap-3 w-full">
                  {data.wordStatus.map((item) => (
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

          {/* Stubborn Words */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Stubborn Words</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {currentItems.map((item, index) => (
                  <div key={item.word} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-400 w-4">
                      {startIndex + index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 truncate">{item.word}</span>
                        <span className="text-xs px-2 py-0.5 bg-pink-100 text-pink-700 rounded-full shrink-0">
                          {item.partOfSpeech}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs text-gray-500">{item.studyCount} studies</span>
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden ml-2">
                          <div
                            className="h-full bg-amber-500 rounded-full transition-all"
                            style={{ width: `${item.masteryLevel}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-amber-600 w-8 text-right">
                          {item.masteryLevel}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between border-t pt-4">
                <span className="text-xs text-gray-500">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className="h-7 w-7"
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="h-7 w-7"
                  >
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Line Chart - Daily Study Activity */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Study Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart data={data.dailyStudy} averageLine={averageStudyCount} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
