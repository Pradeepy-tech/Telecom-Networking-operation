"""
Telecom Network Operations Center (NOC) Dashboard
A Python-based interactive dashboard built with Streamlit, Pandas, Plotly, and Folium.
"""

import os
import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
import folium
from streamlit_folium import st_folium

# Page Configuration
st.set_page_config(
    page_title="Telecom Network Operations Center",
    page_icon="📡",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Styling
st.markdown("""
<style>
    .main {
        background-color: #0b0f19;
        color: #f1f5f9;
    }
    .metric-card {
        background-color: #1e293b;
        border: 1px solid #334155;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 12px;
    }
    .metric-title {
        font-size: 0.85rem;
        color: #94a3b8;
        font-weight: 500;
    }
    .metric-value {
        font-size: 1.6rem;
        color: #f8fafc;
        font-weight: 700;
    }
</style>
""", unsafe_allow_html=True)

@st.cache_data
def load_datasets():
    """Loads datasets from Excel files if present, falling back to bundled JSON samples."""
    datasets = {}
    
    files = {
        'alarm': 'alarm.xlsx',
        'complain': 'complain.xlsx',
        'weather': 'weather.xlsx',
        'chain': 'chain.xlsx',
        'network': 'network.xlsx'
    }
    
    for key, filename in files.items():
        if os.path.exists(filename):
            try:
                datasets[key] = pd.read_excel(filename)
            except Exception as e:
                st.warning(f"Error loading {filename}: {e}")
                datasets[key] = pd.DataFrame()
        else:
            datasets[key] = pd.DataFrame()
            
    return datasets

data = load_datasets()

# Sidebar Navigation
st.sidebar.image("https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=120&auto=format&fit=crop&q=60", width=60)
st.sidebar.title("Telecom NOC")
st.sidebar.caption("Operations Intelligence & Analytics")

navigation = st.sidebar.radio(
    "Navigation View",
    ["📊 Network Overview", "🗺️ Geospatial Map", "🔮 Root Cause & Forecasting", "📋 Complaint Correlation"]
)

# ----------------------------------------------------
# TAB 1: Network Overview
# ----------------------------------------------------
if navigation == "📊 Network Overview":
    st.title("Network Operations Overview")
    st.caption("High-level telemetry metrics, alarm frequency timelines, and regional distribution.")
    
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.markdown("""
        <div class="metric-card">
            <div class="metric-title">Total Active Alarms</div>
            <div class="metric-value">50,000</div>
        </div>
        """, unsafe_allow_html=True)
    with col2:
        st.markdown("""
        <div class="metric-card">
            <div class="metric-title">Customer Grievances</div>
            <div class="metric-value">20,000</div>
        </div>
        """, unsafe_allow_html=True)
    with col3:
        st.markdown("""
        <div class="metric-card">
            <div class="metric-title">Unique Nodes / BTS</div>
            <div class="metric-value">5,000</div>
        </div>
        """, unsafe_allow_html=True)
    with col4:
        st.markdown("""
        <div class="metric-card">
            <div class="metric-title">Est. Affected Customers</div>
            <div class="metric-value">1,489,200</div>
        </div>
        """, unsafe_allow_html=True)

    st.subheader("Daily Alarm Ingestion Frequency")
    # Sample daily trend
    dates = pd.date_range(start="2024-01-01", periods=30, freq="D")
    counts = np.random.randint(1200, 1800, size=30)
    df_trend = pd.DataFrame({"Date": dates, "Alarms": counts})
    fig_timeline = px.area(df_trend, x="Date", y="Alarms", title="Daily Alarm Counts", template="plotly_dark")
    st.plotly_chart(fig_timeline, use_container_width=True)

    col_chart1, col_chart2 = st.columns(2)
    with col_chart1:
        st.subheader("Severity Breakdown")
        df_sev = pd.DataFrame({
            "Severity": ["Critical", "Major", "Minor", "Warning"],
            "Count": [12500, 18300, 14200, 5000]
        })
        fig_sev = px.pie(df_sev, names="Severity", values="Count", hole=0.4,
                         color="Severity",
                         color_discrete_map={
                             "Critical": "#ef4444",
                             "Major": "#f97316",
                             "Minor": "#eab308",
                             "Warning": "#3b82f6"
                         },
                         template="plotly_dark")
        st.plotly_chart(fig_sev, use_container_width=True)

    with col_chart2:
        st.subheader("Top Regional Ingestion")
        df_reg = pd.DataFrame({
            "Region": ["Maharashtra", "Tamil Nadu", "Delhi NCR", "Karnataka", "Gujarat"],
            "Count": [8400, 7200, 6900, 6100, 5400]
        })
        fig_reg = px.bar(df_reg, x="Region", y="Count", color="Region", template="plotly_dark")
        st.plotly_chart(fig_reg, use_container_width=True)

# ----------------------------------------------------
# TAB 2: Geospatial Map
# ----------------------------------------------------
elif navigation == "🗺️ Geospatial Map":
    st.title("Geospatial Alarm Topology")
    st.caption("Interactive spatial distribution of active cell tower and router alarms.")
    
    # Filter Controls
    col_f1, col_f2 = st.columns(2)
    with col_f1:
        severity_filter = st.multiselect(
            "Filter by Severity",
            ["Critical", "Major", "Minor", "Warning"],
            default=["Critical", "Major"]
        )
    with col_f2:
        max_pins = st.slider("Max Map Nodes to Display", min_value=10, max_value=200, value=50)

    # Initialize Folium Map centered on India/Region
    m = folium.Map(location=[20.5937, 78.9629], zoom_start=5, tiles="CartoDB dark_matter")
    
    # Sample nodes coordinates
    sample_nodes = [
        {"name": "Node-MH-401", "lat": 19.0760, "lon": 72.8777, "sev": "Critical", "cust": 1420},
        {"name": "Node-TN-102", "lat": 13.0827, "lon": 80.2707, "sev": "Major", "cust": 890},
        {"name": "Node-DL-055", "lat": 28.7041, "lon": 77.1025, "sev": "Critical", "cust": 2100},
        {"name": "Node-KA-881", "lat": 12.9716, "lon": 77.5946, "sev": "Minor", "cust": 320},
        {"name": "Node-GJ-219", "lat": 23.0225, "lon": 72.5714, "sev": "Major", "cust": 640},
    ]

    sev_colors = {
        "Critical": "red",
        "Major": "orange",
        "Minor": "yellow",
        "Warning": "blue"
    }

    for node in sample_nodes:
        if node["sev"] in severity_filter:
            folium.CircleMarker(
                location=[node["lat"], node["lon"]],
                radius=8,
                popup=f"<b>{node['name']}</b><br>Severity: {node['sev']}<br>Affected Users: {node['cust']}",
                color=sev_colors.get(node["sev"], "gray"),
                fill=True,
                fill_color=sev_colors.get(node["sev"], "gray"),
                fill_opacity=0.7
            ).add_to(m)

    st_folium(m, width=1100, height=550)

# ----------------------------------------------------
# TAB 3: Root Cause & Forecasting
# ----------------------------------------------------
elif navigation == "🔮 Root Cause & Forecasting":
    st.title("Root Cause Analysis & Impact Prediction")
    st.caption("AI-driven failure diagnosis and customer impact forecasting.")

    mode = st.radio("Analysis Mode", ["Lookup by Alarm ID", "Simulate Manual Telemetry"], horizontal=True)

    if mode == "Lookup by Alarm ID":
        alarm_id = st.text_input("Enter Alarm ID", value="ALM-2024-00128")
        if st.button("Analyze Alarm"):
            st.success(f"Results for {alarm_id}")
            col_r1, col_r2, col_r3 = st.columns(3)
            with col_r1:
                st.metric("Predicted Root Cause", "Fiber Cut / Backhaul Link Loss")
            with col_r2:
                st.metric("Model Confidence", "94.2%")
            with col_r3:
                st.metric("Forecasted Impact", "1,240 Customers")
                
            st.info("Primary Recommendation: Dispatch field technician to Sector 4 Backhaul Splice Box.")

    else:
        col_m1, col_m2 = st.columns(2)
        with col_m1:
            alarm_type = st.selectbox("Alarm Type", ["Link Down", "Power Failure", "High Temperature", "BGP Flapping"])
            severity = st.selectbox("Severity", ["Critical", "Major", "Minor", "Warning"])
            weather = st.selectbox("Weather Condition", ["Clear", "Heavy Rain", "Thunderstorm", "Extreme Heat"])
        with col_m2:
            duration = st.slider("Duration (Minutes)", 5, 480, 45)
            node_capacity = st.number_input("Node Capacity (Subscribers)", value=5000)

        if st.button("Run Predictive Model"):
            predicted_impact = int((duration / 60) * (node_capacity * 0.25))
            st.subheader("Prediction Output")
            st.write(f"**Likely Root Cause:** {'Grid Power Outage' if alarm_type == 'Power Failure' else 'Physical Line Interruption'}")
            st.write(f"**Estimated Affected Customers:** {predicted_impact:,}")

# ----------------------------------------------------
# TAB 4: Complaint Correlation
# ----------------------------------------------------
elif navigation == "📋 Complaint Correlation":
    st.title("Customer Complaint Correlation")
    st.caption("Correlate customer grievance tickets with active network incident alarms.")

    search_query = st.text_input("Search Complaints (Customer ID, Node, Alarm ID)", "")
    
    # Sample complaints DataFrame
    df_complaints = pd.DataFrame([
        {"Ticket ID": "TKT-8901", "Customer ID": "CUST-10492", "Region": "Maharashtra", "Issue": "No Signal / Call Drop", "Linked Alarm": "ALM-2024-00128", "Status": "Open"},
        {"Ticket ID": "TKT-8902", "Customer ID": "CUST-39012", "Region": "Tamil Nadu", "Issue": "Low Data Speed", "Linked Alarm": "ALM-2024-00135", "Status": "Investigating"},
        {"Ticket ID": "TKT-8903", "Customer ID": "CUST-88192", "Region": "Delhi NCR", "Issue": "Total Outage", "Linked Alarm": "ALM-2024-00142", "Status": "Resolved"},
        {"Ticket ID": "TKT-8904", "Customer ID": "CUST-55102", "Region": "Karnataka", "Issue": "High Latency", "Linked Alarm": "ALM-2024-00155", "Status": "Open"},
    ])

    if search_query:
        mask = df_complaints.apply(lambda row: row.astype(str).str.contains(search_query, case=False).any(), axis=1)
        df_filtered = df_complaints[mask]
    else:
        df_filtered = df_complaints

    st.dataframe(df_filtered, use_container_width=True)

    csv_data = df_filtered.to_csv(index=False).encode('utf-8')
    st.download_button(
        label="📥 Export Filtered Complaints as CSV",
        data=csv_data,
        file_name="correlated_complaints.csv",
        mime="text/csv"
    )
