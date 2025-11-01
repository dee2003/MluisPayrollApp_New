# backend/audit_service.py

from sqlalchemy.orm import Session
from . import models, schemas
from .models import AuditAction  # Make sure your enums are accessible

def create_audit_log(
    db: Session,
    *,
    user_id: int,
    action: AuditAction,
    target_model: str,
    target_id: int,
    details: str = None
):
    """
    Creates and saves a new audit log entry.
    """
    audit_entry = models.AuditLog(
        user_id=user_id,
        action=action,
        target_model=target_model,
        target_id=target_id,
        details=details
    )
    db.add(audit_entry)
    # The commit will happen as part of the main transaction
    # in the calling function, so no db.commit() here.
    return audit_entry
