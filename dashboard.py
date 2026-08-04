import streamlit as st
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import networkx as nx
import plotly.express as px
import joblib
import os
from datetime import datetime, timedelta

st.set_page_config(page_title="Telecom Network Operations Center", layout="wide", page_icon="📡")


st.markdown("""
<style>
    /* Headers and text */
    h1 {
        border-bottom: 3px solid #E50000;
        padding-bottom: 10px;
        margin-bottom: 20px;
    }
    
    /* Metric Cards */
    [data-testid="stMetricValue"] {
        font-size: 2.2rem;
        font-weight: 800;
    }
    [data-testid="stMetricLabel"] {
        font-weight: 600;
        font-size: 1.1rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    div[data-testid="metric-container"] {
        border-left: 5px solid #E50000;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        transition: transform 0.2s ease;
    }
    div[data-testid="metric-container"]:hover {
        transform: translateY(-5px);
        box-shadow: 0 6px 15px rgba(229, 0, 0, 0.3);
    }
    
    /* Primary Button styling */
    .stButton>button {
        border-radius: 6px !important;
        padding: 0.5rem 1.5rem !important;
        font-weight: bold !important;
        box-shadow: 0 4px 6px rgba(229, 0, 0, 0.2) !important;
        transition: all 0.3s ease !important;
    }
    .stButton>button:hover {
        box-shadow: 0 6px 8px rgba(229, 0, 0, 0.4) !important;
        transform: translateY(-2px) !important;
    }
    
    /* Dataframes and Tables */
    .stDataFrame {
        border-radius: 8px;
    }
</style>
""", unsafe_allow_html=True)

st.title("📡 Telecom Network Operations Center")


@st.cache_data
def load_data():
    alarms = pd.read_excel('alarm.xlsx')
    complaints = pd.read_excel('complain.xlsx')
    alarms['alarm_timestamp'] = pd.to_datetime(alarms['alarm_timestamp'])
    return alarms, complaints

alarms, complaints = load_data()

@st.cache_resource
def load_models():
    if os.path.exists('models/root_cause_model.pkl'):
        rc_model = joblib.load('models/root_cause_model.pkl')
        rc_le = joblib.load('models/rc_label_encoders.pkl')
        imp_model = joblib.load('models/impact_model.pkl')
        imp_le = joblib.load('models/impact_label_encoders.pkl')
        return rc_model, rc_le, imp_model, imp_le
    return None, None, None, None

rc_model, rc_le, imp_model, imp_le = load_models()


tab1, tab_geo, tab3, tab4 = st.tabs([
    "Overview", 
    "Geospatial Map", 
    "Root Cause & Impact Forecasting", 
    "Complaint Correlation"
])

with tab1:
    st.header("Network Overview")
    
    
    col1, col2, col3, col4 = st.columns(4)
    col1.metric("Total Alarms", f"{len(alarms):,}")
    col2.metric("Total Complaints", f"{len(complaints):,}")
    col3.metric("Unique Nodes", f"{alarms['network_node'].nunique():,}")
    affected_cust = int(alarms['affected_customers'].sum()) if 'affected_customers' in alarms.columns else 0
    col4.metric("Total Affected Customers", f"{affected_cust:,}")
    
    st.divider()
    
    
    c_left, c_right = st.columns(2)
    
    with c_left:
        
        st.subheader("Alarms Over Time")
        time_counts = alarms.set_index('alarm_timestamp').resample('D').size().reset_index(name='count')
        fig_time = px.area(time_counts, x='alarm_timestamp', y='count', title="Daily Alarm Frequency", 
                           color_discrete_sequence=['#ff4b4b'])
        fig_time.update_layout(xaxis_title="Date", yaxis_title="Number of Alarms", template='plotly_dark')
        st.plotly_chart(fig_time, use_container_width=True)
        
        
        st.subheader("Alarms by Region")
        if 'region' in alarms.columns:
            region_counts = alarms['region'].value_counts().reset_index()
            region_counts.columns = ['Region', 'Count']
            fig_reg = px.bar(region_counts, x='Region', y='Count', color='Count', color_continuous_scale='Reds',
                             title="Distribution by Region")
            st.plotly_chart(fig_reg, use_container_width=True)
            
    with c_right:
        
        st.subheader("Severity Breakdown")
        sev_counts = alarms['severity'].value_counts().reset_index()
        sev_counts.columns = ['Severity', 'Count']
        fig_sev = px.pie(sev_counts, names='Severity', values='Count', hole=0.4, 
                         color='Severity', color_discrete_map={'Critical':'red', 'Major':'orange', 'Minor':'yellow', 'Warning':'blue'})
        st.plotly_chart(fig_sev, use_container_width=True)
        
        
        st.subheader("Top 10 Alarm Types")
        type_counts = alarms['alarm_type'].value_counts().head(10).reset_index()
        type_counts.columns = ['Alarm Type', 'Count']
        fig_type = px.bar(type_counts, x='Count', y='Alarm Type', orientation='h', color='Count', color_continuous_scale='Blues')
        fig_type.update_layout(yaxis={'categoryorder':'total ascending'})
        st.plotly_chart(fig_type, use_container_width=True)

    st.divider()
    st.subheader("Export Data")
    csv_alarms = alarms.to_csv(index=False).encode('utf-8')
    st.download_button(
        label="Download Full Alarms Dataset (CSV)",
        data=csv_alarms,
        file_name='alarms_export.csv',
        mime='text/csv',
    )

