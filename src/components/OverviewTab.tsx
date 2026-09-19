import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Download, AlertTriangle, MessageSquare, Server, Users } from 'lucide-react';
import type { OverviewData, AlarmRecord } from '../types';
import { downloadCSV } from '../utils/csv';

interface OverviewTabProps {
  overviewData: OverviewData;
  alarmsSample: AlarmRecord[];
}

const SEVERITY_COLORS: Record<string, string> = {
  Critical: '#ef4444',
  Major: '#f97316',
  Minor: '#eab308',
  Warning: '#3b82f6',
};

export const OverviewTab: React.FC<OverviewTabProps> = ({ overviewData, alarmsSample }) => {
  const {
    totalAlarms,
    totalComplaints,
    uniqueNodes,
    totalAffectedCustomers,
    dailyAlarmFrequency,
    regionCounts,
    severityCounts,
    topAlarmTypes,
  } = overviewData;

  const handleExportCSV = () => {
    downloadCSV(alarmsSample, 'alarms_export.csv');
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Network Overview</h2>
        <p className="text-sm text-slate-400 mt-1">
          High-level operational health, temporal trendlines, severity breakdown, and regional metrics.
        </p>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div
          id="metric-total-alarms"
          className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 shadow-lg transition-all duration-200 hover:-translate-y-1 hover:shadow-red-950/20"
          style={{ borderLeft: '5px solid #E50000' }}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Alarms</span>
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white">
            {totalAlarms.toLocaleString()}
          </div>
          <p className="text-xs text-slate-400 mt-1">Across all circles &amp; technologies</p>
        </div>

        <div
          id="metric-total-complaints"
          className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 shadow-lg transition-all duration-200 hover:-translate-y-1 hover:shadow-red-950/20"
          style={{ borderLeft: '5px solid #E50000' }}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Complaints</span>
            <MessageSquare className="h-5 w-5 text-amber-500" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white">
            {totalComplaints.toLocaleString()}
          </div>
          <p className="text-xs text-slate-400 mt-1">Reported customer issues</p>
        </div>

        <div
          id="metric-unique-nodes"
          className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 shadow-lg transition-all duration-200 hover:-translate-y-1 hover:shadow-red-950/20"
          style={{ borderLeft: '5px solid #E50000' }}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Unique Nodes</span>
            <Server className="h-5 w-5 text-blue-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white">
            {uniqueNodes.toLocaleString()}
          </div>
          <p className="text-xs text-slate-400 mt-1">Active monitored network nodes</p>
        </div>

        <div
          id="metric-affected-customers"
          className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 shadow-lg transition-all duration-200 hover:-translate-y-1 hover:shadow-red-950/20"
          style={{ borderLeft: '5px solid #E50000' }}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Affected Customers</span>
            <Users className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white">
            {totalAffectedCustomers.toLocaleString()}
          </div>
          <p className="text-xs text-slate-400 mt-1">Impact count across all events</p>
        </div>
      </div>

      <div className="border-t border-slate-800 my-6" />

      {/* Visual Analytics 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Daily Alarm Frequency Area Chart */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Alarms Over Time</h3>
                <p className="text-xs text-slate-400">Daily Alarm Frequency</p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-mono">
                {dailyAlarmFrequency.length} Days Tracked
              </span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyAlarmFrequency} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="alarmGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff4b4b" stopOpacity={0.7} />
                      <stop offset="95%" stopColor="#ff4b4b" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val: string) => val.slice(5)}
                  />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderColor: '#334155',
                      borderRadius: '0.5rem',
                      color: '#f8fafc',
                    }}
                    labelStyle={{ color: '#94a3b8', fontWeight: 600 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Alarms"
                    stroke="#ff4b4b"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#alarmGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Alarms by Region Bar Chart */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 shadow-md">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white">Alarms by Region</h3>
              <p className="text-xs text-slate-400">Distribution by Region</p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regionCounts} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <XAxis dataKey="Region" stroke="#64748b" fontSize={12} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderColor: '#334155',
                      borderRadius: '0.5rem',
                      color: '#f8fafc',
                    }}
                  />
                  <Bar dataKey="Count" name="Alarms" fill="#E50000" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Severity Breakdown Donut Chart */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Severity Breakdown</h3>
                <p className="text-xs text-slate-400">Categorization by urgency level</p>
              </div>
            </div>
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityCounts}
                    dataKey="Count"
                    nameKey="Severity"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                    labelLine={false}
                  >
                    {severityCounts.map((entry) => (
                      <Cell key={entry.Severity} fill={SEVERITY_COLORS[entry.Severity] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderColor: '#334155',
                      borderRadius: '0.5rem',
                      color: '#f8fafc',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              {severityCounts.map((s) => (
                <div key={s.Severity} className="flex items-center gap-1.5 text-xs text-slate-300">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: SEVERITY_COLORS[s.Severity] || '#94a3b8' }}
                  />
                  <span>{s.Severity}</span>
                  <span className="text-slate-400">({s.Count.toLocaleString()})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top 10 Alarm Types Horizontal Bar Chart */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 shadow-md">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white">Top 10 Alarm Types</h3>
              <p className="text-xs text-slate-400">Highest occurrence alarm triggers</p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={[...topAlarmTypes].slice(0, 10).reverse()}
                  margin={{ top: 5, right: 20, left: 75, bottom: 5 }}
                >
                  <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="type"
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                    width={90}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderColor: '#334155',
                      borderRadius: '0.5rem',
                      color: '#f8fafc',
                    }}
                  />
                  <Bar dataKey="count" name="Count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800 my-6" />

      {/* Export Section */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-white">Export Dataset</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Download the structured alarms dataset including network nodes, coordinates, root cause, and timestamps in CSV format.
          </p>
        </div>
        <button
          id="btn-export-alarms-csv"
          onClick={handleExportCSV}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#E50000] hover:bg-red-700 text-white font-semibold text-sm shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer whitespace-nowrap"
        >
          <Download className="h-4 w-4" />
          Download Full Alarms Dataset (CSV)
        </button>
      </div>
    </div>
  );
};
