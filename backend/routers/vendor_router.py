print("✅ vendor_router.py has been loaded!")
import os
print("📂 Loaded vendor_router from:", os.path.abspath(__file__))

from fastapi import APIRouter, Depends, HTTPException, status,  Body
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas, database
from ..schemas import VendorCreate, MaterialCreate
from .. import crud
from ..database import get_db
from sqlalchemy.orm import joinedload
from sqlalchemy import text

router = APIRouter(prefix="/api", tags=["Vendors"])

from backend.models import vendor_material_link
print("🧩 Table in metadata:", vendor_material_link.name in vendor_material_link.metadata.tables)



@router.post("/vendors/", response_model=schemas.VendorRead, status_code=status.HTTP_201_CREATED)
def create_vendor(vendor_data: schemas.VendorCreate, db: Session = Depends(database.get_db)):
    """Create a new vendor and link selected materials."""
    
    # Create vendor record
    vendor = models.Vendor(
        id=vendor_data.id,
        name=vendor_data.name,
        vendor_type=vendor_data.vendor_type,
        vendor_category=vendor_data.vendor_category,
        status=vendor_data.status.upper() if vendor_data.status else "ACTIVE"
    )

    db.add(vendor)
    db.flush()  # Ensures vendor.id is available before linking materials

    # Link materials if provided
    if vendor_data.material_ids:
        vendor.materials = db.query(models.VendorMaterial).filter(
            models.VendorMaterial.id.in_(vendor_data.material_ids)
        ).all()


        if not vendor.materials:
            raise HTTPException(status_code=404, detail="No valid materials found.")
        
        vendor.materials = vendor.materials

    db.commit()
    db.refresh(vendor)
    return vendor


from sqlalchemy.orm import selectinload

@router.get("/vendors", response_model=List[schemas.VendorRead])
def get_vendors(db: Session = Depends(database.get_db)):
    vendors = db.query(models.Vendor).options(
        selectinload(models.Vendor.materials)
    ).all()
    return vendors
