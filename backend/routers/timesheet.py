from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List,Optional
from .. import models, schemas
from ..database import get_db
import os
import pandas as pd
import json
from datetime import datetime
router = APIRouter(
    prefix="/api/timesheets",
    tags=["Timesheets"]
)
from datetime import datetime
@router.post("/", response_model=schemas.Timesheet)
def create_timesheet(timesheet: schemas.TimesheetCreate, db: Session = Depends(get_db)):
    data_to_store = timesheet.data or {}

    # --- Derive job name robustly (handles all frontend variants) ---
    job_name = (
        data_to_store.get("job_name")
        or (data_to_store.get("job") or {}).get("job_description")
        or (data_to_store.get("job") or {}).get("job_name")
        or (data_to_store.get("job") or {}).get("job_code")
        or "Untitled Timesheet"
    )

    # --- Create new timesheet entry ---
    db_ts = models.Timesheet(
        foreman_id=timesheet.foreman_id,
        job_phase_id=timesheet.job_phase_id,
        date=timesheet.date,
        status="draft",                 # Always starts as draft
        data=data_to_store,             # JSONB payload
        timesheet_name=job_name         # Readable name in admin panel
    )

    db.add(db_ts)
    db.commit()
    db.refresh(db_ts)
    return db_ts


@router.get("/by-foreman/{foreman_id}", response_model=List[schemas.Timesheet])
def get_timesheets_by_foreman(foreman_id: int, db: Session = Depends(get_db)):
    """
    Returns only editable timesheets (Draft or Pending) for a given foreman.
    'Sent' or 'Approved' timesheets will no longer appear in the app list.
    """
    timesheets = (
        db.query(models.Timesheet)
        .options(joinedload(models.Timesheet.files))
        .filter(
            models.Timesheet.foreman_id == foreman_id,
            models.Timesheet.status.in_([
                models.SubmissionStatus.DRAFT,
                models.SubmissionStatus.PENDING
            ])
        )
        .order_by(models.Timesheet.date.desc())
        .all()
    )
    return timesheets


