"""
SureAnchor — CSV to Azure SQL Database Upload Script
=====================================================
Uploads all 17 CSV files to Azure SQL in correct FK order.

Requirements:
    pip install pyodbc pandas python-dotenv

Setup:
    Create a .env file in the same directory with:
        AZURE_SQL_SERVER=your-server.database.windows.net
        AZURE_SQL_DATABASE=SureAnchorDB
        AZURE_SQL_USERNAME=your-admin-username
        AZURE_SQL_PASSWORD=your-password

Usage:
    python upload_data.py
    python upload_data.py --table safehouses      # upload one table only
    python upload_data.py --dry-run               # validate CSVs without uploading
"""

import os
import sys
import argparse
import pandas as pd
import pyodbc
from dotenv import load_dotenv

load_dotenv()

# ── Connection ────────────────────────────────────────────────────────────────

def get_connection():
    server   = os.environ["AZURE_SQL_SERVER"]
    database = os.environ["AZURE_SQL_DATABASE"]
    username = os.environ["AZURE_SQL_USERNAME"]
    password = os.environ["AZURE_SQL_PASSWORD"]
    conn_str = (
        f"DRIVER={{ODBC Driver 18 for SQL Server}};"
        f"SERVER={server};"
        f"DATABASE={database};"
        f"UID={username};"
        f"PWD={password};"
        f"Encrypt=yes;"
        f"TrustServerCertificate=no;"
        f"Connection Timeout=30;"
    )
    return pyodbc.connect(conn_str)


# ── Column cleaning helpers ───────────────────────────────────────────────────

def to_bit(val):
    """Convert True/False strings or booleans to 1/0 for SQL BIT columns."""
    if pd.isna(val):
        return None
    if isinstance(val, bool):
        return 1 if val else 0
    s = str(val).strip().lower()
    return 1 if s in ("true", "1", "yes") else 0

def clean_float(val):
    if pd.isna(val) or str(val).strip() == "":
        return None
    try:
        return float(val)
    except (ValueError, TypeError):
        return None

def clean_int(val):
    if pd.isna(val) or str(val).strip() == "":
        return None
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return None

def clean_str(val, max_len=None):
    if pd.isna(val) or str(val).strip() == "":
        return None
    s = str(val).strip()
    if max_len:
        s = s[:max_len]
    return s

def clean_date(val):
    if pd.isna(val) or str(val).strip() == "":
        return None
    try:
        return pd.to_datetime(val).date()
    except Exception:
        return None

def clean_datetime(val):
    if pd.isna(val) or str(val).strip() == "":
        return None
    try:
        return pd.to_datetime(val).to_pydatetime()
    except Exception:
        return None


# ── Table upload definitions ──────────────────────────────────────────────────
# Each entry: (csv_filename, sql_table_name, transform_function)
# Tables are listed in FK-safe insertion order.

CSV_DIR = os.path.join(os.path.dirname(__file__), "csv")


def load_csv(filename):
    path = os.path.join(CSV_DIR, filename)
    return pd.read_csv(path, dtype=str, keep_default_na=False, na_values=[""])


# ── Transform functions (one per table) ──────────────────────────────────────

def transform_safehouses(df):
    rows = []
    for _, r in df.iterrows():
        rows.append((
            clean_int(r["safehouse_id"]),
            clean_str(r["safehouse_code"], 20),
            clean_str(r["name"], 200),
            clean_str(r["region"], 100),
            clean_str(r["city"], 100),
            clean_str(r["province"], 100),
            clean_str(r.get("country", "Philippines"), 100) or "Philippines",
            clean_date(r["open_date"]),
            clean_str(r["status"], 20),
            clean_int(r["capacity_girls"]),
            clean_int(r["capacity_staff"]),
            clean_int(r.get("current_occupancy", 0)) or 0,
            clean_str(r.get("notes")),
        ))
    sql = """
        INSERT INTO safehouses
            (safehouse_id,safehouse_code,name,region,city,province,country,
             open_date,status,capacity_girls,capacity_staff,current_occupancy,notes)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
    """
    return sql, rows

