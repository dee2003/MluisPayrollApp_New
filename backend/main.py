# backend/main.py
from fastapi import FastAPI, Depends, APIRouter, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List
import logging
import sys
import os
from sqlalchemy import func # <--- ADD THIS IMPORT
from sqlalchemy.orm import selectinload

from . import models, schemas, database, crud
from .crud import create_crud_router
from .routers import timesheet, tickets, review, equipment, submissions, project_engineer,job_phases,vendor_options,vendor_router, vendor_materials
from .ocr import ocr_main

from .routers.dropdowns import router as dropdowns_router

# -------------------------------
# Database: Create all tables
# -------------------------------
models.Base.metadata.create_all(bind=database.engine)

# -------------------------------
# App and Middleware
# -------------------------------
app = FastAPI()
logging.basicConfig(level=logging.INFO, stream=sys.stdout)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------
# Static Files
# -------------------------------
app.mount("/storage", StaticFiles(directory="storage"), name="storage")
TICKETS_DIR = r"D:\GitMobileApp\MluisPayrollApp_New\backend\tickets"
app.mount("/media/tickets", StaticFiles(directory=os.path.abspath(TICKETS_DIR)), name="tickets")

# -------------------------------
# Logging setup
# -------------------------------
access_logger = logging.getLogger("uvicorn.access")
access_logger.handlers.clear()
access_uvicorn_handler = logging.StreamHandler()
access_logger.addHandler(access_uvicorn_handler)
access_logger.propagate = False
access_logger.setLevel(logging.INFO)

# -------------------------------
# Job & Phase Management Router
# -------------------------------
job_phase_router = APIRouter(prefix="/api/job-phases", tags=["Job Phases"])

@job_phase_router.post("/", response_model=schemas.JobPhase)
def create_job_phase(job_phase: schemas.JobPhaseCreate, db: Session = Depends(database.get_db)):
    existing = db.query(models.JobPhase).filter(models.JobPhase.job_code == job_phase.job_code).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Job with code '{job_phase.job_code}' already exists.")

    new_job_phase = models.JobPhase(
        job_code=job_phase.job_code,
        contract_no=job_phase.contract_no,
        job_description=job_phase.job_description,
        project_engineer=job_phase.project_engineer,
        location_id=job_phase.location_id, 
        status=job_phase.status
    )

    # ✅ Create and attach PhaseCode objects
    if job_phase.phase_codes:
        for code_str in job_phase.phase_codes:
            new_phase = models.PhaseCode(
                code=code_str,
                description=f"Phase {code_str}",
                unit="unit",
            )
            new_job_phase.phase_codes.append(new_phase)

    db.add(new_job_phase)
    db.commit()
    db.refresh(new_job_phase)
    return new_job_phase







# backend/main.py

# @job_phase_router.put("/{job_code}", response_model=schemas.JobPhase)
# def update_job_phase(job_code: str, job_update: schemas.JobPhaseUpdate, db: Session = Depends(database.get_db)):
#     # Use selectinload to efficiently fetch the job and its related phase codes
#     db_job = db.query(models.JobPhase).options(
#         selectinload(models.JobPhase.phase_codes)
#     ).filter(models.JobPhase.job_code == job_code).first()

#     if not db_job:
#         raise HTTPException(status_code=404, detail="Job not found")

#     # Get the update data from the Pydantic model
#     update_data = job_update.dict(exclude_unset=True)

#     # ✅ Handle the phase_codes relationship separately
#     if "phase_codes" in update_data:
#         # Pop the list of strings from the update data so the loop doesn't process it
#         new_phase_code_strings = update_data.pop("phase_codes")
        
#         # Clear the existing collection of PhaseCode objects.
#         # The `cascade="all, delete-orphan"` setting in your model will handle deleting them from the DB.
#         db_job.phase_codes.clear()

