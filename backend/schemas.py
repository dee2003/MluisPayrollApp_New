from pydantic import BaseModel, ConfigDict, field_validator, EmailStr
from typing import Optional, List, Any, Dict
from datetime import date
from datetime import date, datetime
from .models import SubmissionStatus
from .models import ResourceStatus
from .models import SubmissionStatus

# --- Shared Pydantic v2 config ---
model_config = ConfigDict(from_attributes=True)

# ===============================
#         GENERIC
# ===============================
class DeleteResponse(BaseModel):
    ok: bool

# ===============================
#         USERS
# ===============================
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from .models import UserRole, ResourceStatus # Make sure enums are imported

# --- User Schemas ---
class UserBase(BaseModel):
    id: int # Keep id here as your create form sends it
    username: str
    email: EmailStr
    first_name: str
    middle_name: Optional[str] = None
    last_name: str
    role: UserRole
    status: ResourceStatus = ResourceStatus.ACTIVE

class UserCreate(UserBase):
    id: int
    password: str

# --- The Correct UserUpdate Schema ---
class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[UserRole] = None
    status: Optional[ResourceStatus] = None # Allows partial status updates

class User(UserBase):
    class Config:
        from_attributes = True


# ===============================
#         EMPLOYEES
# ===============================
class EmployeeBase(BaseModel):
    id: str
    first_name: str
    middle_name: Optional[str] = None
    last_name: str
    class_1: Optional[str] = None   # Must match ORM and API
    class_2: Optional[str] = None
    status: str


class EmployeeCreate(EmployeeBase): 
    pass

class Employee(EmployeeBase):
    model_config = model_config

# ===============================
#         EQUIPMENT
# ===============================
class EquipmentBase(BaseModel):
    id: str
    name: str
    status: str
    vin_number: Optional[str] = None
    category_id: Optional[int]
    department_id: Optional[int]
    model_config = ConfigDict(from_attributes=True)

# Original EquipmentCreate
class EquipmentCreate(BaseModel):
    id: str
    name: str
    category_id: int
    department_id: int
    vin_number: Optional[str] = None
    status: Optional[str] = None

# Original EquipmentUpdate
class EquipmentUpdate(EquipmentBase):
    pass

# Original Category and Department Schemas for nesting
class CategoryBase(BaseModel):
    id: int
    name: str
    number: str
    
    class Config:
        orm_mode = True

class DepartmentBase(BaseModel):
    id: int
    name: str

    class Config:
        orm_mode = True

# --- The Crucial Part ---
# Restoring the original EquipmentInDB and Equipment schemas
class EquipmentInDB(BaseModel):
    id: str
    name: str
    vin_number: Optional[str]
    status: str
    category_id: Optional[int]
    department_id: Optional[int]
    category_rel: Optional[CategoryBase]
    department_rel: Optional[DepartmentBase]

    class Config:
        orm_mode = True

class Equipment(EquipmentBase):
    category_rel: Optional[CategoryBase]
    department_rel: Optional[DepartmentBase]

    class Config:
        orm_mode = True

# --- New Schemas for Creating Department and Category ---
# We still need these for the "Add New" feature

class DepartmentCreate(BaseModel):
    name: str

class CategoryCreate(BaseModel):
    name: str
    number: str
# ===============================
#         MATERIALS
# ===============================
class MaterialBase(BaseModel):
    name: str
    status: Optional[str] = "Active"

class MaterialCreate(MaterialBase): 
    pass

class Material(MaterialBase):
    id: int
    model_config = model_config

# ===============================
#         VENDORS
# ===============================

# from pydantic import BaseModel
# from typing import List, Optional

# # ---------- VendorMaterial Schemas ----------
# class VendorMaterialBase(BaseModel):
#     material: str
#     unit: Optional[str] = None

# class VendorMaterialCreate(VendorMaterialBase):
#     pass

# class VendorMaterialRead(VendorMaterialBase):
#     id: int
#     class Config:
#         orm_mode = True

# # ---------- Vendor Schemas ----------
# class VendorBase(BaseModel):
#     name: str
#     vendor_type: Optional[str]
#     vendor_category: Optional[str]
#     status: Optional[str] = "active"

