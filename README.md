# Telecom Network Operations Center (NOC)

A modern, high-performance web dashboard for Telecom Network Operations Center intelligence, migrated to Node.js & React with Vite and Tailwind CSS.

## Key Features

1. **Network Overview**:
   - Real-time operational metric cards: Total Alarms, Total Complaints, Unique Nodes, Total Affected Customers.
   - Interactive daily alarm frequency timeline (Area Chart).
   - Regional alarm distributions and severity classification (Donut & Bar Charts).
   - Top 10 recurring alarm types.
   - CSV dataset export.

2. **Geospatial Alarm Mapping**:
   - Interactive spatial mapping using CartoDB tiles and Leaflet.
   - Circle/State and Severity level filters (Critical, Major, Minor, Warning).
   - Node telemetry popup inspections with location, duration, and customer impact metrics.

3. **Root Cause & Impact Forecasting**:
   - **Search by Alarm ID**: Look up any alarm record to view geography, telemetry, ground-truth root cause, machine learning inferences, and directly linked customer grievances.
   - **Manual Input Mode**: Input custom parameters (Alarm Type, Severity, Technology, Weather Condition, Power Status, Duration) to predict root cause and forecast affected customers.
   - **Historical Context & Alarm Chains**: Visualizes regional distribution and subsequent causal chain transition probabilities.

4. **Complaint Correlation**:
   - Match and search customer complaints across Alarm ID, Alarm Type, Node, Router, Customer ID, Status, or Region.
   - Regional grievance filtering with dynamic grievance severity and alarm-type breakdowns.
   - Filtered complaint CSV export.

## Development & Build

```bash
# Start development server on port 3000
npm run dev

# Build for production
npm run build

# Run TypeScript validation
npm run lint
```
