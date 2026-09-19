import React, { useState } from 'react';
import { Header, TabKey } from './components/Header';
import { OverviewTab } from './components/OverviewTab';
import { GeospatialMapTab } from './components/GeospatialMapTab';
import { ForecastingTab } from './components/ForecastingTab';
import { ComplaintCorrelationTab } from './components/ComplaintCorrelationTab';

import overviewData from './data/overview.json';
import geoData from './data/geo.json';
import modelsAndContext from './data/models_and_context.json';
import alarmsData from './data/alarms_sample.json';
import complaintsData from './data/complaints.json';
import type { OverviewData, ModelAndContextData, GeoAlarm, AlarmRecord, ComplaintRecord } from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col">
      <Header activeTab={activeTab} onSelectTab={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <OverviewTab
            overviewData={overviewData as unknown as OverviewData}
            alarmsSample={alarmsData.alarmsList as unknown as AlarmRecord[]}
          />
        )}

        {activeTab === 'geospatial' && (
          <GeospatialMapTab
            geoAlarms={geoData.geoAlarms as unknown as GeoAlarm[]}
            circles={geoData.circles}
          />
        )}

        {activeTab === 'forecasting' && (
          <ForecastingTab
            alarmsIndex={alarmsData.alarmsIndex as unknown as Record<string, AlarmRecord>}
            alarmsList={alarmsData.alarmsList as unknown as AlarmRecord[]}
            complaints={complaintsData.joinedComplaints as unknown as ComplaintRecord[]}
            modelsAndContext={modelsAndContext as unknown as ModelAndContextData}
          />
        )}

        {activeTab === 'correlation' && (
          <ComplaintCorrelationTab
            complaints={complaintsData.joinedComplaints as unknown as ComplaintRecord[]}
            complaintsByAlarmType={complaintsData.complaintsByAlarmType}
            complaintsBySeverity={complaintsData.complaintsBySeverity}
            compByRegion={complaintsData.compByRegion}
          />
        )}
      </main>

      <footer className="border-t border-slate-800/80 bg-[#090d16] py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Telecom Network Operations Center • NOC Intelligence &amp; Analytics Dashboard
          </div>
          <div>
            Data Sources: 50,000 Network Alarms • 20,000 Customer Grievances • 5,000 Base Nodes
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