with tab_geo:
    st.header("Geospatial Alarm Mapping")
    st.write("Visualize the geographical distribution of network alarms.")
    
    if 'latitude' in alarms.columns and 'longitude' in alarms.columns:
        
        map_df = alarms.dropna(subset=['latitude', 'longitude'])
        
        col_f1, col_f2 = st.columns(2)
        with col_f1:
            
            sev_filter = st.selectbox("Filter by Severity:", ["All"] + list(map_df['severity'].unique()))
        with col_f2:
            
            if 'circle' in map_df.columns:
                state_filter = st.selectbox("Filter by State/Circle:", ["All"] + sorted(list(map_df['circle'].dropna().unique())))
            else:
                state_filter = "All"
                
        if sev_filter != "All":
            map_df = map_df[map_df['severity'] == sev_filter]
        if state_filter != "All":
            map_df = map_df[map_df['circle'] == state_filter]
            
        if map_df.empty:
            st.warning("No data available for the selected filters.")
        else:
            
            color_map = {'Critical': 'red', 'Major': 'orange', 'Minor': 'yellow', 'Warning': 'blue'}
            map_df['color'] = map_df['severity'].map(color_map).fillna('gray')
            
            
            zoom_level = 5 if state_filter != "All" else 4
            
            fig_map = px.scatter_mapbox(
                map_df, 
                lat="latitude", 
                lon="longitude", 
                color="severity",
                color_discrete_map=color_map,
                hover_name="alarm_type", 
                hover_data=["network_node", "affected_customers", "duration_minutes", "circle"],
                zoom=zoom_level, 
                height=600,
                title="Alarm Locations"
            )
            fig_map.update_layout(mapbox_style="carto-positron", margin={"r":0,"t":40,"l":0,"b":0})
            st.plotly_chart(fig_map, use_container_width=True)
    else:
        st.warning("Latitude and Longitude data not found in the dataset.")