def transform_partners(df):
    rows = []
    for _, r in df.iterrows():
        rows.append((
            clean_int(r["partner_id"]),
            clean_str(r["partner_name"], 200),
            clean_str(r["partner_type"], 50),
            clean_str(r["role_type"], 50),
            clean_str(r.get("contact_name"), 200),
            clean_str(r.get("email"), 200),
            clean_str(r.get("phone"), 50),
            clean_str(r.get("region"), 100),
            clean_str(r["status"], 20),
            clean_date(r["start_date"]),
            clean_date(r.get("end_date")),
            clean_str(r.get("notes")),
        ))
    sql = """
        INSERT INTO partners
            (partner_id,partner_name,partner_type,role_type,contact_name,email,
             phone,region,status,start_date,end_date,notes)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    """
    return sql, rows

def transform_partner_assignments(df):
    rows = []
    for _, r in df.iterrows():
        rows.append((
            clean_int(r["assignment_id"]),
            clean_int(r["partner_id"]),
            clean_int(r.get("safehouse_id")),
            clean_str(r["program_area"], 50),
            clean_date(r["assignment_start"]),
            clean_date(r.get("assignment_end")),
            clean_str(r.get("responsibility_notes")),
            to_bit(r.get("is_primary", False)),
            clean_str(r["status"], 20),
        ))
    sql = """
        INSERT INTO partner_assignments
            (assignment_id,partner_id,safehouse_id,program_area,
             assignment_start,assignment_end,responsibility_notes,is_primary,status)
        VALUES (?,?,?,?,?,?,?,?,?)
    """
    return sql, rows

def transform_residents(df):
    bool_cols = [
        "sub_cat_orphaned","sub_cat_trafficked","sub_cat_child_labor",
        "sub_cat_physical_abuse","sub_cat_sexual_abuse","sub_cat_osaec",
        "sub_cat_cicl","sub_cat_at_risk","sub_cat_street_child",
        "sub_cat_child_with_hiv","is_pwd","has_special_needs",
        "family_is_4ps","family_solo_parent","family_indigenous",
        "family_parent_pwd","family_informal_settler",
    ]
    rows = []
    for _, r in df.iterrows():
        rows.append((
            clean_int(r["resident_id"]),
            clean_str(r["case_control_no"], 20),
            clean_str(r["internal_code"], 20),
            clean_int(r["safehouse_id"]),
            clean_str(r["case_status"], 20),
            clean_str(r.get("sex", "F"), 1),
            clean_date(r.get("date_of_birth")),
            clean_str(r.get("birth_status"), 20),
            clean_str(r.get("place_of_birth"), 200),
            clean_str(r.get("religion"), 100),
            clean_str(r.get("case_category"), 50),
            *[to_bit(r.get(c, False)) for c in bool_cols],
            clean_str(r.get("pwd_type"), 200),
            clean_str(r.get("special_needs_diagnosis"), 200),
            clean_date(r.get("date_of_admission")),
            clean_str(r.get("age_upon_admission"), 50),
            clean_str(r.get("present_age"), 50),
            clean_str(r.get("length_of_stay"), 50),
            clean_str(r.get("referral_source"), 100),
            clean_str(r.get("referring_agency_person"), 200),
            clean_date(r.get("date_colb_registered")),
            clean_date(r.get("date_colb_obtained")),
            clean_str(r.get("assigned_social_worker"), 200),
            clean_str(r.get("initial_case_assessment"), 200),
            clean_date(r.get("date_case_study_prepared")),
            clean_str(r.get("reintegration_type"), 100),
            clean_str(r.get("reintegration_status"), 50),
            clean_str(r.get("initial_risk_level"), 20),
            clean_str(r.get("current_risk_level"), 20),
            clean_date(r.get("date_enrolled")),
            clean_date(r.get("date_closed")),
            clean_datetime(r.get("created_at")),
            clean_str(r.get("notes_restricted")),
        ))
    placeholders = ",".join(["?"] * 49)
    sql = f"""
        INSERT INTO residents
            (resident_id,case_control_no,internal_code,safehouse_id,case_status,sex,
             date_of_birth,birth_status,place_of_birth,religion,case_category,
             sub_cat_orphaned,sub_cat_trafficked,sub_cat_child_labor,
             sub_cat_physical_abuse,sub_cat_sexual_abuse,sub_cat_osaec,
             sub_cat_cicl,sub_cat_at_risk,sub_cat_street_child,sub_cat_child_with_hiv,
             is_pwd,has_special_needs,family_is_4ps,family_solo_parent,
             family_indigenous,family_parent_pwd,family_informal_settler,
             pwd_type,special_needs_diagnosis,
             date_of_admission,age_upon_admission,present_age,length_of_stay,
             referral_source,referring_agency_person,
             date_colb_registered,date_colb_obtained,
             assigned_social_worker,initial_case_assessment,date_case_study_prepared,
             reintegration_type,reintegration_status,
             initial_risk_level,current_risk_level,
             date_enrolled,date_closed,created_at,notes_restricted)
        VALUES ({placeholders})
    """
    return sql, rows

