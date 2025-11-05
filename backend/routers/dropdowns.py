from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from ..database import get_db
from .. import models

router = APIRouter(prefix="/api", tags=["Dropdown Data"])

# Pydantic schemas

class DepartmentOut(BaseModel):
    id: int
    name: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class CategoryOut(BaseModel):
    id: int
    name: str
    number: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class LocationBase(BaseModel):
    name: str

class LocationOut(LocationBase):
    id: int
    class Config:
        orm_mode = True

# Routes to fetch departments and categories

@router.get("/departments/", response_model=List[DepartmentOut])
def get_departments(db: Session = Depends(get_db)):
    return db.query(models.Department).all()

@router.get("/categories/", response_model=List[CategoryOut])
def get_categories(db: Session = Depends(get_db)):
    return db.query(models.Category).all()

@router.get("/locations/", response_model=List[LocationOut])
def get_locations(db: Session = Depends(get_db)):
    return db.query(models.Location).all()



class SupplierOut(BaseModel):
    id: int
    concrete_supplier: Optional[str]
    asphalt_supplier: Optional[str]
    aggregate_supplier: Optional[str]
    top_soil_supplier: Optional[str]

    model_config = ConfigDict(from_attributes=True)

@router.get("/suppliers/", response_model=List[SupplierOut])
def get_suppliers(db: Session = Depends(get_db)):
    return db.query(models.Supplier).all()



# @router.get("/vendor-options/{option_type}", response_model=List[str])
# def get_vendor_options(option_type: str, db: Session = Depends(get_db)):
#     options = (
#         db.query(models.VendorOption)
#         .filter(models.VendorOption.option_type == option_type)
#         .all()
#     )
#     return [opt.value for opt in options]


# @router.post("/vendor-options/{option_type}")
# def add_vendor_option(option_type: str, value: str, db: Session = Depends(get_db)):
#     db.add(models.VendorOption(option_type=option_type, value=value))
#     db.commit()
#     return {"message": f"{value} added to {option_type}"}