#         # Create new PhaseCode objects from the list of strings
#         for code_str in new_phase_code_strings:
#             new_phase = models.PhaseCode(
#                 code=code_str,
#                 description=f"Phase {code_str}",  # Or fetch existing descriptions if needed
#                 unit="unit"
#             )
#             db_job.phase_codes.append(new_phase)

#     # Update all other simple attributes (contract_no, description, etc.)
#     for key, value in update_data.items():
#         setattr(db_job, key, value)

#     db.commit()
#     db.refresh(db_job)
    
#     return db_job

@job_phase_router.put("/by-id/{job_id}", response_model=schemas.JobPhase)
def update_job_phase_by_id(job_id: int, job_update: schemas.JobPhaseUpdate, db: Session = Depends(database.get_db)):
    db_job = db.query(models.JobPhase).options(selectinload(models.JobPhase.phase_codes)).filter(models.JobPhase.id == job_id).first()
    
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")

    update_data = job_update.dict(exclude_unset=True)

    # Handle phase_codes properly
    if "phase_codes" in update_data:
        new_phase_codes = update_data.pop("phase_codes")
        db_job.phase_codes.clear()
        for code_str in new_phase_codes:
            db_job.phase_codes.append(models.PhaseCode(code=code_str, description=f"Phase {code_str}", unit="unit"))

    # Update other fields
    for key, value in update_data.items():
        setattr(db_job, key, value)

    db.commit()
    db.refresh(db_job)
    return db_job



# @job_phase_router.get("/", response_model=List[schemas.JobPhase])
# def get_all_job_phases(db: Session = Depends(database.get_db)):
#     # Use .options(selectinload(...)) to eagerly load the relationship data.
#     return db.query(models.JobPhase).options(
#         selectinload(models.JobPhase.phase_codes)
#     ).all()

# @job_phase_router.get("/", response_model=List[schemas.JobPhase])
# def get_all_job_phases(db: Session = Depends(database.get_db)):
#     return (
#         db.query(models.JobPhase)
#         .options(selectinload(models.JobPhase.phase_codes))
#         .filter(models.JobPhase.status != models.ResourceStatus.INACTIVE)
#         .all()
#     )
@job_phase_router.get("/active", response_model=List[schemas.JobPhase])
def get_active_job_phases(db: Session = Depends(database.get_db)):
    """
    Fetch only active job phases (used in timesheet creation).
    """
    return (
        db.query(models.JobPhase)
        .options(selectinload(models.JobPhase.phase_codes))
        .filter(models.JobPhase.status == models.ResourceStatus.ACTIVE)
        .all()
    )
# @job_phase_router.get("/", response_model=List[schemas.JobPhase])
# def get_all_job_phases(db: Session = Depends(database.get_db)):
#     # Use .options(selectinload(...)) to eagerly load the relationship data.
#     return db.query(models.JobPhase).options(
#         selectinload(models.JobPhase.phase_codes)
#     ).all()


# @job_phase_router.get("/{job_code}", response_model=schemas.JobPhase)
# def get_job_phases(job_code: str, db: Session = Depends(database.get_db)):
#     db_job = db.query(models.JobPhase).filter(models.JobPhase.job_code == job_code).first()
#     if not db_job:
#         raise HTTPException(status_code=404, detail="Job not found")
#     return db_job

# @job_phase_router.delete("/{job_code}", status_code=status.HTTP_200_OK)
# def delete_job(job_code: str, db: Session = Depends(database.get_db)):
#     db_job = db.query(models.JobPhase).filter(models.JobPhase.job_code == job_code).first()
#     if not db_job:
#         raise HTTPException(status_code=404, detail="Job not found")
#     db.delete(db_job)
#     db.commit()
#     return {"ok": True, "detail": f"Job '{job_code}' and all its phases deleted"}

# @job_phase_router.get("/phase-codes", response_model=List[schemas.PhaseCode])
# def get_all_phase_codes(db: Session = Depends(database.get_db)):
#     return db.query(models.PhaseCode).all()
# -------------------------------
# Crew Mapping Router with Soft Delete
# -------------------------------
crew_mapping_router = APIRouter(prefix="/api/crew-mapping", tags=["Crew Mapping"])