def transform_process_recordings(df):
    rows = []
    for _, r in df.iterrows():
        rows.append((
            clean_int(r["recording_id"]),
            clean_int(r["resident_id"]),
            clean_date(r["session_date"]),
            clean_str(r["social_worker"], 100),
            clean_str(r["session_type"], 20),
            clean_int(r.get("session_duration_minutes")),
            clean_str(r.get("emotional_state_observed"), 50),
            clean_str(r.get("emotional_state_end"), 50),
            clean_str(r.get("session_narrative")),
            clean_str(r.get("interventions_applied")),
            clean_str(r.get("follow_up_actions")),
            to_bit(r.get("progress_noted", False)),
            to_bit(r.get("concerns_flagged", False)),
            to_bit(r.get("referral_made", False)),
            clean_str(r.get("notes_restricted")),
        ))
    sql = """
        INSERT INTO process_recordings
            (recording_id,resident_id,session_date,social_worker,session_type,
             session_duration_minutes,emotional_state_observed,emotional_state_end,
             session_narrative,interventions_applied,follow_up_actions,
             progress_noted,concerns_flagged,referral_made,notes_restricted)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    """
    return sql, rows

def transform_home_visitations(df):
    rows = []
    for _, r in df.iterrows():
        rows.append((
            clean_int(r["visitation_id"]),
            clean_int(r["resident_id"]),
            clean_date(r["visit_date"]),
            clean_str(r["social_worker"], 100),
            clean_str(r["visit_type"], 100),
            clean_str(r.get("location_visited"), 300),
            clean_str(r.get("family_members_present"), 300),
            clean_str(r.get("purpose")),
            clean_str(r.get("observations")),
            clean_str(r.get("family_cooperation_level"), 50),
            to_bit(r.get("safety_concerns_noted", False)),
            to_bit(r.get("follow_up_needed", False)),
            clean_str(r.get("follow_up_notes")),
            clean_str(r.get("visit_outcome"), 50),
        ))
    sql = """
        INSERT INTO home_visitations
            (visitation_id,resident_id,visit_date,social_worker,visit_type,
             location_visited,family_members_present,purpose,observations,
             family_cooperation_level,safety_concerns_noted,follow_up_needed,
             follow_up_notes,visit_outcome)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    """
    return sql, rows

def transform_education_records(df):
    rows = []
    for _, r in df.iterrows():
        rows.append((
            clean_int(r["education_record_id"]),
            clean_int(r["resident_id"]),
            clean_date(r["record_date"]),
            clean_str(r.get("education_level"), 50),
            clean_str(r.get("school_name"), 200),
            clean_str(r.get("enrollment_status"), 50),
            clean_float(r.get("attendance_rate")),
            clean_float(r.get("progress_percent")),
            clean_str(r.get("completion_status"), 20),
            clean_str(r.get("notes")),
        ))
    sql = """
        INSERT INTO education_records
            (education_record_id,resident_id,record_date,education_level,school_name,
             enrollment_status,attendance_rate,progress_percent,completion_status,notes)
        VALUES (?,?,?,?,?,?,?,?,?,?)
    """
    return sql, rows

def transform_health_wellbeing_records(df):
    rows = []
    for _, r in df.iterrows():
        rows.append((
            clean_int(r["health_record_id"]),
            clean_int(r["resident_id"]),
            clean_date(r["record_date"]),
            clean_float(r.get("general_health_score")),
            clean_float(r.get("nutrition_score")),
            clean_float(r.get("sleep_quality_score")),
            clean_float(r.get("energy_level_score")),
            clean_float(r.get("height_cm")),
            clean_float(r.get("weight_kg")),
            clean_float(r.get("bmi")),
            to_bit(r.get("medical_checkup_done", False)),
            to_bit(r.get("dental_checkup_done", False)),
            to_bit(r.get("psychological_checkup_done", False)),
            clean_str(r.get("notes")),
        ))
    sql = """
        INSERT INTO health_wellbeing_records
            (health_record_id,resident_id,record_date,general_health_score,
             nutrition_score,sleep_quality_score,energy_level_score,
             height_cm,weight_kg,bmi,
             medical_checkup_done,dental_checkup_done,psychological_checkup_done,notes)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    """
    return sql, rows