with tab3:
    st.header("Root Cause & Downstream Impact Prediction")
    if rc_model is None:
        st.warning("Models not found. Please run the Jupyter Notebook first to train and save the models.")
    else:
        st.write("Predict the underlying root cause and forecast the number of affected customers.")
        
        pred_mode = st.radio("Input Method", ["Search by Alarm ID", "Manual Input"])
        
        if pred_mode == "Search by Alarm ID":
            search_id = st.text_input("Enter Alarm ID (e.g., ALM-10001 or ALM-001)")
            if st.button("Search"):
                alarm_record = alarms[alarms['alarm_id'].astype(str) == str(search_id)]
                if alarm_record.empty:
                    st.error("Alarm ID not found.")
                else:
                    rec = alarm_record.iloc[0]
                    st.success("Alarm Found!")
                    
                    c1, c2, c3 = st.columns(3)
                    with c1:
                        st.write(f"**Region:** {rec.get('region', 'N/A')}")
                        st.write(f"**Circle:** {rec.get('circle', 'N/A')}")
                        st.write(f"**City:** {rec.get('city', 'N/A')}")
                    with c2:
                        st.write(f"**Alarm Type:** {rec.get('alarm_type', 'N/A')}")
                        st.write(f"**Severity:** {rec.get('severity', 'N/A')}")
                        st.write(f"**Technology:** {rec.get('technology', 'N/A')}")
                    with c3:
                        st.write(f"**Actual Root Cause:** {rec.get('root_cause', 'N/A')}")
                        st.write(f"**Actual Affected Customers:** {rec.get('affected_customers', 'N/A')}")
                    
                    st.divider()
                    st.subheader("Model Predictions for this Alarm")
                    
                    in_type = str(rec['alarm_type'])
                    in_sev = str(rec['severity'])
                    in_tech = str(rec['technology'])
                    in_weather = str(rec['weather_condition'])
                    in_power = str(rec['power_status'])
                    in_duration = float(rec['duration_minutes'])
                    
                    try:
                        x_rc = pd.DataFrame({
                            'alarm_type': [rc_le['alarm_type'].transform([in_type])[0]],
                            'severity': [rc_le['severity'].transform([in_sev])[0]],
                            'technology': [rc_le['technology'].transform([in_tech])[0]],
                            'weather_condition': [rc_le['weather_condition'].transform([in_weather])[0]],
                            'power_status': [rc_le['power_status'].transform([in_power])[0]]
                        })
                        rc_pred = rc_le['root_cause'].inverse_transform([rc_model.predict(x_rc)[0]])[0]
                        
                        x_imp = pd.DataFrame({
                            'alarm_type': [imp_le['alarm_type'].transform([in_type])[0]],
                            'severity': [imp_le['severity'].transform([in_sev])[0]],
                            'technology': [imp_le['technology'].transform([in_tech])[0]],
                            'weather_condition': [imp_le['weather_condition'].transform([in_weather])[0]],
                            'power_status': [imp_le['power_status'].transform([in_power])[0]],
                            'duration_minutes': [in_duration]
                        })
                        imp_pred = imp_model.predict(x_imp)[0]
                        
                        st.info(f"**Predicted Root Cause:** {rc_pred}")
                        st.info(f"**Forecasted Affected Customers:** {int(imp_pred)}")
                    except Exception as e:
                        st.error(f"Error making prediction: {str(e)}")
                        
                    st.divider()
                    st.subheader("Affected Customers (Complaints)")
                    affected_complaints = complaints[complaints['related_alarm_id'].astype(str) == str(search_id)]
                    if not affected_complaints.empty:
                        customer_cols = ['customer_id', 'customer_priority', 'region', 'circle', 'city', 'complaint_type', 'signal_strength_dbm', 'download_speed_mbps', 'latency_ms', 'status']
                        available_cols = [col for col in customer_cols if col in affected_complaints.columns]
                        st.dataframe(affected_complaints[available_cols], use_container_width=True)
                    else:
                        st.write("No direct customer complaints found linked to this Alarm ID.")
                        
        else:
            col1, col2 = st.columns(2)
            with col1:
                in_type = st.selectbox("Alarm Type", rc_le['alarm_type'].classes_)
                in_sev = st.selectbox("Severity", rc_le['severity'].classes_)
                in_tech = st.selectbox("Technology", rc_le['technology'].classes_)
            with col2:
                in_weather = st.selectbox("Weather Condition", rc_le['weather_condition'].classes_)
                in_power = st.selectbox("Power Status", rc_le['power_status'].classes_)
                in_duration = st.number_input("Duration (Minutes)", value=60.0)
                
            if st.button("Predict"):
                try:
                    x_rc = pd.DataFrame({
                        'alarm_type': [rc_le['alarm_type'].transform([in_type])[0]],
                        'severity': [rc_le['severity'].transform([in_sev])[0]],
                        'technology': [rc_le['technology'].transform([in_tech])[0]],
                        'weather_condition': [rc_le['weather_condition'].transform([in_weather])[0]],
                        'power_status': [rc_le['power_status'].transform([in_power])[0]]
                    })
                    rc_pred = rc_le['root_cause'].inverse_transform([rc_model.predict(x_rc)[0]])[0]
                    
                    x_imp = pd.DataFrame({
                        'alarm_type': [imp_le['alarm_type'].transform([in_type])[0]],
                        'severity': [imp_le['severity'].transform([in_sev])[0]],
                        'technology': [imp_le['technology'].transform([in_tech])[0]],
                        'weather_condition': [imp_le['weather_condition'].transform([in_weather])[0]],
                        'power_status': [imp_le['power_status'].transform([in_power])[0]],
                        'duration_minutes': [in_duration]
                    })
                    imp_pred = imp_model.predict(x_imp)[0]
                    
                    st.success(f"**Predicted Root Cause:** {rc_pred}")
                    st.info(f"**Forecasted Affected Customers:** {int(imp_pred)}")
                    
                    st.divider()
                    st.subheader(f"Historical Context for '{in_type}'")
                    historical_subset = alarms[alarms['alarm_type'] == in_type]
                    
                    if not historical_subset.empty:
                        col_h1, col_h2 = st.columns(2)
                        with col_h1:
                            st.write("**Top Regions for this Alarm:**")
                            if 'region' in historical_subset.columns:
                                reg_df = historical_subset['region'].value_counts().head(5).reset_index()
                                reg_df.columns = ['Region', 'Count']
                                st.plotly_chart(px.bar(reg_df, x='Count', y='Region', orientation='h', color='Count'), use_container_width=True)
                            else:
                                st.write("Region data not available.")
                        with col_h2:
                            st.write("**Most Likely Next Alarm:**")
                            temp_hist = alarms.sort_values(by=['network_node', 'alarm_timestamp'])
                            temp_hist['next_alarm'] = temp_hist.groupby('network_node')['alarm_type'].shift(-1)
                            transitions = temp_hist[temp_hist['alarm_type'] == in_type]['next_alarm'].dropna()
                            if not transitions.empty:
                                trans_df = transitions.value_counts().head(5).reset_index()
                                trans_df.columns = ['Next Alarm', 'Frequency']
                                st.plotly_chart(px.bar(trans_df, x='Frequency', y='Next Alarm', orientation='h', color='Frequency'), use_container_width=True)
                            else:
                                st.write("No subsequent alarms found.")
                    else:
                        st.write("No historical data available for this alarm type.")
                except Exception as e:
                    st.error(f"Error making prediction: {str(e)}")