def parse_ids(id_string: str):
    if not id_string:
        return []
    return [item.strip() for item in id_string.split(",") if item.strip()]

def list_to_csv(id_list: List):
    return ",".join(map(str, id_list))

@crew_mapping_router.get("/", response_model=List[schemas.CrewMappingResponse]) # ✅ CORRECTED
def list_crew_mappings(db: Session = Depends(database.get_db)):
    """Lists all non-deleted crew mappings."""
    return db.query(models.CrewMapping).filter(models.CrewMapping.is_deleted == False).all()
@crew_mapping_router.get("/by-foreman/{foreman_id}", response_model=schemas.CrewMappingResponse)
def get_crew_details_by_foreman(foreman_id: int, db: Session = Depends(database.get_db)):
    mapping_details = crud.get_crew_mapping(db, foreman_id=foreman_id)
    if not mapping_details:
        raise HTTPException(status_code=404, detail=f"No crew mapping found for foreman with ID {foreman_id}")
    return mapping_details

@crew_mapping_router.get("/{crew_id}", response_model=schemas.CrewMappingResponse) # ✅ CORRECTED
def get_crew_mapping_by_id(crew_id: int, db: Session = Depends(database.get_db)):
    """Gets a single crew mapping by its ID."""
    mapping = db.query(models.CrewMapping).filter(
        models.CrewMapping.id == crew_id, 
        models.CrewMapping.is_deleted == False
    ).first()
    if not mapping:
        raise HTTPException(status_code=404, detail=f"Crew mapping with id {crew_id} not found")
    return mapping

# @crew_mapping_router.post("/", response_model=schemas.CrewMappingResponse, status_code=201)
# def create_crew_mapping(crew: schemas.CrewMappingCreate, db: Session = Depends(database.get_db)):
#     # ... function body remains the same

#     """
#     Creates a new crew mapping and correctly links the related resources
#     using SQLAlchemy relationships, ensuring correct data types for IDs.
#     """
#     db_crew = models.CrewMapping(
#         foreman_id=crew.foreman_id,
#         status=crew.status or "Active"
#     )

#     # Handle Employees (ID is String)
#     if crew.employee_ids:
#         string_ids = [str(eid) for eid in crew.employee_ids]
#         employee_objects = db.query(models.Employee).filter(models.Employee.id.in_(string_ids)).all()
#         db_crew.employees = employee_objects
#     # ... and so on for other relationships ...


#     # Handle Equipment (ID is String)
#     if crew.equipment_ids:
#         # ✅ FIX: Convert all IDs to strings before querying
#         string_ids = [str(eid) for eid in crew.equipment_ids]
#         equipment_objects = db.query(models.Equipment).filter(models.Equipment.id.in_(string_ids)).all()
#         db_crew.equipment = equipment_objects

#     # Handle Materials (ID is Integer - no change needed)
#     if crew.material_ids:
#         material_objects = db.query(models.Material).filter(models.Material.id.in_(crew.material_ids)).all()
#         db_crew.materials = material_objects

#     # Handle Vendors (ID is Integer - no change needed)
#     if crew.vendor_ids:
#         vendor_objects = db.query(models.Vendor).filter(models.Vendor.id.in_(crew.vendor_ids)).all()
#         db_crew.vendors = vendor_objects

#     # Handle Dumping Sites (ID is String)
#     if crew.dumping_site_ids:
#         # ✅ FIX: Convert all IDs to strings before querying
#         string_ids = [str(dsid) for dsid in crew.dumping_site_ids]
#         dumping_site_objects = db.query(models.DumpingSite).filter(models.DumpingSite.id.in_(string_ids)).all()
#         db_crew.dumping_sites = dumping_site_objects
        
#     db.add(db_crew)
#     db.commit()
#     db.refresh(db_crew)
#     return db_crew
    