def transform_intervention_plans(df):
    rows = []
    for _, r in df.iterrows():
        rows.append((
            clean_int(r["plan_id"]),
            clean_int(r["resident_id"]),
            clean_str(r["plan_category"], 50),
            clean_str(r.get("plan_description")),
            clean_str(r.get("services_provided")),
            clean_float(r.get("target_value")),
            clean_date(r.get("target_date")),
            clean_str(r["status"], 20),
            clean_date(r.get("case_conference_date")),
            clean_datetime(r.get("created_at")),
            clean_datetime(r.get("updated_at")),
        ))
    sql = """
        INSERT INTO intervention_plans
            (plan_id,resident_id,plan_category,plan_description,services_provided,
             target_value,target_date,status,case_conference_date,created_at,updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)
    """
    return sql, rows

def transform_incident_reports(df):
    rows = []
    for _, r in df.iterrows():
        rows.append((
            clean_int(r["incident_id"]),
            clean_int(r["resident_id"]),
            clean_int(r["safehouse_id"]),
            clean_date(r["incident_date"]),
            clean_str(r["incident_type"], 50),
            clean_str(r["severity"], 20),
            clean_str(r.get("description")),
            clean_str(r.get("response_taken")),
            to_bit(r.get("resolved", False)),
            clean_date(r.get("resolution_date")),
            clean_str(r.get("reported_by"), 100),
            to_bit(r.get("follow_up_required", False)),
        ))
    sql = """
        INSERT INTO incident_reports
            (incident_id,resident_id,safehouse_id,incident_date,incident_type,
             severity,description,response_taken,resolved,resolution_date,
             reported_by,follow_up_required)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    """
    return sql, rows

def transform_safehouse_monthly_metrics(df):
    rows = []
    for _, r in df.iterrows():
        rows.append((
            clean_int(r["metric_id"]),
            clean_int(r["safehouse_id"]),
            clean_date(r["month_start"]),
            clean_date(r["month_end"]),
            clean_int(r.get("active_residents")),
            clean_float(r.get("avg_education_progress")),
            clean_float(r.get("avg_health_score")),
            clean_int(r.get("process_recording_count")) or 0,
            clean_int(r.get("home_visitation_count")) or 0,
            clean_int(r.get("incident_count")) or 0,
            clean_str(r.get("notes")),
        ))
    sql = """
        INSERT INTO safehouse_monthly_metrics
            (metric_id,safehouse_id,month_start,month_end,active_residents,
             avg_education_progress,avg_health_score,
             process_recording_count,home_visitation_count,incident_count,notes)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)
    """
    return sql, rows

def transform_supporters(df):
    rows = []
    for _, r in df.iterrows():
        rows.append((
            clean_int(r["supporter_id"]),
            clean_str(r["supporter_type"], 50),
            clean_str(r["display_name"], 200),
            clean_str(r.get("organization_name"), 200),
            clean_str(r.get("first_name"), 100),
            clean_str(r.get("last_name"), 100),
            clean_str(r.get("relationship_type"), 50),
            clean_str(r.get("region"), 100),
            clean_str(r.get("country"), 100),
            clean_str(r.get("email"), 200),
            clean_str(r.get("phone"), 50),
            clean_str(r["status"], 20),
            clean_datetime(r.get("created_at")),
            clean_date(r.get("first_donation_date")),
            clean_str(r.get("acquisition_channel"), 50),
        ))
    sql = """
        INSERT INTO supporters
            (supporter_id,supporter_type,display_name,organization_name,
             first_name,last_name,relationship_type,region,country,email,phone,
             status,created_at,first_donation_date,acquisition_channel)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    """
    return sql, rows

