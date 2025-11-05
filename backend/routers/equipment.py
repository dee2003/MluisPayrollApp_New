
# /app/routes/equipment.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..schemas import EquipmentCreate, EquipmentUpdate, EquipmentInDB
from ..models import Equipment
from fastapi import FastAPI, HTTPException, Depends
from sqlalchemy.orm import joinedload
from typing import List
from ..models import AuditAction
from backend.utils.audit_decorator import audit
router = APIRouter(
    prefix="/api/equipment",
    tags=["Equipment"]
)
# @router.get("/")
@router.get("/", response_model=List[schemas.EquipmentInDB])
def get_equipment(db: Session = Depends(get_db)):
    equipments = (
        db.query(models.Equipment)
        .options(
            joinedload(models.Equipment.category_rel),
            joinedload(models.Equipment.department_rel)
        )
        .filter(models.Equipment.status == "Active")
        .all()
    )
    return equipments


# In your FastAPI equipment router file
@router.put("/equipment/{equipment_id}", response_model=EquipmentInDB)
@audit(AuditAction.UPDATED, "Equipment")
def update_equipment(equipment_id: str, equipment: EquipmentUpdate, db: Session = Depends(get_db)):
    db_equipment = db.query(models.Equipment).filter(models.Equipment.id == equipment_id).first()
    if not db_equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    # Update the model with data from the request
    update_data = equipment.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_equipment, key, value)
    db.add(db_equipment)


    db.commit()
    db.refresh(db_equipment)
    # Return the fully updated object
    return db_equipment