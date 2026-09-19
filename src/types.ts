export type SeverityLevel = 'Critical' | 'Major' | 'Minor' | 'Warning';

export interface OverviewData {
  totalAlarms: number;
  totalComplaints: number;
  uniqueNodes: number;
  totalAffectedCustomers: number;
  dailyAlarmFrequency: { date: string; count: number }[];
  regionCounts: { Region: string; Count: number }[];
  severityCounts: { Severity: SeverityLevel; Count: number }[];
  topAlarmTypes: { type: string; count: number }[];
}

export interface GeoAlarm {
  id: string;
  alarm_type: string;
  severity: SeverityLevel;
  network_node: string;
  circle: string;
  city: string;
  latitude: number;
  longitude: number;
  affected_customers: number;
  duration_minutes: number;
}

export interface AlarmRecord {
  alarm_id: string;
  alarm_timestamp?: string;
  alarm_type: string;
  severity: SeverityLevel;
  technology: string;
  region: string;
  circle: string;
  city: string;
  network_node: string;
  router_id?: string;
  root_cause: string;
  affected_customers: number;
  weather_condition: string;
  power_status: string;
  duration_minutes: number;
  previous_alarm?: string;
  next_alarm?: string;
}

export interface ComplaintRecord {
  complaint_id: string;
  customer_id: string;
  complaint_time: string;
  network_node_comp: string;
  network_node_alarm?: string;
  related_alarm_id: string;
  complaint_type: string;
  technology: string;
  signal_strength_dbm: number;
  download_speed_mbps: number;
  latency_ms: number;
  customer_priority: string;
  status: string;
  region_comp: string;
  circle: string;
  city: string;
  alarm_id: string;
  alarm_type: string;
  severity: SeverityLevel;
  router_id: string;
}

export interface TransitionItem {
  nextAlarm: string;
  frequency: number;
}

export interface HistoricalContextData {
  topRegions: { Region: string; Count: number }[];
  transitions: TransitionItem[];
}

export interface ModelAndContextData {
  historicalContext: Record<string, HistoricalContextData>;
  rcModelRules: Record<string, string>;
  impactAverages: {
    bySeverity: Record<SeverityLevel, number>;
    byType: Record<string, number>;
  };
  dropdownOptions: {
    alarmTypes: string[];
    severities: SeverityLevel[];
    technologies: string[];
    weatherConditions: string[];
    powerStatuses: string[];
    rootCauses: string[];
    regions: string[];
    circles: string[];
  };
}
