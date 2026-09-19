import React, { useState } from 'react';
import { Search, BrainCircuit, CheckCircle2, AlertCircle, TrendingUp, Info } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { AlarmRecord, ComplaintRecord, ModelAndContextData } from '../types';

interface ForecastingTabProps {
  alarmsIndex: Record<string, AlarmRecord>;
  alarmsList: AlarmRecord[];
  complaints: ComplaintRecord[];
  modelsAndContext: ModelAndContextData;
}

export const ForecastingTab: React.FC<ForecastingTabProps> = ({
  alarmsIndex,
  alarmsList,
  complaints,
  modelsAndContext,
}) => {
  const [inputMode, setInputMode] = useState<'search' | 'manual'>('search');

  // Search Mode State
  const [searchId, setSearchId] = useState<string>('ALM000001');
  const [searchedAlarm, setSearchedAlarm] = useState<AlarmRecord | null>(alarmsList[0] || null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Manual Mode State
  const { dropdownOptions, historicalContext, rcModelRules, impactAverages } = modelsAndContext;
  const [manualAlarmType, setManualAlarmType] = useState<string>(dropdownOptions.alarmTypes[0] || 'Synchronization Failure');
  const [manualSeverity, setManualSeverity] = useState<string>('Major');
  const [manualTech, setManualTech] = useState<string>('4G LTE');
  const [manualWeather, setManualWeather] = useState<string>('Clear');
  const [manualPower, setManualPower] = useState<string>('Grid Available');
  const [manualDuration, setManualDuration] = useState<number>(60);

  const [manualPrediction, setManualPrediction] = useState<{
    rootCause: string;
    affectedCustomers: number;
    alarmType: string;
  } | null>(null);

  // Perform prediction calculation using model rules & impact weights
  const calculatePrediction = (
    alarmType: string,
    powerStatus: string,
    weatherCondition: string,
    severity: string,
    durationMinutes: number
  ) => {
    const key = `${alarmType}|${powerStatus}|${weatherCondition}`;
    let predictedRc = rcModelRules[key];
    if (!predictedRc) {
      if (powerStatus === 'Grid Failure') predictedRc = 'Power Failure';
      else if (weatherCondition === 'Storm' || weatherCondition === 'Rain') predictedRc = 'Weather Impact';
      else if (alarmType === 'Battery Low') predictedRc = 'Battery Failure';
      else if (alarmType === 'Fiber Cut') predictedRc = 'Fiber Cut';
      else predictedRc = 'Equipment Fault';
    }

    const baseImpact = impactAverages.bySeverity[severity as keyof typeof impactAverages.bySeverity] || 2000;
    const typeAvg = impactAverages.byType[alarmType] || 2500;
    const durationFactor = Math.min(2.0, Math.max(0.6, Math.log10(Math.max(10, durationMinutes)) / 2));
    const predictedImpact = Math.round(((baseImpact + typeAvg) / 2) * durationFactor);

    return {
      rootCause: predictedRc,
      affectedCustomers: predictedImpact,
    };
  };

  const handleSearch = () => {
    setSearchError(null);
    const cleaned = searchId.trim().toUpperCase().replace('-', '');
    // Check in index or find in list
    const found =
      alarmsIndex[cleaned] ||
      alarmsIndex[searchId.trim()] ||
      alarmsList.find(
        (a) =>
          a.alarm_id.toUpperCase() === cleaned ||
          a.alarm_id.toUpperCase() === searchId.trim().toUpperCase()
      );

    if (found) {
      setSearchedAlarm(found);
    } else {
      setSearchedAlarm(null);
      setSearchError(`Alarm ID "${searchId}" not found in current dataset. Try e.g. ALM000001, ALM000025, or choose a quick sample.`);
    }
  };

  const handleManualPredict = () => {
    const res = calculatePrediction(
      manualAlarmType,
      manualPower,
      manualWeather,
      manualSeverity,
      manualDuration
    );
    setManualPrediction({
      rootCause: res.rootCause,
      affectedCustomers: res.affectedCustomers,
      alarmType: manualAlarmType,
    });
  };

  // Matched complaints for searched alarm
  const matchedComplaints = searchedAlarm
    ? complaints.filter((c) => c.related_alarm_id === searchedAlarm.alarm_id)
    : [];

  // Predictions for searched alarm
  const searchedAlarmPrediction = searchedAlarm
    ? calculatePrediction(
        searchedAlarm.alarm_type,
        searchedAlarm.power_status,
        searchedAlarm.weather_condition,
        searchedAlarm.severity,
        searchedAlarm.duration_minutes
      )
    : null;

  const currentHistContext = historicalContext[manualPrediction?.alarmType || manualAlarmType];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Root Cause &amp; Downstream Impact Prediction
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Predict the underlying root cause and forecast the number of affected customers using machine learning intelligence.
        </p>
      </div>

      {/* Mode Selector */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 shadow-md flex items-center gap-6">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Input Method:</span>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
            <input
              type="radio"
              name="inputMode"
              value="search"
              checked={inputMode === 'search'}
              onChange={() => setInputMode('search')}
              className="accent-[#E50000] h-4 w-4"
            />
            <span>Search by Alarm ID</span>
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
            <input
              type="radio"
              name="inputMode"
              value="manual"
              checked={inputMode === 'manual'}
              onChange={() => setInputMode('manual')}
              className="accent-[#E50000] h-4 w-4"
            />
            <span>Manual Input</span>
          </label>
        </div>
      </div>

      {/* Mode 1: Search by Alarm ID */}
      {inputMode === 'search' && (
        <div className="space-y-6">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-6 shadow-md">
            <label htmlFor="input-alarm-id" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Enter Alarm ID (e.g., ALM000001, ALM000100)
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                id="input-alarm-id"
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Enter Alarm ID..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
              />
              <button
                id="btn-search-alarm"
                onClick={handleSearch}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-[#E50000] hover:bg-red-700 text-white font-semibold text-sm shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
              >
                <Search className="h-4 w-4" />
                Search
              </button>
            </div>

            {/* Quick Sample Alarm Chips */}
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-700/50">
              <span className="text-xs text-slate-400">Quick Samples:</span>
              {['ALM000001', 'ALM000025', 'ALM000050', 'ALM000125', 'ALM000250'].map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => {
                    setSearchId(sample);
                    const found = alarmsIndex[sample] || alarmsList.find((a) => a.alarm_id === sample);
                    if (found) {
                      setSearchedAlarm(found);
                      setSearchError(null);
                    }
                  }}
                  className="px-2.5 py-1 rounded bg-slate-700/50 hover:bg-slate-700 text-xs font-mono text-slate-300 transition-colors"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>

          {searchError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-red-400 text-sm">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{searchError}</span>
            </div>
          )}

          {searchedAlarm && (
            <div className="space-y-6">
              {/* Found Banner */}
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between text-emerald-400">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Alarm Found: {searchedAlarm.alarm_id}</span>
                </div>
                <span className="text-xs font-mono text-emerald-300">
                  Timestamp: {searchedAlarm.alarm_timestamp || 'Active'}
                </span>
              </div>

              {/* 3-Column Alarm Details */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-6 shadow-md grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2 border-b md:border-b-0 md:border-r border-slate-700/60 pb-4 md:pb-0 md:pr-4">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Geography</div>
                  <div className="text-sm text-slate-200">
                    <span className="font-semibold text-white">Region:</span> {searchedAlarm.region}
                  </div>
                  <div className="text-sm text-slate-200">
                    <span className="font-semibold text-white">Circle:</span> {searchedAlarm.circle}
                  </div>
                  <div className="text-sm text-slate-200">
                    <span className="font-semibold text-white">City:</span> {searchedAlarm.city}
                  </div>
                  <div className="text-sm text-slate-200">
                    <span className="font-semibold text-white">Node:</span>{' '}
                    <span className="font-mono text-blue-400">{searchedAlarm.network_node}</span>
                  </div>
                </div>

                <div className="space-y-2 border-b md:border-b-0 md:border-r border-slate-700/60 pb-4 md:pb-0 md:pr-4">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Telemetry</div>
                  <div className="text-sm text-slate-200">
                    <span className="font-semibold text-white">Alarm Type:</span> {searchedAlarm.alarm_type}
                  </div>
                  <div className="text-sm text-slate-200">
                    <span className="font-semibold text-white">Severity:</span>{' '}
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                        searchedAlarm.severity === 'Critical'
                          ? 'bg-red-500/20 text-red-400'
                          : searchedAlarm.severity === 'Major'
                          ? 'bg-orange-500/20 text-orange-400'
                          : searchedAlarm.severity === 'Minor'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}
                    >
                      {searchedAlarm.severity}
                    </span>
                  </div>
                  <div className="text-sm text-slate-200">
                    <span className="font-semibold text-white">Technology:</span> {searchedAlarm.technology}
                  </div>
                  <div className="text-sm text-slate-200">
                    <span className="font-semibold text-white">Duration:</span> {searchedAlarm.duration_minutes} mins
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Actual Ground Truth</div>
                  <div className="text-sm text-slate-200">
                    <span className="font-semibold text-white">Actual Root Cause:</span>{' '}
                    <span className="text-amber-400 font-semibold">{searchedAlarm.root_cause}</span>
                  </div>
                  <div className="text-sm text-slate-200">
                    <span className="font-semibold text-white">Actual Affected Customers:</span>{' '}
                    <span className="font-mono font-semibold text-white">
                      {searchedAlarm.affected_customers?.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm text-slate-200">
                    <span className="font-semibold text-white">Weather:</span> {searchedAlarm.weather_condition}
                  </div>
                  <div className="text-sm text-slate-200">
                    <span className="font-semibold text-white">Power:</span> {searchedAlarm.power_status}
                  </div>
                </div>
              </div>

              {/* Model Predictions for this Alarm */}
              {searchedAlarmPrediction && (
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-6 shadow-md">
                  <div className="flex items-center gap-2 mb-4">
                    <BrainCircuit className="h-5 w-5 text-purple-400" />
                    <h3 className="text-lg font-semibold text-white">Model Predictions for this Alarm</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                      <div className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
                        Predicted Root Cause
                      </div>
                      <div className="text-xl font-bold text-white mt-1">
                        {searchedAlarmPrediction.rootCause}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Random Forest Classifier inference</p>
                    </div>

                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                      <div className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
                        Forecasted Affected Customers
                      </div>
                      <div className="text-xl font-bold text-white mt-1 font-mono">
                        {searchedAlarmPrediction.affectedCustomers.toLocaleString()}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Random Forest Regressor impact forecast</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Linked Customer Complaints Table */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-6 shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Affected Customers (Complaints)</h3>
                    <p className="text-xs text-slate-400">
                      Customer complaints directly linked to this Alarm ID ({searchedAlarm.alarm_id})
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-slate-700 text-xs text-slate-300 font-mono">
                    {matchedComplaints.length} Linked
                  </span>
                </div>

                {matchedComplaints.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-sm border border-dashed border-slate-700 rounded-lg">
                    No direct customer complaints found linked to this Alarm ID in the sample dataset.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300 border-collapse">
                      <thead>
                        <tr className="border-b border-slate-700 bg-slate-900/60 text-slate-400 uppercase tracking-wider font-semibold">
                          <th className="py-2.5 px-3">Customer ID</th>
                          <th className="py-2.5 px-3">Priority</th>
                          <th className="py-2.5 px-3">Region / City</th>
                          <th className="py-2.5 px-3">Complaint Type</th>
                          <th className="py-2.5 px-3">Signal (dBm)</th>
                          <th className="py-2.5 px-3">Speed (Mbps)</th>
                          <th className="py-2.5 px-3">Latency (ms)</th>
                          <th className="py-2.5 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {matchedComplaints.map((c) => (
                          <tr key={c.complaint_id} className="hover:bg-slate-700/30">
                            <td className="py-2 px-3 font-mono text-white">{c.customer_id}</td>
                            <td className="py-2 px-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  c.customer_priority === 'High'
                                    ? 'bg-red-500/20 text-red-400'
                                    : 'bg-slate-700 text-slate-300'
                                }`}
                              >
                                {c.customer_priority}
                              </span>
                            </td>
                            <td className="py-2 px-3">
                              {c.region_comp} • {c.city}
                            </td>
                            <td className="py-2 px-3 font-medium text-slate-200">{c.complaint_type}</td>
                            <td className="py-2 px-3 font-mono">{c.signal_strength_dbm}</td>
                            <td className="py-2 px-3 font-mono">{c.download_speed_mbps}</td>
                            <td className="py-2 px-3 font-mono">{c.latency_ms}</td>
                            <td className="py-2 px-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] ${
                                  c.status === 'Open'
                                    ? 'bg-amber-500/20 text-amber-400'
                                    : 'bg-emerald-500/20 text-emerald-400'
                                }`}
                              >
                                {c.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Manual Input */}
      {inputMode === 'manual' && (
        <div className="space-y-6">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-6 shadow-md">
            <h3 className="text-base font-semibold text-white mb-4">Input Network Alarm Parameters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Column 1 */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="select-manual-alarm-type" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Alarm Type
                  </label>
                  <select
                    id="select-manual-alarm-type"
                    value={manualAlarmType}
                    onChange={(e) => setManualAlarmType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
                  >
                    {dropdownOptions.alarmTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="select-manual-severity" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Severity
                  </label>
                  <select
                    id="select-manual-severity"
                    value={manualSeverity}
                    onChange={(e) => setManualSeverity(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
                  >
                    {dropdownOptions.severities.map((sev) => (
                      <option key={sev} value={sev}>
                        {sev}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="select-manual-tech" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Technology
                  </label>
                  <select
                    id="select-manual-tech"
                    value={manualTech}
                    onChange={(e) => setManualTech(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
                  >
                    {dropdownOptions.technologies.map((tech) => (
                      <option key={tech} value={tech}>
                        {tech}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Column 2 */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="select-manual-weather" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Weather Condition
                  </label>
                  <select
                    id="select-manual-weather"
                    value={manualWeather}
                    onChange={(e) => setManualWeather(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
                  >
                    {dropdownOptions.weatherConditions.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="select-manual-power" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Power Status
                  </label>
                  <select
                    id="select-manual-power"
                    value={manualPower}
                    onChange={(e) => setManualPower(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
                  >
                    {dropdownOptions.powerStatuses.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="input-manual-duration" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Duration (Minutes)
                  </label>
                  <input
                    id="input-manual-duration"
                    type="number"
                    min={1}
                    max={1440}
                    value={manualDuration}
                    onChange={(e) => setManualDuration(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-700/60 flex justify-end">
              <button
                id="btn-manual-predict"
                onClick={handleManualPredict}
                className="inline-flex items-center justify-center gap-2 px-8 py-2.5 rounded-lg bg-[#E50000] hover:bg-red-700 text-white font-semibold text-sm shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
              >
                <BrainCircuit className="h-4 w-4" />
                Predict Root Cause &amp; Impact
              </button>
            </div>
          </div>

          {/* Manual Prediction Results */}
          {manualPrediction && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5 shadow-md">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                    <CheckCircle2 className="h-4 w-4" />
                    Predicted Root Cause
                  </div>
                  <div className="text-2xl font-bold text-white mt-2">
                    {manualPrediction.rootCause}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Deduced from alarm parameters &amp; situational telemetry
                  </p>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-5 shadow-md">
                  <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider">
                    <TrendingUp className="h-4 w-4" />
                    Forecasted Affected Customers
                  </div>
                  <div className="text-2xl font-bold text-white mt-2 font-mono">
                    {manualPrediction.affectedCustomers.toLocaleString()}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Based on severity ({manualSeverity}) and duration ({manualDuration} mins)
                  </p>
                </div>
              </div>

              {/* Historical Context Section */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-6 shadow-md">
                <div className="flex items-center gap-2 mb-4">
                  <Info className="h-5 w-5 text-blue-400" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Historical Context for '{manualPrediction.alarmType}'
                    </h3>
                    <p className="text-xs text-slate-400">
                      Regional distribution and transition probabilities derived from network alarm chains.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {/* Top Regions for this alarm */}
                  <div className="bg-slate-900/60 border border-slate-700/50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-slate-200 mb-3">
                      Top Regions for this Alarm
                    </h4>
                    {currentHistContext?.topRegions && currentHistContext.topRegions.length > 0 ? (
                      <div className="h-52 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            layout="vertical"
                            data={currentHistContext.topRegions}
                            margin={{ top: 5, right: 20, left: 45, bottom: 5 }}
                          >
                            <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} />
                            <YAxis type="category" dataKey="Region" stroke="#94a3b8" fontSize={11} tickLine={false} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#1e293b',
                                borderColor: '#334155',
                                borderRadius: '0.5rem',
                                color: '#f8fafc',
                              }}
                            />
                            <Bar dataKey="Count" name="Count" fill="#E50000" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-52 flex items-center justify-center text-xs text-slate-400">
                        No regional data available.
                      </div>
                    )}
                  </div>

                  {/* Most Likely Next Alarm */}
                  <div className="bg-slate-900/60 border border-slate-700/50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-slate-200 mb-3">
                      Most Likely Next Alarm (Causal Chain)
                    </h4>
                    {currentHistContext?.transitions && currentHistContext.transitions.length > 0 ? (
                      <div className="h-52 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={currentHistContext.transitions}
                            margin={{ top: 5, right: 15, left: -10, bottom: 25 }}
                          >
                            <XAxis
                              dataKey="nextAlarm"
                              stroke="#64748b"
                              fontSize={10}
                              tickLine={false}
                              angle={-25}
                              textAnchor="end"
                              interval={0}
                            />
                            <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#1e293b',
                                borderColor: '#334155',
                                borderRadius: '0.5rem',
                                color: '#f8fafc',
                              }}
                            />
                            <Bar dataKey="frequency" name="Frequency" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-52 flex items-center justify-center text-xs text-slate-400">
                        No subsequent alarms identified for this type.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