@crew_mapping_router.post("/", response_model=schemas.CrewMappingResponse, status_code=201)
def create_crew_mapping(crew: schemas.CrewMappingCreate, db: Session = Depends(database.get_db)):
    """
    Creates a new crew mapping and correctly links the related resources
    using SQLAlchemy relationships, ensuring correct data types for IDs.
    """

    # ✅ Step 1: Deactivate all previous active mappings for this foreman
    db.query(models.CrewMapping).filter(
        models.CrewMapping.foreman_id == crew.foreman_id,
        models.CrewMapping.status == "Active"
    ).update({models.CrewMapping.status: "Inactive"})
    db.commit()

    # ✅ Step 2: Create new mapping as Active
    db_crew = models.CrewMapping(
        foreman_id=crew.foreman_id,
        status="Active"  # always Active when newly created
    )

    # ✅ Step 3: Handle relationships safely
    if crew.employee_ids:
        string_ids = [str(eid) for eid in crew.employee_ids]
        employee_objects = db.query(models.Employee).filter(models.Employee.id.in_(string_ids)).all()
        db_crew.employees = employee_objects

    if crew.equipment_ids:
        string_ids = [str(eid) for eid in crew.equipment_ids]
        equipment_objects = db.query(models.Equipment).filter(models.Equipment.id.in_(string_ids)).all()
        db_crew.equipment = equipment_objects

    if crew.material_ids:
        material_objects = db.query(models.Material).filter(models.Material.id.in_(crew.material_ids)).all()
        db_crew.materials = material_objects

    if crew.vendor_ids:
        vendor_objects = db.query(models.Vendor).filter(models.Vendor.id.in_(crew.vendor_ids)).all()
        db_crew.vendors = vendor_objects

    if crew.dumping_site_ids:
        string_ids = [str(dsid) for dsid in crew.dumping_site_ids]
        dumping_site_objects = db.query(models.DumpingSite).filter(models.DumpingSite.id.in_(string_ids)).all()
        db_crew.dumping_sites = dumping_site_objects

    # ✅ Step 4: Save the new mapping
    db.add(db_crew)
    db.commit()
    db.refresh(db_crew)

    return db_crew


@crew_mapping_router.put("/{crew_id}", response_model=schemas.CrewMappingResponse)
def update_crew_mapping(crew_id: int, crew: schemas.CrewMappingCreate, db: Session = Depends(database.get_db)):
    """
    Updates an existing crew mapping by finding it and replacing its
    relationships with the new set of provided IDs.
    """
    # Step 1: Find the existing crew mapping record
    db_crew = db.query(models.CrewMapping).filter(
        models.CrewMapping.id == crew_id, 
        models.CrewMapping.is_deleted == False
    ).first()

    if not db_crew:
        raise HTTPException(status_code=404, detail="Crew mapping not found")

    # Step 2: Update the direct fields on the object
    db_crew.foreman_id = crew.foreman_id
    db_crew.status = crew.status or "Active"
    
    # Step 3: Update all relationships by fetching the new objects
    
    # Handle Employees (String IDs)
    if crew.employee_ids:
        string_ids = [str(eid) for eid in crew.employee_ids]
        db_crew.employees = db.query(models.Employee).filter(models.Employee.id.in_(string_ids)).all()
    else:
        db_crew.employees = []  # Clear the relationship if an empty list is provided

    # Handle Equipment (String IDs)
    if crew.equipment_ids:
        string_ids = [str(eid) for eid in crew.equipment_ids]
        db_crew.equipment = db.query(models.Equipment).filter(models.Equipment.id.in_(string_ids)).all()
    else:
        db_crew.equipment = []

    # Handle Materials (Integer IDs)
    if crew.material_ids:
        db_crew.materials = db.query(models.Material).filter(models.Material.id.in_(crew.material_ids)).all()
    else:
        db_crew.materials = []

    # Handle Vendors (Integer IDs)
    if crew.vendor_ids:
        db_crew.vendors = db.query(models.Vendor).filter(models.Vendor.id.in_(crew.vendor_ids)).all()
    else:
        db_crew.vendors = []

    # Handle Dumping Sites (String IDs)
    if crew.dumping_site_ids:
        string_ids = [str(dsid) for dsid in crew.dumping_site_ids]
        db_crew.dumping_sites = db.query(models.DumpingSite).filter(models.DumpingSite.id.in_(string_ids)).all()
    else:
        db_crew.dumping_sites = []

    # Step 4: Commit the session to save all changes
    db.commit()
    db.refresh(db_crew)
    
    return db_crew