# class VendorCreate(VendorBase):
#     material_ids: List[int] = []

# class VendorRead(VendorBase):
#     id: int
#     materials: List[VendorMaterialRead] = []
#     class Config:
#         orm_mode = True
# schemas.py
# schemas.py
from pydantic import BaseModel
from typing import List, Optional

class VendorMaterialBase(BaseModel):
    material: str
    unit: str

class VendorMaterialCreate(VendorMaterialBase):
    pass

class VendorMaterialRead(VendorMaterialBase):
    id: int
    material: str
    unit: str
    class Config:
        orm_mode = True

# class VendorMaterialRead(BaseModel):
#     id: int
#     material: str
#     unit: str
#     class Config:
#         orm_mode = True


class VendorCreate(BaseModel):
    id: int
    name: str
    vendor_type: Optional[str] = None
    vendor_category: Optional[str] = None
    status: Optional[str] = None
    material_ids: Optional[List[int]] = []


# 🔹 Vendor (read)
class VendorRead(BaseModel):
    id: int
    name: str
    vendor_type: Optional[str]
    vendor_category: Optional[str]
    status: Optional[str]
    materials: List[VendorMaterialRead] = []

    class Config:
        orm_mode = True




# ===============================
#         JOB PHASES
# ===============================
# In backend/schemas.py

# ... (other imports and schemas)

# ✅ ADD THIS: A schema to represent a single, nested PhaseCode object in the response.
class PhaseCode(BaseModel):
    id: int
    code: str
    description: Optional[str] = None
    unit: Optional[str] = None

    class Config:
        orm_mode = True

# This schema is for CREATING a JobPhase. It correctly uses a list of strings.
class JobPhaseBase(BaseModel):
    job_code: str
    contract_no: Optional[str] = None
    job_description: Optional[str] = None
    project_engineer: Optional[str] = None
    jurisdiction: Optional[str] = None
    location_id: Optional[int] = None
    project_engineer_id: Optional[int] = None  # 👈 new
    project_engineer: Optional[str] = None     # 👈 keep existing
    status: ResourceStatus = ResourceStatus.ACTIVE
    phase_codes: List[str] = []
    jurisdiction: Optional[str] = None         # ✅ add this line



class JobPhaseCreate(JobPhaseBase):
    pass

#class JobPhaseUpdate(BaseModel):

class JobPhaseUpdate(BaseModel):
    contract_no: Optional[str] = None
    job_description: Optional[str] = None
    project_engineer_id: Optional[int] = None  # 👈 new
    project_engineer: Optional[str] = None     # 👈 keep existing
    jurisdiction: Optional[str] = None
    status: Optional[ResourceStatus] = None
    phase_codes: Optional[List[str]] = None


class JobPhase(BaseModel):
    id: int
    job_code: str
    contract_no: Optional[str] = None
    job_description: Optional[str] = None
    project_engineer_id: Optional[int] = None
    project_engineer: Optional[str] = None
    jurisdiction: Optional[str] = None
    status: ResourceStatus
    phase_codes: List[PhaseCode] = []

    class Config:
        orm_mode = True


class LocationBase(BaseModel):
    name: str

class LocationOut(LocationBase):
    id: int
    class Config:
        orm_mode = True

# ... (JobPhase response schema)
class DumpingSiteBase(BaseModel):
    id: str
    name: str
    status: str = "Active"

class DumpingSiteCreate(DumpingSiteBase):
    pass

class DumpingSiteUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None

class DumpingSite(DumpingSiteBase):
    class Config:
        orm_mode = True
# ===============================
#         CREW MAPPING
# ===============================
class CrewMappingCreate(BaseModel):
    foreman_id: int
    employee_ids: List[str] = []
    equipment_ids: List[str] = []
    material_ids: List[int] = []
    vendor_ids: List[int] = []
    dumping_site_ids: List[str] = [] # Should be list of strings to match model
    status: Optional[str] = "Active"


