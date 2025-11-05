from functools import wraps
from .. import audit_service, models
from ..database import get_db
from fastapi import Depends

def audit(action, entity=None):
    """
    Decorator to automatically create an audit log after a successful operation.
    Example:
        @audit(action="created", entity="JobPhase")
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            db = None
            for arg in args:
                if hasattr(arg, "query"):  # crude check for SQLAlchemy Session
                    db = arg
                    break
            if not db and "db" in kwargs:
                db = kwargs["db"]

            result = func(*args, **kwargs)

            # Log to the audit table (optional)
            try:
                audit_service.create_audit_log(
                    db=db,
                    user_id=1,  # TODO: replace with actual user_id from auth/session
                    action=action,
                    target_model=entity or func.__name__,
                    target_id=getattr(result, "id", None),
                    details=f"{action.capitalize()} {entity or func.__name__}"
                )
                db.commit()
            except Exception as e:
                print(f"[Audit] Failed to log: {e}")

            return result
        return wrapper
    return decorator
