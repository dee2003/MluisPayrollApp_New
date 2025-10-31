


# # routers/job_phases.py
# from fastapi import APIRouter, Depends, HTTPException
# from sqlalchemy.orm import Session
# from typing import List
# from pydantic import BaseModel

# from .. import models, schemas
# from ..database import get_db

# router = APIRouter(prefix="/api/job-phases", tags=["Job Phases"])

# class JobPhaseCreate(BaseModel):
#     phase_codes: List[str]

# @router.post("/{job_code}")
# def create_or_update_job_phases(job_code: str, payload: JobPhaseCreate, db: Session = Depends(get_db)):
#     job = db.query(models.JobPhases).filter_by(job_code=job_code).first()

#     if job:
#         job.phase_codes = payload.phase_codes
#     else:
#         job = models.JobPhases(job_code=job_code, phase_codes=payload.phase_codes)

#     db.add(job)
#     db.commit()
#     db.refresh(job)
#     return {"job_code": job.job_code, "phase_codes": job.phase_codes}


# @router.get("/{job_code}")
# def get_job_phases(job_code: str, db: Session = Depends(get_db)):
#     job = db.query(models.JobPhases).filter_by(job_code=job_code).first()
#     if not job:
#         raise HTTPException(status_code=404, detail="Job not found")
#     return {"job_code": job.job_code, "phase_codes": job.phase_codes}