with tab4:
    st.header("Complaint Correlation")
    st.write("Link network issues to customer experience by matching complaints to alarms.")
    
    joined = pd.merge(complaints, alarms, left_on='related_alarm_id', right_on='alarm_id', how='left', suffixes=('_comp', '_alarm'))
    
    st.write("### Search Customer Complaints")
    search_by = st.selectbox("Search By:", ["Alarm ID", "Alarm Type", "Network Node", "Router ID", "Customer ID", "Complaint Type", "Status", "Region"])
    search_val = st.text_input(f"Enter {search_by}")
    
    if search_val:
        if search_by == "Alarm ID":
            res = joined[joined['alarm_id'].astype(str).str.contains(search_val, case=False, na=False)]
        elif search_by == "Alarm Type":
            res = joined[joined['alarm_type'].astype(str).str.contains(search_val, case=False, na=False)]
        elif search_by == "Network Node":
            res = joined[joined['network_node_comp'].astype(str).str.contains(search_val, case=False, na=False) | joined['network_node_alarm'].astype(str).str.contains(search_val, case=False, na=False)]
        elif search_by == "Router ID":
            res = joined[joined['router_id'].astype(str).str.contains(search_val, case=False, na=False)]
        elif search_by == "Customer ID":
            res = joined[joined['customer_id'].astype(str).str.contains(search_val, case=False, na=False)]
        elif search_by == "Complaint Type":
            res = joined[joined['complaint_type'].astype(str).str.contains(search_val, case=False, na=False)]
        elif search_by == "Status":
            res = joined[joined['status'].astype(str).str.contains(search_val, case=False, na=False)]
        elif search_by == "Region":
            res = joined[joined['region_comp'].astype(str).str.contains(search_val, case=False, na=False)]
            
        st.write(f"**Found {len(res)} complaints matching {search_by} = '{search_val}'**")
        if not res.empty:
            cols_to_show = ['customer_id', 'complaint_type', 'status', 'region_comp', 'alarm_id', 'alarm_type', 'network_node_comp', 'router_id']
            cols_to_show = [c for c in cols_to_show if c in res.columns]
            st.dataframe(res[cols_to_show], use_container_width=True)
            
    st.divider()
    
    if len(joined) == 0:
        st.warning("No explicit links found using `related_alarm_id`.")
    else:
        st.write("### Filter Complaints by Region")
        regions = ["All Regions"] + list(joined['region_comp'].dropna().unique())
        sel_region = st.selectbox("Select Region", regions)
        if sel_region != "All Regions":
            joined = joined[joined['region_comp'] == sel_region]
            
        st.metric("Total Matched Complaints", len(joined))
        
        col1, col2 = st.columns(2)
        with col1:
            st.subheader("Complaints by Alarm Type")
            complaints_by_alarm = joined['alarm_type'].value_counts().head(10).reset_index()
            complaints_by_alarm.columns = ['Alarm Type', 'Complaints']
            fig_ca = px.bar(complaints_by_alarm, x='Complaints', y='Alarm Type', orientation='h', 
                            color='Complaints', color_continuous_scale='Magma')
            fig_ca.update_layout(yaxis={'categoryorder':'total ascending'})
            st.plotly_chart(fig_ca, use_container_width=True)
            
        with col2:
            st.subheader("Complaints by Alarm Severity")
            complaints_by_sev = joined['severity'].value_counts().reset_index()
            complaints_by_sev.columns = ['Severity', 'Complaints']
            fig_cs = px.pie(complaints_by_sev, names='Severity', values='Complaints', hole=0.5,
                            color='Severity', color_discrete_map={'Critical':'red', 'Major':'orange', 'Minor':'yellow', 'Warning':'blue'})
            st.plotly_chart(fig_cs, use_container_width=True)
            
        st.divider()
        st.subheader("Export Filtered Complaints")
        csv_comp = joined.to_csv(index=False).encode('utf-8')
        st.download_button(
            label="Download Filtered Complaints (CSV)",
            data=csv_comp,
            file_name='complaints_filtered.csv',
            mime='text/csv',
        )
