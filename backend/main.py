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
from sqlalchemy import and_
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
TICKETS_DIR = r"C:\Mluis_App\mluis_app\backend\tickets"
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
# job_phase_router = APIRouter(prefix="/api/job-phases", tags=["Job Phases"])


crew_mapping_router = APIRouter(prefix="/api/crew-mapping", tags=["Crew Mapping"])

def parse_ids(id_string: str):
    if not id_string:
        return []
    return [item.strip() for item in id_string.split(",") if item.strip()]

def list_to_csv(id_list: List):
    return ",".join(map(str, id_list))

@crew_mapping_router.get("/", response_model=List[schemas.CrewMappingResponse])
def list_crew_mappings(db: Session = Depends(database.get_db)):
    """Lists all non-deleted and ACTIVE crew mappings."""
    return db.query(models.CrewMapping).filter(
        models.CrewMapping.is_deleted == False,
        # --- ADD THIS FILTER ---
        models.CrewMapping.status == 'Active' # Assuming status is a string here
    ).all()
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
# In backend/main.py

# -------------------------------
# Dedicated User Router
# -------------------------------
user_router = APIRouter(prefix="/api/users", tags=["Users"])

@user_router.post("/", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
def create_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    """
    Creates a new user with a manually provided ID.

    This endpoint performs three crucial validation checks before creating the user:
    1.  Ensures the provided 'id' is unique.
    2.  Ensures the provided 'email' is unique.
    3.  Ensures the provided 'username' is unique.
    """
    # 1. Validate that the manually provided ID is unique
    if db.query(models.User).filter(models.User.id == user.id).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"User with ID {user.id} already exists."
        )

    # 2. Validate that the email is unique
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This email address is already registered."
        )

    # 3. Validate that the username is unique
    if db.query(models.User).filter(models.User.username == user.username).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This username is already taken."
        )

    # Hash the password before storing
    hashed_password = utils_comman.hash_password(user.password)

    # Create a new User database model instance using the validated data
    new_user = models.User(
        id=user.id,
        username=user.username,
        email=user.email,
        password=hashed_password,
        first_name=user.first_name, # Corresponds to your schema
        middle_name=user.middle_name, # Corresponds to your schema
        last_name=user.last_name, # Corresponds to your schema
        role=user.role,
        status=user.status
    )
    
    # Add to session, commit to the database, and refresh to get the new state
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    """
    Retrieves a list of ONLY ACTIVE users.
    """
    # --- ADD THIS FILTER ---
    users = db.query(models.User).filter(
        models.User.status == models.ResourceStatus.ACTIVE
    ).offset(skip).limit(limit).all()
    
    return users

# --- The Correct Update Endpoint for Users ---
@user_router.put("/{user_id}", response_model=schemas.User)
def update_user(
    user_id: int,
    user_update: schemas.UserUpdate, # This uses the correct schema
    db: Session = Depends(database.get_db)
):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = user_update.model_dump(exclude_unset=True)
    if not update_data:
        return db_user

    for field, value in update_data.items():
        setattr(db_user, field, value)

    db.commit()
    db.refresh(db_user)
    return db_user

@user_router.get("/role/{role_name}", response_model=List[schemas.User])
def get_active_users_by_role(role_name: str, db: Session = Depends(database.get_db)):
    """
    Retrieves all ACTIVE users for the given role (case-insensitive input).
    Works even when DB columns are ENUM types.
    """
    valid_roles = ["foreman", "supervisor", "project_engineer", "admin", "accountant"]
    role_name_clean = role_name.strip().upper()

    if role_name.lower() not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Role '{role_name}' is not a valid role."
        )

    # Match ENUM directly using uppercase string
    active_users_in_role = db.query(models.User).filter(
        and_(
            models.User.role == role_name_clean,
            models.User.status == "ACTIVE"
        )
    ).all()

    return active_users_in_role
@user_router.get("/{user_id}", response_model=schemas.User)
def get_user(user_id: int, db: Session = Depends(database.get_db)):
    """
    Retrieve a single user by ID.
    """
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

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
    # {"model": models.User, "schemas": (schemas.UserCreate, schemas.User)},
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
app.include_router(user_router) # <--- ADD THIS LINE
# app.include_router(job_phase_router)
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
from . import utils_comman
from fastapi import APIRouter
auth_router = APIRouter(prefix="/api/auth", tags=["Auth"])

@auth_router.post("/login", response_model=schemas.User)
def login(credentials: schemas.LoginRequest, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.username == credentials.username).first()
    if not user or not utils_comman.verify_password(credentials.password, user.password):
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




# -------------------------------
# Dedicated User Router
# -------------------------------