def transform_social_media_posts(df):
    rows = []
    for _, r in df.iterrows():
        rows.append((
            clean_int(r["post_id"]),
            clean_str(r["platform"], 50),
            clean_str(r.get("platform_post_id"), 100),
            clean_str(r.get("post_url"), 500),
            clean_datetime(r["created_at"]),
            clean_str(r.get("day_of_week"), 20),
            clean_int(r.get("post_hour")),
            clean_str(r.get("post_type"), 50),
            clean_str(r.get("media_type"), 30),
            clean_str(r.get("caption")),
            clean_str(r.get("hashtags")),
            clean_int(r.get("num_hashtags")) or 0,
            clean_int(r.get("mentions_count")) or 0,
            to_bit(r.get("has_call_to_action", False)),
            clean_str(r.get("call_to_action_type"), 50),
            clean_str(r.get("content_topic"), 100),
            clean_str(r.get("sentiment_tone"), 50),
            clean_int(r.get("caption_length")),
            to_bit(r.get("features_resident_story", False)),
            clean_str(r.get("campaign_name"), 200),
            to_bit(r.get("is_boosted", False)),
            clean_float(r.get("boost_budget_php")),
            clean_int(r.get("impressions")),
            clean_int(r.get("reach")),
            clean_int(r.get("likes")),
            clean_int(r.get("comments")),
            clean_int(r.get("shares")),
            clean_int(r.get("saves")),
            clean_int(r.get("click_throughs")),
            clean_int(r.get("video_views")),
            clean_float(r.get("engagement_rate")),
            clean_int(r.get("profile_visits")),
            clean_int(r.get("donation_referrals")),
            clean_float(r.get("estimated_donation_value_php")),
            clean_int(r.get("follower_count_at_post")),
            clean_int(r.get("watch_time_seconds")),
            clean_int(r.get("avg_view_duration_seconds")),
            clean_int(r.get("subscriber_count_at_post")),
            clean_int(r.get("forwards")),
        ))
    sql = """
        INSERT INTO social_media_posts
            (post_id,platform,platform_post_id,post_url,created_at,day_of_week,
             post_hour,post_type,media_type,caption,hashtags,num_hashtags,
             mentions_count,has_call_to_action,call_to_action_type,content_topic,
             sentiment_tone,caption_length,features_resident_story,campaign_name,
             is_boosted,boost_budget_php,impressions,reach,likes,comments,shares,
             saves,click_throughs,video_views,engagement_rate,profile_visits,
             donation_referrals,estimated_donation_value_php,follower_count_at_post,
             watch_time_seconds,avg_view_duration_seconds,subscriber_count_at_post,forwards)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    """
    return sql, rows

def transform_donations(df):
    rows = []
    for _, r in df.iterrows():
        rows.append((
            clean_int(r["donation_id"]),
            clean_int(r["supporter_id"]),
            clean_str(r["donation_type"], 50),
            clean_date(r["donation_date"]),
            to_bit(r.get("is_recurring", False)),
            clean_str(r.get("campaign_name"), 200),
            clean_str(r.get("channel_source"), 50),
            clean_str(r.get("currency_code"), 10),
            clean_float(r.get("amount")),
            clean_float(r.get("estimated_value")),
            clean_str(r.get("impact_unit"), 50),
            clean_str(r.get("notes")),
            clean_int(r.get("referral_post_id")),
        ))
    sql = """
        INSERT INTO donations
            (donation_id,supporter_id,donation_type,donation_date,is_recurring,
             campaign_name,channel_source,currency_code,amount,estimated_value,
             impact_unit,notes,referral_post_id)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
    """
    return sql, rows

def transform_in_kind_donation_items(df):
    rows = []
    for _, r in df.iterrows():
        rows.append((
            clean_int(r["item_id"]),
            clean_int(r["donation_id"]),
            clean_str(r["item_name"], 200),
            clean_str(r.get("item_category"), 50),
            clean_int(r.get("quantity")),
            clean_str(r.get("unit_of_measure"), 20),
            clean_float(r.get("estimated_unit_value")),
            clean_str(r.get("intended_use"), 50),
            clean_str(r.get("received_condition"), 20),
        ))
    sql = """
        INSERT INTO in_kind_donation_items
            (item_id,donation_id,item_name,item_category,quantity,unit_of_measure,
             estimated_unit_value,intended_use,received_condition)
        VALUES (?,?,?,?,?,?,?,?,?)
    """
    return sql, rows

