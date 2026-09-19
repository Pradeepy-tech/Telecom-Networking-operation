import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import { Filter, Layers, AlertCircle } from 'lucide-react';
import type { GeoAlarm, SeverityLevel } from '../types';

interface GeospatialMapTabProps {
  geoAlarms: GeoAlarm[];
  circles: string[];
}

const SEVERITY_COLORS: Record<string, string> = {
  Critical: '#ef4444',
  Major: '#f97316',
  Minor: '#eab308',
  Warning: '#3b82f6',
};

export const GeospatialMapTab: React.FC<GeospatialMapTabProps> = ({ geoAlarms, circles }) => {
  const [severityFilter, setSeverityFilter] = useState<string>('All');
  const [circleFilter, setCircleFilter] = useState<string>('All');

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Filtered alarms
  const filteredAlarms = useMemo(() => {
    return geoAlarms.filter((alarm) => {
      const matchSev = severityFilter === 'All' || alarm.severity === severityFilter;
      const matchCircle = circleFilter === 'All' || alarm.circle === circleFilter;
      return matchSev && matchCircle;
    });
  }, [geoAlarms, severityFilter, circleFilter]);

  // Counts by severity in current filter
  const severityBreakdown = useMemo(() => {
    const counts: Record<string, number> = { Critical: 0, Major: 0, Minor: 0, Warning: 0 };
    filteredAlarms.forEach((a) => {
      if (counts[a.severity] !== undefined) {
        counts[a.severity]++;
      }
    });
    return counts;
  }, [filteredAlarms]);

  // Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on India
    const map = L.map(mapContainerRef.current, {
      center: [22.0, 78.9629],
      zoom: 4.5,
      minZoom: 3,
      maxZoom: 15,
      zoomControl: true,
      attributionControl: false,
    });

    // CartoDB Positron / Voyager dark tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    layerGroupRef.current = layerGroup;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  // Update Markers when filtered alarms change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    if (filteredAlarms.length === 0) return;

    const bounds = L.latLngBounds([]);
    // Limit to max 1200 markers on screen to maintain 60FPS
    const displaySlice = filteredAlarms.slice(0, 1200);

    displaySlice.forEach((a) => {
      const color = SEVERITY_COLORS[a.severity] || '#64748b';
      const marker = L.circleMarker([a.latitude, a.longitude], {
        radius: a.severity === 'Critical' ? 7 : 5.5,
        fillColor: color,
        color: '#0f172a',
        weight: 1.5,
        opacity: 0.9,
        fillOpacity: 0.85,
      });

      const popupHtml = `
        <div style="font-family: inherit; font-size: 13px; line-height: 1.4;">
          <div style="font-weight: 700; color: #fff; margin-bottom: 4px; font-size: 14px;">
            ${a.alarm_type}
          </div>
          <div style="margin-bottom: 6px;">
            <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 600; background: ${color}25; color: ${color}; border: 1px solid ${color}60;">
              ${a.severity}
            </span>
          </div>
          <div style="color: #94a3b8; font-size: 12px; margin-top: 4px;">
            <div><strong>Node:</strong> ${a.network_node}</div>
            <div><strong>Location:</strong> ${a.city}, ${a.circle}</div>
            <div><strong>Affected Customers:</strong> ${(a.affected_customers || 0).toLocaleString()}</div>
            <div><strong>Duration:</strong> ${a.duration_minutes || 0} mins</div>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      layerGroup.addLayer(marker);
      bounds.extend([a.latitude, a.longitude]);
    });

    if (circleFilter !== 'All' && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 });
    } else if (circleFilter === 'All') {
      map.setView([22.0, 78.9629], 4.5);
    }
  }, [filteredAlarms, circleFilter]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Geospatial Alarm Mapping</h2>
        <p className="text-sm text-slate-400 mt-1">
          Visualize the geographical distribution of network alarms across circles and cities.
        </p>
      </div>

      {/* Filter Controls */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="select-severity-filter" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-red-500" />
              Filter by Severity
            </label>
            <select
              id="select-severity-filter"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="Major">Major</option>
              <option value="Minor">Minor</option>
              <option value="Warning">Warning</option>
            </select>
          </div>

          <div>
            <label htmlFor="select-circle-filter" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-blue-400" />
              Filter by State/Circle
            </label>
            <select
              id="select-circle-filter"
              value={circleFilter}
              onChange={(e) => setCircleFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="All">All Circles</option>
              {circles.map((circle) => (
                <option key={circle} value={circle}>
                  {circle}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Filter Summary Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-700/60 text-xs">
          <div className="text-slate-300">
            Showing <strong className="text-white font-mono">{filteredAlarms.length.toLocaleString()}</strong> alarms
            {filteredAlarms.length > 1200 && (
              <span className="text-slate-400 text-xs ml-1">(rendering top 1,200 markers for performance)</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {(['Critical', 'Major', 'Minor', 'Warning'] as SeverityLevel[]).map((sev) => (
              <div key={sev} className="flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: SEVERITY_COLORS[sev] }}
                />
                <span className="text-slate-300">{sev}:</span>
                <span className="font-semibold text-white">{severityBreakdown[sev]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3 shadow-xl">
        {filteredAlarms.length === 0 ? (
          <div className="h-[600px] flex flex-col items-center justify-center text-slate-400">
            <AlertCircle className="h-10 w-10 text-amber-500 mb-2" />
            <p className="text-base font-medium text-slate-200">No alarms found matching the selected filters.</p>
            <p className="text-xs text-slate-400 mt-1">Try resetting severity or state/circle to 'All'.</p>
          </div>
        ) : (
          <div className="relative h-[600px] w-full rounded-lg overflow-hidden border border-slate-700">
            <div ref={mapContainerRef} className="h-full w-full" />
            {/* Map Legend Floating Box */}
            <div className="absolute bottom-4 right-4 z-[1000] bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-lg p-3 text-xs shadow-xl pointer-events-auto">
              <div className="font-semibold text-slate-200 mb-2">Severity Legend</div>
              <div className="space-y-1.5">
                {(['Critical', 'Major', 'Minor', 'Warning'] as SeverityLevel[]).map((sev) => (
                  <div key={sev} className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: SEVERITY_COLORS[sev] }}
                    />
                    <span className="text-slate-300">{sev}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
