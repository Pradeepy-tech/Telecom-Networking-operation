import React from 'react';
import { Radio, Activity, MapPin, BrainCircuit, Users } from 'lucide-react';

export type TabKey = 'overview' | 'geospatial' | 'forecasting' | 'correlation';

interface HeaderProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onSelectTab }) => {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'geospatial', label: 'Geospatial Map', icon: MapPin },
    { id: 'forecasting', label: 'Root Cause & Impact Forecasting', icon: BrainCircuit },
    { id: 'correlation', label: 'Complaint Correlation', icon: Users },
  ] as const;

  return (
    <header className="border-b-4 border-[#E50000] bg-[#0f172a] shadow-lg sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-5 pb-4 gap-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500">
              <Radio className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                <span>📡</span>
                <span>Telecom Network Operations Center</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Airtel Network Intelligence • Alarms, Geospatial Causality &amp; Complaints
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="h-2 w-2 rounded-full bg-emerald-400 mr-1.5 animate-ping" />
              Live Operations Feed
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-2 scrollbar-none" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => onSelectTab(tab.id as TabKey)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-[#E50000] text-white shadow-md shadow-red-900/40 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
