import React, { useState, useMemo } from 'react';
import { Search, Download, Users, PieChart as PieIcon, BarChart3, Filter } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import type { ComplaintRecord } from '../types';
import { downloadCSV } from '../utils/csv';

interface ComplaintCorrelationTabProps {
  complaints: ComplaintRecord[];
  complaintsByAlarmType: { alarm_type: string; complaints: number }[];
  complaintsBySeverity: { Severity: string; Complaints: number }[];
  compByRegion: Record<string, number>;
}

const SEVERITY_COLORS: Record<string, string> = {
  Critical: '#ef4444',
  Major: '#f97316',
  Minor: '#eab308',
  Warning: '#3b82f6',
};

type SearchField =
  | 'Alarm ID'
  | 'Alarm Type'
  | 'Network Node'
  | 'Router ID'
  | 'Customer ID'
  | 'Complaint Type'
  | 'Status'
  | 'Region';

export const ComplaintCorrelationTab: React.FC<ComplaintCorrelationTabProps> = ({
  complaints,
  complaintsByAlarmType: globalCompByAlarm,
  complaintsBySeverity: globalCompBySev,
}) => {
  const [searchBy, setSearchBy] = useState<SearchField>('Alarm ID');
  const [searchValue, setSearchValue] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('All Regions');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  // Region filtered complaints
  const regionFilteredComplaints = useMemo(() => {
    if (selectedRegion === 'All Regions') return complaints;
    return complaints.filter((c) => c.region_comp === selectedRegion);
  }, [complaints, selectedRegion]);

  // Search filtered complaints
  const searchFilteredComplaints = useMemo(() => {
    if (!searchValue.trim()) return regionFilteredComplaints;
    const term = searchValue.trim().toLowerCase();

    return regionFilteredComplaints.filter((c) => {
      switch (searchBy) {
        case 'Alarm ID':
          return (c.alarm_id || '').toLowerCase().includes(term);
        case 'Alarm Type':
          return (c.alarm_type || '').toLowerCase().includes(term);
        case 'Network Node':
          return (
            (c.network_node_comp || '').toLowerCase().includes(term) ||
            (c.network_node_alarm || '').toLowerCase().includes(term)
          );
        case 'Router ID':
          return (c.router_id || '').toLowerCase().includes(term);
        case 'Customer ID':
          return (c.customer_id || '').toLowerCase().includes(term);
        case 'Complaint Type':
          return (c.complaint_type || '').toLowerCase().includes(term);
        case 'Status':
          return (c.status || '').toLowerCase().includes(term);
        case 'Region':
          return (c.region_comp || '').toLowerCase().includes(term);
        default:
          return true;
      }
    });
  }, [regionFilteredComplaints, searchValue, searchBy]);

  // Dynamic regional chart data
  const dynamicCompByAlarmType = useMemo(() => {
    if (selectedRegion === 'All Regions') return globalCompByAlarm.slice(0, 10);
    const m: Record<string, number> = {};
    regionFilteredComplaints.forEach((c) => {
      if (c.alarm_type && c.alarm_type !== 'Unknown') {
        m[c.alarm_type] = (m[c.alarm_type] || 0) + 1;
      }
    });
    return Object.entries(m)
      .map(([alarm_type, complaints]) => ({ alarm_type, complaints }))
      .sort((a, b) => b.complaints - a.complaints)
      .slice(0, 10);
  }, [selectedRegion, regionFilteredComplaints, globalCompByAlarm]);

  const dynamicCompBySeverity = useMemo(() => {
    if (selectedRegion === 'All Regions') return globalCompBySev;
    const m: Record<string, number> = { Critical: 0, Major: 0, Minor: 0, Warning: 0 };
    regionFilteredComplaints.forEach((c) => {
      if (c.severity && m[c.severity] !== undefined) {
        m[c.severity]++;
      }
    });
    return Object.entries(m).map(([Severity, Complaints]) => ({ Severity, Complaints }));
  }, [selectedRegion, regionFilteredComplaints, globalCompBySev]);

  const handleExportCSV = () => {
    downloadCSV(searchFilteredComplaints, 'complaints_filtered.csv');
  };

  // Pagination for search results
  const totalPages = Math.ceil(searchFilteredComplaints.length / pageSize) || 1;
  const paginatedComplaints = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return searchFilteredComplaints.slice(start, start + pageSize);
  }, [searchFilteredComplaints, currentPage]);

  const availableRegions = useMemo(() => {
    const set = new Set<string>();
    complaints.forEach((c) => {
      if (c.region_comp) set.add(c.region_comp);
    });
    return ['All Regions', ...Array.from(set).sort()];
  }, [complaints]);

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Complaint Correlation</h2>
        <p className="text-sm text-slate-400 mt-1">
          Link network issues to customer experience by matching complaints to alarms and analyzing root impacts.
        </p>
      </div>

      {/* Search Customer Complaints */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-6 shadow-md space-y-4">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <Search className="h-4 w-4 text-[#E50000]" />
          Search Customer Complaints
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-1">
            <label htmlFor="select-search-by" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Search By:
            </label>
            <select
              id="select-search-by"
              value={searchBy}
              onChange={(e) => {
                setSearchBy(e.target.value as SearchField);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
            >
              {[
                'Alarm ID',
                'Alarm Type',
                'Network Node',
                'Router ID',
                'Customer ID',
                'Complaint Type',
                'Status',
                'Region',
              ].map((field) => (
                <option key={field} value={field}>
                  {field}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="input-search-val" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Enter {searchBy}
            </label>
            <div className="relative">
              <input
                id="input-search-val"
                type="text"
                value={searchValue}
                onChange={(e) => {
                  setSearchValue(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={`Type ${searchBy}... (e.g. ${
                  searchBy === 'Alarm ID'
                    ? 'ALM000001'
                    : searchBy === 'Status'
                    ? 'Open or Closed'
                    : searchBy === 'Complaint Type'
                    ? 'High Latency'
                    : searchBy === 'Region'
                    ? 'West or North'
                    : 'Search...'
                })`}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <Search className="h-4 w-4 text-slate-500 absolute left-3.5 top-3.5" />
            </div>
          </div>
        </div>

        {/* Found Status Banner */}
        <div className="pt-2 text-xs font-medium text-slate-300 flex items-center justify-between">
          <div>
            Found <strong className="text-white font-mono">{searchFilteredComplaints.length.toLocaleString()}</strong> complaints
            {searchValue ? ` matching ${searchBy} = '${searchValue}'` : ' in current selection'}
          </div>
          {totalPages > 1 && (
            <div className="text-slate-400">
              Page {currentPage} of {totalPages}
            </div>
          )}
        </div>

        {/* Results Table */}
        <div className="overflow-x-auto border border-slate-700/80 rounded-lg">
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-2.5 px-3">Customer ID</th>
                <th className="py-2.5 px-3">Complaint Type</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Region</th>
                <th className="py-2.5 px-3">Alarm ID</th>
                <th className="py-2.5 px-3">Alarm Type</th>
                <th className="py-2.5 px-3">Network Node</th>
                <th className="py-2.5 px-3">Router ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {paginatedComplaints.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-sm">
                    No complaints match your search criteria.
                  </td>
                </tr>
              ) : (
                paginatedComplaints.map((c) => (
                  <tr key={c.complaint_id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-white font-medium">{c.customer_id}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-200">{c.complaint_type}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          c.status === 'Open'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{c.region_comp}</td>
                    <td className="py-2.5 px-3 font-mono text-blue-400 font-semibold">{c.alarm_id}</td>
                    <td className="py-2.5 px-3">{c.alarm_type}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">{c.network_node_comp}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">{c.router_id}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:pointer-events-none text-xs text-white"
            >
              Previous
            </button>
            <div className="text-xs text-slate-400">
              Showing {(currentPage - 1) * pageSize + 1} -{' '}
              {Math.min(currentPage * pageSize, searchFilteredComplaints.length)} of{' '}
              {searchFilteredComplaints.length}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:pointer-events-none text-xs text-white"
            >
              Next
            </button>
          </div>
        )}
      </div>

      <div className="border-t border-slate-800 my-6" />

      {/* Filter Complaints by Region Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Filter className="h-5 w-5 text-blue-400" />
              Filter Complaints by Region
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select a specific operational region to inspect root cause complaint distributions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              id="select-region"
              value={selectedRegion}
              onChange={(e) => {
                setSelectedRegion(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {availableRegions.map((reg) => (
                <option key={reg} value={reg}>
                  {reg}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Total Matched Complaints Metric Card */}
        <div
          className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 shadow-lg max-w-sm"
          style={{ borderLeft: '5px solid #E50000' }}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Matched Complaints</span>
            <Users className="h-5 w-5 text-amber-500" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-white font-mono">
            {regionFilteredComplaints.length.toLocaleString()}
          </div>
          <p className="text-xs text-slate-400 mt-1">Filtered by: {selectedRegion}</p>
        </div>

        {/* Complaints Charts 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Complaints by Alarm Type */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-base font-semibold text-white flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-purple-400" />
                  Complaints by Alarm Type
                </h4>
                <p className="text-xs text-slate-400">Top alarm types driving customer grievances</p>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={[...dynamicCompByAlarmType].reverse()}
                  margin={{ top: 5, right: 20, left: 80, bottom: 5 }}
                >
                  <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="alarm_type"
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
                  <Bar dataKey="complaints" name="Complaints" fill="#c026d3" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Complaints by Alarm Severity */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-base font-semibold text-white flex items-center gap-2">
                  <PieIcon className="h-4 w-4 text-red-400" />
                  Complaints by Alarm Severity
                </h4>
                <p className="text-xs text-slate-400">Severity distribution of underlying alarms</p>
              </div>
            </div>
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dynamicCompBySeverity}
                    dataKey="Complaints"
                    nameKey="Severity"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                    labelLine={false}
                  >
                    {dynamicCompBySeverity.map((entry) => (
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
              {dynamicCompBySeverity.map((s) => (
                <div key={s.Severity} className="flex items-center gap-1.5 text-xs text-slate-300">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: SEVERITY_COLORS[s.Severity] || '#94a3b8' }}
                  />
                  <span>{s.Severity}</span>
                  <span className="text-slate-400">({s.Complaints.toLocaleString()})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Export Filtered Complaints Button */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h4 className="text-base font-semibold text-white">Export Filtered Complaints</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Download the current filtered customer complaints matching region and search terms in CSV format.
            </p>
          </div>
          <button
            id="btn-export-complaints-csv"
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#E50000] hover:bg-red-700 text-white font-semibold text-sm shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer whitespace-nowrap"
          >
            <Download className="h-4 w-4" />
            Download Filtered Complaints (CSV)
          </button>
        </div>
      </div>
    </div>
  );
};
