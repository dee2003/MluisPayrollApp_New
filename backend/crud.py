# backend/crud.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Type, TypeVar, List
from fastapi.encoders import jsonable_encoder
from . import crew_services  # ✅ --- ADD THIS LINE ---

from . import models, schemas, utils
from .database import get_db
from sqlalchemy.orm import joinedload
# =======================================================================
# 1. Generic CRUD Router Factory
# =======================================================================

# --- Generic Type Variables ---
ModelType = TypeVar("ModelType", bound=models.Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
ResponseSchemaType = TypeVar("ResponseSchemaType", bound=BaseModel)

def create_crud_router(
    *,
    model: Type[ModelType],
    create_schema: Type[CreateSchemaType],
    response_schema: Type[ResponseSchemaType],
    prefix: str,
    tags: List[str]
) -> APIRouter:
    """
    A factory that creates a set of CRUD endpoints for a given SQLAlchemy model.
    It now includes logic to snapshot crew configurations when a resource's status changes.
    """
    router = APIRouter(prefix=prefix, tags=tags)

    # --- Automatically determine the primary key name and type ---
    pk_column = model.__mapper__.primary_key[0]
    pk_name = pk_column.name
    pk_type = pk_column.type.python_type

    # --- CREATE ---
    @router.post("/", response_model=response_schema, status_code=status.HTTP_201_CREATED)
    def create_item(item: create_schema, db: Session = Depends(get_db)):
        item_data = item.dict()
        
        # Check for duplicate primary key
        pk_value = item_data.get(pk_name)
        if pk_value and db.query(model).filter(pk_column == pk_value).first():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"{model.__name__} with {pk_name} '{pk_value}' already exists."
            )

        # Automatically hash passwords for the User model
        if model.__name__ == "User" and "password" in item_data:
            item_data["password"] = utils.hash_password(item_data["password"])
        
        db_item = model(**item_data)
        db.add(db_item)
        db.commit()
        db.refresh(db_item)
        return db_item

    # --- READ ALL ---
    # @router.get("/", response_model=List[response_schema])
    # def list_items(db: Session = Depends(get_db)):
    #     query = db.query(model)
    #     if hasattr(model, 'status'):
    #     # Filter the query to only include items where the status is not 'inactive'.
    #         query = query.filter(model.status != models.ResourceStatus.INACTIVE)
    #     return db.query(model).all()
    @router.get("/", response_model=List[response_schema])
    def list_items(db: Session = Depends(get_db)):
        query = db.query(model)
        if model.__name__ == "Equipment":
            query = query.options(
                orm.joinedload(model.category_rel),
                orm.joinedload(model.department_rel),
            )
        if hasattr(model, 'status'):
            query = query.filter(model.status != models.ResourceStatus.INACTIVE)
        return query.all()

    # --- READ ONE ---
    @router.get("/{item_id}", response_model=response_schema)
    def read_item(item_id: pk_type, db: Session = Depends(get_db)):
        db_item = db.query(model).filter(pk_column == item_id).first()
        if not db_item:
            raise HTTPException(status_code=404, detail=f"{model.__name__} not found")
        return db_item


    @router.put("/{item_id}", response_model=response_schema)
    def update_item(item_id: pk_type, item: create_schema, db: Session = Depends(get_db)):
        db_item = db.query(model).filter(pk_column == item_id).first()
        if not db_item:
            raise HTTPException(status_code=404, detail=f"{model.__name__} not found")
        
        update_data = item.dict(exclude_unset=True)

        resource_models = ["Employee", "Equipment", "Material", "Vendor", "DumpingSite"]
        is_resource_status_change = (
            model.__name__ in resource_models and
            "status" in update_data and
            hasattr(db_item, "status") and
            getattr(db_item.status, "value", db_item.status) != update_data["status"]
        )

        if is_resource_status_change:
            new_status = update_data["status"]
            current_user_id = 1  # placeholder for auth
            print(f"✅ Status change detected for {model.__name__} {item_id}: {db_item.status} -> {new_status}")

            relationship_attr = getattr(models.CrewMapping, model.__tablename__)
            crews_to_update = db.query(models.CrewMapping).filter(relationship_attr.any(id=item_id)).all()

            for crew in crews_to_update:
                if new_status.lower() == "inactive":
                    notes = f"{model.__name__} '{item_id}' status changed to Inactive."
                    crew_services.create_crew_snapshot(db, crew.id, user_id=current_user_id, notes=notes)
                    crew.status = "Partially Inactive"
                    member_list = getattr(crew, model.__tablename__)
                    filtered_list = [member for member in member_list if member.id != item_id]
                    setattr(crew, model.__tablename__, filtered_list)

                elif new_status.lower() == "active":
                    latest_ref = db.query(models.CrewMappingReference).filter(
                        models.CrewMappingReference.crew_mapping_id == crew.id
                    ).order_by(models.CrewMappingReference.created_at.desc()).first()
                    if latest_ref:
                        crew_services.restore_from_reference(db, latest_ref.id)
                    crew.status = "Active"

            # ✅ Persist the new status safely
            db_item.status = new_status

        # ✅ Now update the rest safely (but skip status to prevent overwrite)
        for key, value in update_data.items():
            if key != "status":
                setattr(db_item, key, value)
            if is_resource_status_change:
                print(f"✅ Status change detected for {model.__name__} {item_id}: {db_item.status} -> {update_data['status']}")

        db.commit()
        db.refresh(db_item)
        return db_item


    # --- UPDATE ---
    # @router.put("/{item_id}", response_model=response_schema)
    # def update_item(item_id: pk_type, item: create_schema, db: Session = Depends(get_db)):
    #     db_item = db.query(model).filter(pk_column == item_id).first()
    #     if not db_item:
    #         raise HTTPException(status_code=404, detail=f"{model.__name__} not found")
        
    #     update_data = item.dict(exclude_unset=True)

    #     # 👇 ===== START OF SNAPSHOT INTEGRATION LOGIC ===== 👇
        
    #     resource_models = ["Employee", "Equipment", "Material", "Vendor", "DumpingSite"]
    #     is_resource_status_change = (
    #         model.__name__ in resource_models and
    #         'status' in update_data and
    #         hasattr(db_item, 'status') and 
    #         db_item.status.value != update_data['status']
    #     )

    #     if is_resource_status_change:
    #         new_status = update_data['status']
    #         current_user_id = 1  # Placeholder for logged-in user ID from auth dependency

    #         # Dynamically access the relationship on CrewMapping (e.g., CrewMapping.employees)
    #         relationship_attr = getattr(models.CrewMapping, model.__tablename__)
    #         crews_to_update = db.query(models.CrewMapping).filter(relationship_attr.any(id=item_id)).all()

    #         for crew in crews_to_update:
    #             if new_status.lower() == 'inactive':
    #                 notes = f"{model.__name__} '{item_id}' status changed to Inactive."
    #                 crew_services.create_crew_snapshot(db, crew.id, user_id=current_user_id, notes=notes)
                    
    #                 crew.status = "Partially Inactive"
    #                 # Dynamically get the list of members from the crew object and filter it
    #                 member_list = getattr(crew, model.__tablename__)
    #                 filtered_list = [member for member in member_list if member.id != item_id]
    #                 setattr(crew, model.__tablename__, filtered_list)

    #             elif new_status.lower() == 'active':
    #                 latest_ref = db.query(models.CrewMappingReference).filter(
    #                     models.CrewMappingReference.crew_mapping_id == crew.id
    #                 ).order_by(models.CrewMappingReference.created_at.desc()).first()

    #                 if latest_ref:
    #                     crew_services.restore_from_reference(db, latest_ref.id)
    #                 crew.status = "Active"
        
    #     # 👆 ===== END OF SNAPSHOT INTEGRATION LOGIC ===== 👆

    #     # Apply the original update to the resource itself
    #     for key, value in update_data.items():
    #         setattr(db_item, key, value)
            
    #     db.commit()
    #     db.refresh(db_item)
    #     return db_item

    # --- DELETE ---
    @router.delete("/{item_id}")
    def delete_item(item_id: pk_type, db: Session = Depends(get_db)):
        db_item = db.query(model).filter(pk_column == item_id).first()
        if not db_item:
            raise HTTPException(status_code=404, detail=f"{model.__name__} not found")
        
        db.delete(db_item)
        db.commit()
        return {"ok": True, "deleted_id": item_id}

    return router