from datetime import date as date_type
from sqlalchemy import cast, Date
@router.get("/for-supervisor", response_model=List[schemas.Timesheet])
def get_timesheets_for_supervisor(
    db: Session = Depends(get_db),
    foreman_id: Optional[int] = Query(None),
    date: Optional[str] = Query(None),
):
    """
    Returns all Submitted timesheets for supervisors to review.
    Filters by foreman_id and/or work date (timesheet.date).
    """
    # Use "status" instead of "sent"
    query = (
        db.query(models.Timesheet)
        .options(joinedload(models.Timesheet.files))
        .filter(models.Timesheet.status == "Submitted")
    )

    if foreman_id is not None:
        query = query.filter(models.Timesheet.foreman_id == foreman_id)

    if date:
        try:
            target_date = date_type.fromisoformat(date)
            query = query.filter(cast(models.Timesheet.date, Date) == target_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    # Optional: latest submitted first
    timesheets = query.order_by(models.Timesheet.updated_at.desc()).all()

    return timesheets
@router.get("/{timesheet_id}", response_model=schemas.Timesheet)
def get_single_timesheet(timesheet_id: int, db: Session = Depends(get_db)):
    """
    Returns a single timesheet, safely enriching the foreman-saved JSON with static info
    from the database for all entities (employees, equipment, materials, vendors, and dumping sites).
    This is non-destructive and ensures all saved data is returned.
    """
    timesheet = (
        db.query(models.Timesheet)
        .options(joinedload(models.Timesheet.files))
        .filter(models.Timesheet.id == timesheet_id)
        .first()
    )
    if not timesheet:
        raise HTTPException(status_code=404, detail="Timesheet not found")

    saved_data = timesheet.data or {}
    if isinstance(saved_data, str):
        try:
            saved_data = json.loads(saved_data)
        except json.JSONDecodeError:
            saved_data = {} # Default to an empty dictionary on error

    # --- Safe, Non-Destructive Enrichment Logic ---
    def enrich_entities_in_place(entity_key: str, model, name_fields: list):
        # Get the list of entities (e.g., employees, dumping_sites) from the saved data
        saved_entities = saved_data.get(entity_key, [])
        if not saved_entities:
            return # Nothing to do if the key doesn't exist or the list is empty

        # Get the IDs to look up in the database
        entity_ids = [e.get("id") for e in saved_entities if e.get("id") is not None]
        if not entity_ids:
            return # No IDs to look up

        # Fetch the corresponding records from the database in one query
        db_entities = db.query(model).filter(model.id.in_(entity_ids)).all()
        db_map = {db_e.id: db_e for db_e in db_entities}

        # Loop through the entities saved by the foreman and add the name
        for entity in saved_entities:
            entity_id = entity.get("id")
            db_record = db_map.get(entity_id)
            
            # If we found a matching record in the DB, add its name
            if db_record:
                name_parts = [getattr(db_record, field, "") for field in name_fields]
                full_name = " ".join(filter(None, name_parts)).strip()
                entity["name"] = full_name
    
    # --- End of Logic ---

    # Call the enrichment function for EVERY entity type.
    # This will modify the 'saved_data' dictionary directly.
    enrich_entities_in_place("employees", models.Employee, ["first_name", "last_name"])
    enrich_entities_in_place("equipment", models.Equipment, ["name"])
    enrich_entities_in_place("materials", models.Material, ["name"])
    enrich_entities_in_place("vendors", models.Vendor, ["name"])
    enrich_entities_in_place("dumping_sites", models.DumpingSite, ["name"]) # The crucial addition

    # Return the timesheet with the fully enriched data object
    timesheet.data = saved_data
    return timesheet

@router.put("/{timesheet_id}", response_model=schemas.Timesheet)
def update_timesheet(
    timesheet_id: int,
    timesheet_update: schemas.TimesheetUpdate,
    db: Session = Depends(get_db)
):
    # --- Fetch timesheet ---
    ts = db.query(models.Timesheet).filter(models.Timesheet.id == timesheet_id).first()
    if not ts:
        raise HTTPException(status_code=404, detail="Timesheet not found")

    payload = timesheet_update.dict(exclude_unset=True)

    if "data" in payload:
        ts.data = payload["data"]
    if "status" in payload:
        ts.status = payload["status"]

    # --- Keep job name synced ---
    data_to_store = ts.data or {}
    job_name = (
        data_to_store.get("job_name")
        or (data_to_store.get("job") or {}).get("job_description")
        or (data_to_store.get("job") or {}).get("job_name")
        or (data_to_store.get("job") or {}).get("job_code")
        or "Untitled Timesheet"
    )
    ts.timesheet_name = job_name
    ts.data["job_name"] = job_name

    db.commit()
    db.refresh(ts)

    # --- Excel file generation ---
    try:
        BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        storage_dir = os.path.join(BASE_DIR, "storage")
        os.makedirs(storage_dir, exist_ok=True)

        ts_date_str = ts.date.strftime("%Y-%m-%d") if hasattr(ts.date, "strftime") else str(ts.date)
        date_folder = os.path.join(storage_dir, ts_date_str)
        os.makedirs(date_folder, exist_ok=True)

        version = len([f for f in os.listdir(date_folder) if f.startswith(f"timesheet_{ts.id}_")]) + 1
        file_name = f"timesheet_{ts.id}_{ts_date_str}_v{version}.xlsx"
        file_path_local = os.path.join(date_folder, file_name)

        data = ts.data if isinstance(ts.data, dict) else json.loads(ts.data)
        job_phases = data.get("job", {}).get("phase_codes", [])

        def create_df(entities, name_key="name"):
            rows = []
            for ent in entities:
                name = ent.get(name_key) or ent.get("first_name", "")
                if "last_name" in ent:
                    name = f"{name} {ent.get('last_name', '')}".strip()
                row = {"ID": ent.get("id", ""), "Name": name}
                for phase in job_phases:
                    row[phase] = ent.get("hours_per_phase", {}).get(phase, 0)
                rows.append(row)
            return pd.DataFrame(rows)

        def create_dumping_site_df(entities):
            rows = []
            for ent in entities:
                row = {"ID": ent.get("id", ""), "Name": ent.get("name", "")}
                for phase in job_phases:
                    row[f"{phase} (# of Loads)"] = ent.get("hours_per_phase", {}).get(phase, 0)
                    row[f"{phase} (Qty)"] = ent.get("tickets_per_phase", {}).get(phase, 0)
                rows.append(row)
            return pd.DataFrame(rows)

        with pd.ExcelWriter(file_path_local, engine="openpyxl") as writer:
            create_df(data.get("employees", []), name_key="first_name").to_excel(writer, index=False, sheet_name="Employees")
            create_df(data.get("equipment", [])).to_excel(writer, index=False, sheet_name="Equipment")
            create_df(data.get("materials", [])).to_excel(writer, index=False, sheet_name="Materials")
            create_df(data.get("vendors", [])).to_excel(writer, index=False, sheet_name="Vendors")
            create_dumping_site_df(data.get("dumping_sites", [])).to_excel(writer, index=False, sheet_name="DumpingSites")

        # ✅ Replace ngrok link with your own base URL
        NGROK_BASE_URL = "https://coated-nonattributive-babara.ngrok-free.dev"
        file_url = f"{NGROK_BASE_URL}/storage/{ts_date_str}/{file_name}"

        # ✅ Save file info in DB
        file_record = models.TimesheetFile(
            timesheet_id=ts.id,
            foreman_id=ts.foreman_id,
            file_path=file_url
        )
        db.add(file_record)
        db.commit()
        db.refresh(file_record)

        print(f"✅ Timesheet Excel generated and saved at: {file_url}")

    except Exception as e:
        print(f"❌ Excel generation failed: {e}")

    return ts
# -------------------------------
# SEND a timesheet
# -------------------------------
from datetime import datetime


from ..models import SubmissionStatus

@router.post("/{timesheet_id}/send", response_model=schemas.Timesheet)
def send_timesheet(timesheet_id: int, db: Session = Depends(get_db)):
    ts = db.query(models.Timesheet).filter(models.Timesheet.id == timesheet_id).first()
    if not ts:
        raise HTTPException(status_code=404, detail="Timesheet not found")

    if ts.status == SubmissionStatus.SUBMITTED:
        raise HTTPException(status_code=400, detail="Timesheet already sent")

    ts.sent = True
    ts.sent_date = datetime.utcnow()
    ts.status = SubmissionStatus.SUBMITTED  # ✅ fixed value

    workflow = models.TimesheetWorkflow(
        timesheet_id=ts.id,
        foreman_id=ts.foreman_id,
        action="Sent",
        by_role="Foreman",
        timestamp=datetime.utcnow(),
        comments="Sent to supervisor",
    )
    db.add(workflow)
    db.commit()
    db.refresh(ts)
    return ts
# -------------------------------
# DELETE a timesheet
# -------------------------------
@router.delete("/{timesheet_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_timesheet(timesheet_id: int, db: Session = Depends(get_db)):
    ts = db.query(models.Timesheet).filter(models.Timesheet.id == timesheet_id).first()
    if not ts:
        raise HTTPException(status_code=404, detail="Timesheet not found")
    db.delete(ts)
    db.commit()
    return
# In your routers/timesheet.py


@router.get("/", response_model=List[schemas.TimesheetResponse])
def list_timesheets(db: Session = Depends(get_db)):
    """
    Returns a list of all timesheets with foreman names and job names included.
    This is optimized for the admin dashboard view.
    """
    timesheets = db.query(models.Timesheet).options(joinedload(models.Timesheet.foreman)).all()
    
    response = []
    for ts in timesheets:
        foreman_name = f"{ts.foreman.first_name} {ts.foreman.last_name}" if ts.foreman else "N/A"
        
        # Create the response object, ensuring all required fields are present
        response.append(schemas.TimesheetResponse(
            id=ts.id,
            date=ts.date,
            foreman_id=ts.foreman_id,
            foreman_name=foreman_name,
            job_name=ts.timesheet_name,  # <-- The FIX: Populate the required 'job_name' field
            data=ts.data,
            status=ts.status
        ))
        
    return response
from sqlalchemy import or_

@router.get("/drafts/by-foreman/{foreman_id}", response_model=List[schemas.Timesheet])
def get_draft_timesheets_by_foreman(foreman_id: int, db: Session = Depends(get_db)):
    """
    Returns all draft/pending timesheets for a given foreman.
    This is used by the new ReviewTimesheetScreen.
    """
    timesheets = (
        db.query(models.Timesheet)
        .options(joinedload(models.Timesheet.files))
        .filter(models.Timesheet.foreman_id == foreman_id)
        .filter(or_(models.Timesheet.status == 'Pending', models.Timesheet.status == 'draft'))
        .order_by(models.Timesheet.date.desc())
        .all()
    )
    return timesheets
@router.post("/timesheets/save-draft/")
def save_draft(timesheet: schemas.TimesheetCreate, db: Session = Depends(get_db)):
    """
    Save a timesheet draft. Each save creates a new row.
    """
    new_ts = models.Timesheet(
        foreman_id=timesheet.foreman_id,
        job_name=timesheet.job_name,
        date=datetime.utcnow(),
        status="draft",
        data=json.dumps(timesheet.data)  # store JSON as string
    )
    db.add(new_ts)
    db.commit()
    db.refresh(new_ts)
    return {"message": "Draft saved", "timesheet_id": new_ts.id}

@router.get("/timesheets/drafts/by-foreman/{foreman_id}")
def get_drafts(foreman_id: int, db: Session = Depends(get_db)):
    """
    Fetch all draft timesheets for a foreman
    """
    drafts = (
        db.query(models.Timesheet)
        .filter(models.Timesheet.foreman_id == foreman_id)
        .filter(models.Timesheet.status == "draft")
        .order_by(models.Timesheet.date.desc())
        .all()
    )
    # Convert JSON string to dict
    return [
        {**{"id": t.id, "job_name": t.job_name, "date": t.date}, **json.loads(t.data)}
        for t in drafts
    ]