class CrewMapping(BaseModel):
    id: int
    foreman_id: Optional[int] = None
    employee_ids: List[str]
    equipment_ids: List[str]
    material_ids: List[int]
    vendor_ids: List[int]
    dumping_site_ids: List[str] = []
    status: Optional[str] = "Active"  # ✅ Add this line
    model_config = model_config



    @field_validator(
        'employee_ids', 'equipment_ids', 'material_ids', 'vendor_ids', 'dumping_site_ids',
        mode='before'
    )
    @classmethod
    def ensure_list(cls, v, info) -> List[Any]:
        if v is None:
            return []
        int_fields = ['material_ids', 'vendor_ids']
        is_int_field = info.field_name in int_fields

        # If already a list, cast items
        if isinstance(v, list):
            return [int(item) if is_int_field else str(item) for item in v]

        # If string (CSV), split into list
        if isinstance(v, str):
            items = []
            for item in v.split(','):
                item = item.strip()
                if not item:
                    continue
                try:
                    items.append(int(item) if is_int_field else str(item))
                except (ValueError, TypeError):
                    continue
            return items

        # If single int or str, wrap in list
        return [int(v)] if is_int_field else [str(v)]
       

class Vendor(BaseModel):
    id: int
    name: str
    vendor_type: Optional[str]
    vendor_category: Optional[str]
    status: Optional[str]

    model_config = ConfigDict(from_attributes=True)

    
class CrewMappingResponse(BaseModel):
    id: int
    foreman_id: int
    status: Optional[str]

    # These fields match the SQLAlchemy relationship names
    employees: List[Employee] = []
    equipment: List[Equipment] = []
    materials: List[Material] = []
    vendors: List[Vendor] = []
    dumping_sites: List[DumpingSite] = []

    model_config = ConfigDict(from_attributes=True)

# ===============================
#         TIMESHEETS
# ===============================
class TimesheetJobData(BaseModel):
    job_code: str
    phase_codes: List[str]

class CrewData(BaseModel):
    employees: Optional[List[Any]] = []
    equipment: Optional[List[Any]] = []
    materials: Optional[List[Any]] = []
    vendors: Optional[List[Any]] = []

class TimesheetNestedData(BaseModel):
    job: TimesheetJobData
    employees: Optional[List[Any]] = []
    equipment: Optional[List[Any]] = []
    materials: Optional[List[Any]] = []
    vendors: Optional[List[Any]] = []

class TimesheetBase(BaseModel):
    foreman_id: int
    date: date
    data: Dict[str, Any]

class TimesheetCreate(TimesheetBase):
    status: str = "PENDING"  # <--- PROBLEM: Uppercase default value
    job_phase_id: Optional[int] = None



class TimesheetUpdate(BaseModel):
    data: Optional[Dict[str, Any]] = None
    status: Optional[SubmissionStatus] = None
    date: Optional[date] = None

    @field_validator("status", mode="before")
    @classmethod
    def normalize_status(cls, v):
        if isinstance(v, str):
            v = v.strip().upper()
            if v in SubmissionStatus.__members__:
                return SubmissionStatus[v]
        return v

class TimesheetFileBase(BaseModel):
    file_path: str
class TimesheetFile(BaseModel):
    id: int
    timesheet_id: int
    foreman_id: int
    file_path: str
    created_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)
# In schemas.py

# In schemas.py

class Timesheet(BaseModel):
    id: int
    foreman_id: int
    date: date
    timesheet_name: Optional[str]
    data: Dict[str, Any]
    status: str                 # <-- ADD THIS FIELD
    files: List[TimesheetFile] = []
    
    model_config = ConfigDict(from_attributes=True)




class TimesheetResponse(BaseModel):
    id: int
    date: date
    foreman_id: int
    foreman_name: str
    data: Dict[str, Any]
    job_name: str
    model_config = model_config


# ===============================
#         APP DATA
# ===============================
class AppData(BaseModel):
    users: List[User]
    employees: List[Employee]
    equipment: List[Equipment]
    job_phases: List[JobPhase]
    materials: List[Material]
    vendors: List[Vendor]

class LoginRequest(BaseModel):
    username: str
    password: str
