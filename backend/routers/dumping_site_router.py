from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from .. import schemas, models, crud, database
from typing import List
router = APIRouter(prefix="/api/dumping_sites", tags=["Dumping Sites"])


@router.post("/", response_model=schemas.DumpingSiteRead)
def create_site(site: schemas.DumpingSiteCreate, db: Session = Depends(database.get_db)):
    return crud.create_dumping_site(db, site)


@router.get("/", response_model=List[schemas.DumpingSiteRead])
def get_sites(db: Session = Depends(database.get_db)):
    return crud.get_all_dumping_sites(db)


@router.put("/{site_id}/", response_model=schemas.DumpingSiteRead)
def update_site(site_id: str, site: schemas.DumpingSiteUpdate, db: Session = Depends(database.get_db)):
    return crud.update_dumping_site(db, site_id, site)



@router.delete("/{site_id}/")
def delete_site(site_id: str, db: Session = Depends(database.get_db)):
    return crud.delete_dumping_site(db, site_id)


# 🔹 Options (type/category)
@router.get("/options/")
def get_options(option_type: str = Query(...), db: Session = Depends(database.get_db)):
    return crud.get_dumping_site_options(db, option_type)


@router.post("/options/")
def create_option(option_type: str = Query(...), value: str = Query(...), db: Session = Depends(database.get_db)):
    return crud.create_dumping_site_option(db, option_type, value)