# =======================================================================
# 2. Specific CRUD Functions (For Custom Routers)
# =======================================================================

def create_timesheet(db: Session, ts: schemas.TimesheetCreate):
    """Creates a new timesheet, extracting job_name for easier querying."""
    data_to_store = jsonable_encoder(ts.data)
    job_description = ts.data.get("job_name")

    db_ts = models.Timesheet(
        foreman_id=ts.foreman_id,
        date=ts.date,
        timesheet_name=job_description,
        data=data_to_store,
        sent=False
    )
    db.add(db_ts)
    db.commit()
    db.refresh(db_ts)
    return db_ts

# In crud.py
from sqlalchemy import orm  # <--- ADD THIS LINE

# In backend/crud.py

# Make sure you have these imports at the top of the file
from sqlalchemy import orm
from . import models, schemas

def get_crew_mapping(db: Session, foreman_id: int):
    """
    Retrieves all resources for a foreman's crew mapping by directly
    accessing the SQLAlchemy relationships.
    """
    # Use eager loading to fetch all related items in a single, efficient query
    mapping = db.query(models.CrewMapping).options(
        orm.selectinload(models.CrewMapping.employees),
        orm.selectinload(models.CrewMapping.equipment),
        orm.selectinload(models.CrewMapping.materials),
        orm.selectinload(models.CrewMapping.vendors),
        orm.selectinload(models.CrewMapping.dumping_sites)
    ).filter(models.CrewMapping.foreman_id == foreman_id).first()

    if not mapping:
        return None # Or return a default empty structure if the frontend expects it

    # --- THE FIX IS HERE ---
    # The 'mapping' object already contains the lists of employees, equipment, etc.
    # We just need to ensure the returned dictionary includes the mapping's own ID and status.
    return {
        "id": mapping.id, # <--- ADD THIS LINE
        "foreman_id": foreman_id,
        "status": mapping.status, # <--- ADD THIS LINE
        "employees": mapping.employees,
        "equipment": mapping.equipment,
        "materials": mapping.materials,
        "vendors": mapping.vendors,
        "dumping_sites": mapping.dumping_sites,
    }