def transform_donation_allocations(df):
    rows = []
    for _, r in df.iterrows():
        rows.append((
            clean_int(r["allocation_id"]),
            clean_int(r["donation_id"]),
            clean_int(r["safehouse_id"]),
            clean_str(r["program_area"], 50),
            clean_float(r["amount_allocated"]),
            clean_date(r["allocation_date"]),
            clean_str(r.get("allocation_notes")),
        ))
    sql = """
        INSERT INTO donation_allocations
            (allocation_id,donation_id,safehouse_id,program_area,
             amount_allocated,allocation_date,allocation_notes)
        VALUES (?,?,?,?,?,?,?)
    """
    return sql, rows

def transform_public_impact_snapshots(df):
    rows = []
    for _, r in df.iterrows():
        rows.append((
            clean_int(r["snapshot_id"]),
            clean_date(r["snapshot_date"]),
            clean_str(r.get("headline"), 500),
            clean_str(r.get("summary_text")),
            clean_str(r.get("metric_payload_json")),
            to_bit(r.get("is_published", False)),
            clean_date(r.get("published_at")),
        ))
    sql = """
        INSERT INTO public_impact_snapshots
            (snapshot_id,snapshot_date,headline,summary_text,
             metric_payload_json,is_published,published_at)
        VALUES (?,?,?,?,?,?,?)
    """
    return sql, rows


# ── Upload order (FK-safe) ────────────────────────────────────────────────────

TABLES = [
    ("safehouses.csv",               "safehouses",               transform_safehouses),
    ("partners.csv",                  "partners",                  transform_partners),
    ("partner_assignments.csv",       "partner_assignments",       transform_partner_assignments),
    ("residents.csv",                 "residents",                 transform_residents),
    ("process_recordings.csv",        "process_recordings",        transform_process_recordings),
    ("home_visitations.csv",          "home_visitations",          transform_home_visitations),
    ("education_records.csv",         "education_records",         transform_education_records),
    ("health_wellbeing_records.csv",  "health_wellbeing_records",  transform_health_wellbeing_records),
    ("intervention_plans.csv",        "intervention_plans",        transform_intervention_plans),
    ("incident_reports.csv",          "incident_reports",          transform_incident_reports),
    ("safehouse_monthly_metrics.csv", "safehouse_monthly_metrics", transform_safehouse_monthly_metrics),
    ("supporters.csv",                "supporters",                transform_supporters),
    ("social_media_posts.csv",        "social_media_posts",        transform_social_media_posts),
    ("donations.csv",                 "donations",                 transform_donations),
    ("in_kind_donation_items.csv",    "in_kind_donation_items",    transform_in_kind_donation_items),
    ("donation_allocations.csv",      "donation_allocations",      transform_donation_allocations),
    ("public_impact_snapshots.csv",   "public_impact_snapshots",   transform_public_impact_snapshots),
]


# ── Main upload logic ─────────────────────────────────────────────────────────

def upload_table(conn, csv_file, table_name, transform_fn, dry_run=False):
    print(f"\n{'[DRY RUN] ' if dry_run else ''}Loading {csv_file} → {table_name}...")
    df = load_csv(csv_file)
    sql, rows = transform_fn(df)
    print(f"  Rows to insert: {len(rows)}")

    if dry_run:
        print(f"  OK (dry run — no data written)")
        return

    cursor = conn.cursor()
    cursor.fast_executemany = True
    try:
        cursor.executemany(sql, rows)
        conn.commit()
        print(f"  Inserted {len(rows)} rows into {table_name}")
    except Exception as e:
        conn.rollback()
        print(f"  ERROR inserting into {table_name}: {e}")
        raise
    finally:
        cursor.close()


def main():
    parser = argparse.ArgumentParser(description="Upload SureAnchor CSVs to Azure SQL")
    parser.add_argument("--table", help="Upload only this table name (e.g. safehouses)")
    parser.add_argument("--dry-run", action="store_true", help="Validate without writing")
    args = parser.parse_args()

    tables_to_run = TABLES
    if args.table:
        tables_to_run = [t for t in TABLES if t[1] == args.table]
        if not tables_to_run:
            print(f"Unknown table: {args.table}")
            print("Available:", ", ".join(t[1] for t in TABLES))
            sys.exit(1)

    conn = None if args.dry_run else get_connection()

    try:
        for csv_file, table_name, transform_fn in tables_to_run:
            upload_table(conn, csv_file, table_name, transform_fn, dry_run=args.dry_run)
        print("\nAll done!")
    finally:
        if conn:
            conn.close()


if __name__ == "__main__":
    main()
