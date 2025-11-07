from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import crud, schemas, database

router = APIRouter(
    prefix="/api/materials-trucking",
    tags=["Materials & Trucking"]
)

# -----------------------------
# GET all
# -----------------------------
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import crud, database, schemas
from ..schemas import MaterialsTruckingUpdate

router = APIRouter(prefix="/api/materials-trucking", tags=["Materials & Trucking"])

@router.post("/", response_model=schemas.MaterialTruckingRead)
def create_material_trucking(material_data: schemas.MaterialTruckingCreate, db: Session = Depends(database.get_db)):
    return crud.create_material_trucking(db, material_data)

@router.get("/", response_model=list[schemas.MaterialTruckingRead])
def get_all_material_trucking(db: Session = Depends(database.get_db)):
    return crud.get_all_material_trucking(db)

# router.py
@router.put("/{material_id}/", response_model=schemas.MaterialTruckingRead)
def update_material(material_id: int, material: MaterialsTruckingUpdate, db: Session = Depends(database.get_db)):
    return crud.update_material_trucking(db, material_id, material)


@router.delete("/{material_id}")
def delete_material_trucking(id: int, db: Session = Depends(database.get_db)):
    deleted = crud.delete_material_trucking(db, id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Record not found")
    return {"message": "Deleted successfully"}