@crew_mapping_router.delete("/{crew_id}", status_code=204)
def soft_delete_crew_mapping(crew_id: int, db: Session = Depends(database.get_db)):
    db_crew = db.query(models.CrewMapping).filter(
        models.CrewMapping.id == crew_id, 
        models.CrewMapping.is_deleted == False
    ).first()

    if not db_crew:
        raise HTTPException(status_code=404, detail="Crew mapping not found")

    db_crew.is_deleted = True
    # ✅ CORRECTED: Use func directly from SQLAlchemy
    db_crew.deleted_at = func.now() 
    
    db.commit()
    
    # A 204 No Content response should not return a body
    return


# -------------------------------
# CRUD Routers for Other Models
# -------------------------------
crud_models = [
    {"model": models.User, "schemas": (schemas.UserCreate, schemas.User)},
    {"model": models.Employee, "schemas": (schemas.EmployeeCreate, schemas.Employee)},
    {"model": models.Equipment, "schemas": (schemas.EquipmentCreate, schemas.Equipment)},
    # {"model": models.Vendor, "schemas": (schemas.VendorCreate, schemas.Vendor)},
    {"model": models.Material, "schemas": (schemas.MaterialCreate, schemas.Material)},
    {"model": models.DumpingSite, "schemas": (schemas.DumpingSiteCreate, schemas.DumpingSite)},
]

for item in crud_models:
    model, (create_schema, response_schema) = item["model"], item["schemas"]
    prefix, tags = f"/api/{model.__tablename__}", [model.__tablename__.capitalize()]
    router = create_crud_router(model=model, create_schema=create_schema, response_schema=response_schema, prefix=prefix, tags=tags)
    app.include_router(router)

# -------------------------------
# Include All Other Routers
# -------------------------------
app.include_router(job_phase_router)
app.include_router(crew_mapping_router)
app.include_router(timesheet.router)
app.include_router(equipment.router)
app.include_router(submissions.router)
app.include_router(tickets.router)
app.include_router(review.router)
app.include_router(project_engineer.router)
app.include_router(ocr_main.router)
app.include_router(dropdowns_router)
# ... other routers
app.include_router(job_phases.router)  # ✅ make sure this is here
app.include_router(vendor_options.router)
app.include_router(vendor_router.router)
app.include_router(vendor_materials.router)
# -------------------------------
# Auth Router
# -------------------------------
from . import utils
from fastapi import APIRouter
auth_router = APIRouter(prefix="/api/auth", tags=["Auth"])

@auth_router.post("/login", response_model=schemas.User)
def login(credentials: schemas.LoginRequest, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.username == credentials.username).first()
    if not user or not utils.verify_password(credentials.password, user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")
    return user

app.include_router(auth_router)

# -------------------------------
# Admin Dashboard Data Endpoint
# -------------------------------
@app.get("/api/data", response_model=schemas.AppData, tags=["App Data"])
def get_all_data(db: Session = Depends(database.get_db)):
    return {
        "users": db.query(models.User).all(),
        "employees": db.query(models.Employee).all(),
        "equipment": db.query(models.Equipment).all(),
        "job_phases": db.query(models.JobPhase).all(),
        "materials": db.query(models.Material).all(),
        "vendors": db.query(models.Vendor).all(),
        "dumping_sites": db.query(models.DumpingSite).all(),
    }




app.include_router(
    timesheet.router,
    prefix="/api/timesheets", # This must match the URL your frontend is calling
    tags=["Timesheets"],      # This is for organizing the API docs
)