# class DailySubmissionBase(BaseModel):
#     date: date
#     foreman_id: int
#     job_code: Optional[str] = None
#     total_hours: float
#     ticket_count: int
#     status: SubmissionStatus
# class DailySubmission(DailySubmissionBase):
#     id: int
    
    # Denormalized read-only fields for the supervisor dashboard
    # foreman_name: str
    # job_name: Optional[str] = None  # optional convenience if you resolve job name server-side

    # class Config:
    #     from_attributes = True  # pydantic v2; use orm_mode=True for pydantic v1
# class DailySubmissionCreate(BaseModel):
#     date: date
#     timesheet_ids: List[int]
#     ticket_ids: List[int] = []      # if you have tickets
#     job_code: Optional[str] = None  # optional


# For supervisor requesting changes
class RequestChanges(BaseModel):
    note: str
# C:\admin_webpage\backend\schemas.py

# ... (keep all your existing imports and schemas)
from datetime import date
from typing import List, Optional

# ===============================
#     	SUPERVISOR REVIEW
# ===============================

class Notification(BaseModel):
    """Data for each foreman card on the supervisor dashboard."""
    id: int
    foreman_id: int
    foreman_name: str
    foreman_email: str
    date: date
    ticket_count: int
    timesheet_count: int
    job_code: Optional[str] = None

class UnreviewedItem(BaseModel):
    """Details of items blocking submission."""
    foreman_name: str
    count: int

class ValidationResponse(BaseModel):
    """Response for the pre-submission status check."""
    can_submit: bool
    unreviewed_timesheets: List[UnreviewedItem] = []
    incomplete_tickets: List[UnreviewedItem] = []

from typing import Optional
from datetime import datetime

class TicketBase(BaseModel):
    foreman_id: int
    job_phase_id: int
    image_path: str
    extracted_text: Optional[str] = None
    status: Optional[str] = "PENDING"
    timesheet_id: Optional[int] = None
    phase_code_id: Optional[int] = None  # ✅ NEW

class TicketCreate(TicketBase):
    pass

class Ticket(BaseModel):
    id: int
    foreman_id: int
    job_phase_id: int
    image_path: str
    extracted_text: Optional[str] = None
    status: str
    created_at: Optional[datetime]
    timesheet_id: Optional[int]
    
    # ✅ Include the full phase code object (code, description, unit)
    phase_code: Optional[PhaseCode] = None

    model_config = ConfigDict(from_attributes=True)
class TicketUpdatePhase(BaseModel):
    phase_code_id: int

    class Config: True  # replaces orm_mode in Pydantic v2
class PhaseCodeSchema(BaseModel):
    id: int
    code: str
    description: Optional[str]

    class Config:
        from_attributes = True


class TicketSummary(BaseModel):
    id: int
    image_path: str
    phase_code_id: Optional[int]
    phase_code: Optional[PhaseCodeSchema] = None

    class Config:
        from_attributes = True




class TimesheetSummary(BaseModel):
    id: int
    foreman_id: int
    date: str
    

    class Config:
        orm_mode = True

class SubmissionDataResponse(BaseModel):
    tickets: List[TicketSummary]
    timesheets: List[TimesheetSummary]


from datetime import date
from typing import Optional

class PENotification(BaseModel):
    id: int
    supervisor_id: int
    supervisor_name: str
    date: date
    job_code: Optional[str]
    timesheet_count: int
    ticket_count: int
from datetime import date
from typing import Optional
class PENotification(BaseModel):
    id: int
    supervisor_id: int
    supervisor_name: str
    date: date
    job_code: Optional[str]
    timesheet_count: int
    ticket_count: int




from typing import Optional

class SupplierBase(BaseModel):
    concrete_supplier: Optional[str]
    asphalt_supplier: Optional[str]
    aggregate_supplier: Optional[str]
    top_soil_supplier: Optional[str]

class SupplierCreate(SupplierBase):
    pass

class Supplier(SupplierBase):
    id: int
    class Config:
        orm_mode = True
class TimesheetCountsResponse(BaseModel):
    foreman: int
    supervisor: int
    project_engineer: int