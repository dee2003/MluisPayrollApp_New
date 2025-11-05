
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import CrewMappingManager from './CrewMappingManager';
import "./CrewMapping.css";
// Corrected: Cleaned up imports and added icons for sidebar toggle
import { FaUser, FaHardHat, FaTasks, FaBox, FaBriefcase, FaUsers, FaTrash, FaBars, FaTimes,FaTachometerAlt  } from 'react-icons/fa';
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import TimesheetCounts from './TimesheetCounts';

const API_URL = "http://127.0.0.1:8000/api";
const ITEMSPERPAGE = 2; // You can change 10 to any number you like

// Pagination controls component (reusable)
const PaginationControls = ({ currentPage, totalPages, onPaginate }) => {
  if (totalPages <= 1) return null;
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
  return (
    <nav className="pagination-controls" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '16px 0' }}>
      <button onClick={() => onPaginate(currentPage - 1)} disabled={currentPage === 1} className="btn btn-sm">
        <FaChevronLeft /> Prev
      </button>
      <ul className="pagination-list" style={{ display: "inline-flex", listStyle: "none", margin: '0 8px' }}>
        {pageNumbers.map(number => (
          <li key={number} style={{ margin: "0 2px" }}>
            <button
              onClick={() => onPaginate(number)}
              className={`page-link${currentPage === number ? " active" : ""}`}
              style={{
                minWidth: 32,
                padding: '6px 12px',
                background: currentPage === number ? '#007bff' : "#fff",
                color: currentPage === number ? '#fff' : "#333",
                border: '1px solid #ccc',
                borderRadius: '4px',
                marginRight: 2,
                fontWeight: 500
              }}
            >
              {number}
            </button>
          </li>
        ))}
      </ul>
      <button onClick={() => onPaginate(currentPage + 1)} disabled={currentPage === totalPages} className="btn btn-sm">
        Next <FaChevronRight />
      </button>
    </nav>
  );
};

// --- Reusable Modal Component (Unchanged) ---
const Modal = ({ title, children, onClose, size = "medium" }) => (
    <div className="modal">
        <div className={`modal-content ${size}`}>
            <div className="modal-header">
                <h3>{title}</h3>
                <button onClick={onClose} className="btn-sm btn-outline">×</button>
            </div>
            <div className="modal-body-scrollable">{children}</div>
        </div>
    </div>
);

// --- Notification & Confirmation Modals (Unchanged) ---
const NotificationModal = ({ message, onClose }) => (
    <div className="modal">
        <div className="modal-content small">
            <div className="modal-header">
                <h3>Notification</h3>
                <button onClick={onClose} className="btn-sm btn-outline">×</button>
            </div>
            <div className="modal-body"><p>{message}</p></div>
            <div className="modal-actions" style={{ justifyContent: 'center' }}>
                <button onClick={onClose} className="btn btn-primary">OK</button>
            </div>
        </div>
    </div>
);

const ConfirmationModal = ({ message, onConfirm, onCancel }) => (
    <div className="modal">
        <div className="modal-content small">
            <div className="modal-header">
                <h3>Confirmation</h3>
                <button onClick={onCancel} className="btn-sm btn-outline">×</button>
            </div>
            <div className="modal-body"><p>{message}</p></div>
            <div className="modal-actions">
                <button onClick={onCancel} className="btn btn-outline">Cancel</button>
                <button onClick={onConfirm} className="btn btn-danger">Confirm</button>
            </div>
        </div>
    </div>
);

const getIconForSection = (sec) => {
    switch(sec) {
        case 'dashboard': return <FaTachometerAlt />; // <= ADD THIS CASE
        case "users": return <FaUser />;
        case "employees": return <FaUser />;
        case "equipment": return <FaHardHat />;
        case "job-phases": return <FaTasks />;
        case "materials": return <FaBox />;
        case "vendors": return <FaBriefcase />;
        case "crewMapping": return <FaUsers />;
        case "dumping_sites": return <FaTrash />;
        default: return <FaTasks />;
    }
};

// --- Generic Form Component (Unchanged) ---
const GenericForm = ({ fields, onSubmit, defaultValues = {}, errorMessage, genericErrorMessage, categories = [] }) => {
    const [formData, setFormData] = useState(defaultValues);
    const [errors, setErrors] = useState({}); // Add this state for inline errors

    const [values, setValues] = useState(() => {
        const initialValues = { ...defaultValues };
        fields.forEach(field => {
            if (initialValues[field.name] === undefined && field.defaultValue !== undefined) {
                initialValues[field.name] = field.defaultValue;
            }
        });
        return initialValues;
    });


    const validateField = (name, value) => {
        let error = "";
        const field = fields.find(f => f.name === name);
        if (field?.required && !value) {
            error = `${field.label} is required.`;
        }
        setErrors(prev => ({ ...prev, [name]: error }));
        return error;
    };

    // const handleChange = e => {
    //     const { name, value } = e.target;
    //     setValues(prev => ({ ...prev, [name]: value }));
    //     validateField(name, value);
    // };
const handleChange = (e) => {
  if (!e || !e.target) return; // prevent crash
  const { name, value } = e.target;
let error = '';
  let processedValue = value; // This will be the cleaned value
      let newValues = { ...values, [name]: value };

   if (name === 'firstname' || name === 'lastname') {
    // If the input contains a number...
    if (/[0-9]/.test(value)) {
      error = 'Only characters are allowed.'; // Set the error message
    }
    // This line automatically removes any numbers the user types
    processedValue = value.replace(/[0-9]/g, '');
  }

  // Update the input's value with the cleaned text
  setValues((prev) => ({ ...prev, [name]: processedValue }));
  // Update the error state for this specific field
  setErrors((prev) => ({ ...prev, [name]: error }));
  // When category number changes
if (name === 'categorynumber') {
      const selectedCategory = categories.find(c => c.number === value);
      if (selectedCategory) {
        newValues = {
          ...newValues,
          category: selectedCategory.name,
        categoryid: selectedCategory.id    // Always use 'categoryid' (lowercase 'd')
        };
      } else {
        newValues = { ...newValues, category: '',categoryid: null };
      }
    }
        setValues(newValues);

  validateField(name, value);
};

// Add this inside the GenericForm component
useEffect(() => {
  if (errorMessage) {
    setErrors(prev => ({ ...prev, ...errorMessage }));
  }
}, [errorMessage]);

const handleSubmit = e => {
  e.preventDefault();
  let newErrors = {};
  fields.forEach(f => {
    const error = validateField(f.name, values[f.name]);
    if (error) newErrors[f.name] = error;
  });
  setErrors(newErrors);

  if (Object.keys(newErrors).length === 0) {
    // Ensure category name is updated correctly before submitting
    if (values.category_number && !values.category) {
      const selectedCategory = categories.find(c => c.number === values.category_number);
      if (selectedCategory) {
        values.category = selectedCategory.name;
      }
    }

    // Add category_id based on category_number for backend
    if (values.category_number) {
      const selectedCategory = categories.find(c => c.number === values.category_number);
      if (selectedCategory) {
        values.category_id = selectedCategory.id;
      }
    }
    // if (!values.id || values.id.trim() === "") {
    //   alert("Please enter Equipment ID before submitting.");
    //   return;
    // }
    console.log("Submitting form values:", values);
    onSubmit(values);
  }
};


return (
    <form onSubmit={handleSubmit}>
        {genericErrorMessage && <div className="form-error-top">{genericErrorMessage}</div>}
        
        {fields.map(field => (
            <div className="form-group" key={field.name}>
                <label className="form-label">
                    {field.label}
                    {field.required && <span style={{ color: 'red' }}> *</span>}
                </label>

                {/* This wrapper aligns the input and the "Add New" button side-by-side */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

                    {/* This div makes the input/select take up the available space */}
                    <div style={{ flex: 1 }}>
                        {field.type === "select" ? (
                            <select name={field.name} className="form-control" value={values[field.name] || ""} onChange={handleChange}>
                                {field.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        ) : (
                            <input
                                type={field.type || "text"}
                             
                                name={field.name}
                                className="form-control"
                                value={values[field.name] || ""}
                                onChange={handleChange}
                                required={field.required}
                                readOnly={field.readOnly || false}

                                autoComplete={field.type === "password" ? "new-password" : "off"}
                            />
                        )}
                    </div>

                    {/* --- CHANGE IS HERE --- */}
                    {/* This code checks if a field should have an "Add New" button and renders it */}
                    {field.onAddNew && (
                        <button
                            type="button"
                            onClick={field.onAddNew}
                            className="btn btn-sm btn-outline"
                            style={{ whiteSpace: 'nowrap' }} // Keeps "Add New" on one line
                        >
                            Add New
                        </button>
                    )}
                    {/* --- END OF CHANGE --- */}

                </div>

                {errors[field.name] && <small style={{ color: 'red', fontSize: '12px' }}>{errors[field.name]}</small>}
            </div>
        ))}
        
        <div className="modal-actions">
            <button type="submit" className="btn btn-primary">Save</button>
        </div>
    </form>
);

};

// --- Job & Phases Components (Unchanged) ---
const JobPhasesTable = ({ phases, onEdit, onDelete }) => (
    <table className="data-table">
        <thead><tr><th>Phase Code</th><th>Actions</th></tr></thead>
        <tbody>
            {phases.map((p, i) => (
                <tr key={`${p.phase_code}-${i}`}>
                    <td>{p.phase_code}</td>
                    <td>
                        <button onClick={() => onEdit(i)} className="btn btn-sm">Edit</button>
                        <button onClick={() => onDelete(i)} className="btn btn-sm btn-outline">Delete</button>
                    </td>
                </tr>
            ))}
        </tbody>
    </table>
);

// In AdminDashboard.js

const JobWithPhasesModal = ({ mode, job, onSave, onClose, showNotification }) => {
    const [jobCode, setJobCode] = useState(job?.job_code || "");
    const [contractNo, setContractNo] = useState(job?.contract_no || "");
    const [jobDescription, setJobDescription] = useState(job?.job_description || "");
    const [projectEngineer, setProjectEngineer] = useState(job?.project_engineer || "");
    const [jurisdiction, setJurisdiction] = useState(job?.jurisdiction || "");
const [projectEngineerId, setProjectEngineerId] = useState('');


    // ✅ FIX: Ensure status is always handled in lowercase for the backend
    const [status, setStatus] = useState(job?.status?.toLowerCase() || "active"); 
    
    const [phaseCode, setPhaseCode] = useState("");
    const [phases, setPhases] = useState(job?.phases || []);
    const [editIdx, setEditIdx] = useState(null);
    const fixedPhases = ["Admin", "S&SL", "Vacation"];
    const [locations, setLocations] = useState([]);
 const [engineers, setEngineers] = useState([]);

useEffect(() => {
  fetch("http://localhost:8000/api/project-engineer/")
    .then((res) => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then((data) => {
      if (Array.isArray(data)) {
        const activeEngineers = data.filter(engineer => engineer.status.toLowerCase() === 'active');

        setEngineers(activeEngineers); 
      } else {
        console.error("Unexpected response:", data);
        setEngineers([]); // fallback to empty array
      }
    })
    .catch((err) => {
      console.error("Error fetching engineers:", err);
      setEngineers([]); // fallback to avoid crash
    });
}, []);


  useEffect(() => {
    axios.get(`${API_URL}/locations/`)
      .then((res) => setLocations(res.data))
      .catch((err) => console.error("Error fetching locations:", err));
  }, []);
  
    // ... (Your handleAddPhase, handleEditPhase, handleDeletePhase functions remain the same)
    const handleAddPhase = () => {
      if (!phaseCode.trim()) return showNotification("Please enter a phase code.");
      if (phases.some((p, idx) => p.phase_code === phaseCode.trim() && idx !== editIdx))
        return showNotification("This phase code already exists.");
      if (editIdx !== null) {
        setPhases(phases.map((p, i) => (i === editIdx ? { phase_code: phaseCode.trim() } : p)));
        setEditIdx(null);
      } else {
        setPhases([...phases, { phase_code: phaseCode.trim() }]);
      }
      setPhaseCode("");
    };

    const handleEditPhase = (idx) => {
      setPhaseCode(phases[idx].phase_code);
      setEditIdx(idx);
    };

    const handleDeletePhase = (idx) => {
      setPhases(phases.filter((_, i) => i !== idx));
    };


    const handleSubmit = () => {
        if (!jobCode.trim()) return showNotification("Job code is a required field.");

        // 1. Get a clean list of all phase code strings
        const finalPhaseStrings = [...new Set([...phases.map(p => p.phase_code), ...fixedPhases])];

        // ✅ FIX: Construct the payload with the EXACT field names the backend expects
        const payload = {
            job_code: jobCode.trim(),
            contract_no: contractNo.trim(),
            job_description: jobDescription.trim(),
            project_engineer: projectEngineer.trim(),
            location_id: jurisdiction ? parseInt(jurisdiction) : null,
            project_engineer_id: projectEngineerId,  // id
            status: status, // This is now guaranteed to be lowercase
            phase_codes: finalPhaseStrings // The key is now 'phase_codes'
        };
        
        onSave(payload);
    };

    return (
        <Modal title={mode === "edit" ? "Edit Job & Phases" : "Create Job & Phases"} onClose={onClose} size="large">
            <div className="form-grid">
                <div className="form-group"><label>Job Code</label><input type="text" value={jobCode} onChange={(e) => setJobCode(e.target.value)} disabled={mode === "edit"} className="form-control" required /></div>
                <div className="form-group"><label>Contract No.</label><input type="text" value={contractNo} onChange={(e) => setContractNo(e.target.value)} className="form-control" /></div>
                {/* <div className="form-group"><label>Project Engineer</label><input type="text" value={projectEngineer} onChange={(e) => setProjectEngineer(e.target.value)} className="form-control" /></div> */}
                {/* <div className="form-group"><label>Jurisdiction</label><input type="text" value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value)} className="form-control" /></div> */}
                <div className="form-group">
        <label>Jurisdiction</label>
        <select
          value={jurisdiction}
          onChange={(e) => setJurisdiction(e.target.value)}
          className="form-control"
        >
          <option value="">Select Jurisdiction</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name}
            </option>
          ))}
        </select>
      </div>
<div className="form-group">
  <label>Project Engineer</label>
 <select
  value={projectEngineerId || ""}
  onChange={(e) => {
    const selectedId = e.target.value;
    const selectedEngineer = engineers.find(
      (eng) => eng.id === parseInt(selectedId)
    );
    setProjectEngineerId(selectedId);
    setProjectEngineer(
      selectedEngineer
        ? `${selectedEngineer.first_name} ${selectedEngineer.last_name}`
        : ""
    );
  }}
  className="form-control"
>
  <option value="">Select Project Engineer</option>
  {Array.isArray(engineers) &&
    engineers.map((eng) => (
      <option key={eng.id} value={eng.id}>
        {eng.first_name} {eng.last_name}
      </option>
    ))}
</select>

</div>

                
                <div className="form-group full-width"><label>Job Description</label><textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} className="form-control" rows="3"></textarea></div>
                
                {/* ✅ FIX: The select now correctly uses lowercase values */}
                <div className="form-group">
                    <label>Status</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value)} className="form-control">
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
            </div>
            <hr style={{ margin: "16px 0" }} />
            <h4>Editable Phases</h4>
            <div className="phases-table-wrapper"><JobPhasesTable phases={phases} onEdit={handleEditPhase} onDelete={handleDeletePhase} /></div>
            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                <input type="text" value={phaseCode} onChange={(e) => setPhaseCode(e.target.value)} placeholder="New Phase Code" className="form-control" />
                <button type="button" onClick={handleAddPhase} className="btn">{editIdx !== null ? "Update" : "Add"}</button>
                {editIdx !== null && (<button type="button" onClick={() => { setEditIdx(null); setPhaseCode(""); }} className="btn btn-outline">Cancel</button>)}
            </div>
            <div style={{ marginTop: "16px" }}><h4>Fixed Phases</h4><ul className="fixed-phases-list">{fixedPhases.map(p => <li key={p}>{p}</li>)}</ul></div>
            <div className="modal-actions"><button onClick={handleSubmit} className="btn btn-primary">Save Job</button></div>
        </Modal>
    );
};


// In AdminDashboard.js
// In AdminDashboard.js

const JobPhasesViewModal = ({ job, onClose }) => (
    <Modal title={`Phases for ${job.job_code}`} onClose={onClose}>
        <table className="data-table">
            <thead>
                <tr>
                    <th>Phase Code</th>
                    {/* It's helpful to also show the description */}
                    <th>Description</th>
                </tr>
            </thead>
            <tbody>
                {(job.phase_codes || []).map((phaseObject) => (
                    // ✅ FIX: Use the unique 'id' for the key for better performance
                    <tr key={phaseObject.id}>
                        {/* ✅ FIX: Access the 'code' property of the phase object */}
                        <td>{phaseObject.code}</td>
                        <td>{phaseObject.description}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </Modal>
);


// Mapping from section key to page number
const SECTIONS = [
    "users","employees","equipment","job-phases",
    "materials","vendors","dumping_sites","crewMapping"
];
const ITEMS_PER_PAGE = 1; // or desired default


const capitalizeFirstLetter = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// --- Main Admin Dashboard Component ---
const AdminDashboard = ({ data: initialData, onLogout }) => {
    // MODIFIED: Robust state initialization to guarantee all keys exist.
    const [data, setData] = useState(() => {
        const defaults = {
            users: [], employees: [], equipment: [], job_phases: [], 
            materials: [], vendors: [], dumping_sites: []
        };
        return { ...defaults, ...(initialData || {}) };
    });

    const [activeSection, setActiveSection] = useState("users");
    const [modal, setModal] = useState({ shown: false, type: "", title: "", mode: "add", item: null });
    const [jobModal, setJobModal] = useState({ shown: false, mode: "", job: null });
    const [viewPhasesJob, setViewPhasesJob] = useState(null);
    const [notification, setNotification] = useState({ shown: false, message: "" });
    const [confirmation, setConfirmation] = useState({ shown: false, message: "", onConfirm: () => {} });
    const [formError, setFormError] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});

    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);

    const [departments, setDepartments] = useState([]);
const [categories, setCategories] = useState([]);
const [categoryNumbers, setCategoryNumbers] = useState([]);
const [selectedCategoryId, setSelectedCategoryId] = useState("");
const [selectedCategoryNumber, setSelectedCategoryNumber] = useState("");
const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
// In AdminDashboard.js
// ... existing states
const [subModal, setSubModal] = useState({ shown: false, type: null, title: '' }); // <-- ADD THIS
// ...



useEffect(() => {
  axios.get(`${API_URL}/departments/`)
    .then(res => {
      console.log("Fetched departments:", res.data);
      setDepartments(res.data);
    })
    .catch(err => console.error("Error fetching departments:", err));

  axios.get(`${API_URL}/categories/`)
    .then(res => {
      console.log("Fetched categories:", res.data);
      setCategories(res.data);
      // Assuming category numbers are strings
      const categoryNums = res.data
        .filter(cat => cat.number && cat.number.trim() !== "")
        .map(cat => ({ value: cat.number, label: cat.number }));
      console.log("Parsed category numbers:", categoryNums);
      setCategoryNumbers(categoryNums);
    })
    .catch(err => console.error("Error fetching categories:", err));
}, []);




const openSubModal = (type, title) => {
  setSubModal({ shown: true, type, title });
};

const closeSubModal = () => {
  setSubModal({ shown: false, type: null, title: '' });
};

const handleAddSubItem = async (type, formData) => {
  const endpoint = type === 'department' ? 'departments' : 'categories';
  try {
    // --- FIX IS HERE: Added a trailing slash to the URL ---
    const response = await axios.post(`${API_URL}/${endpoint}/`, formData);
    
    // Update the state with the new item so it appears in the dropdown
    if (type === 'department') {
      setDepartments(prev => [...prev, response.data]);
    } else if (type === 'category') {
      setCategories(prev => [...prev, response.data]);
    }
    
    showNotification(`${capitalizeFirstLetter(type)} added successfully!`);
    closeSubModal();
  } catch (error) {
    const errorMessage = error.response?.data?.detail || `Error adding ${type}.`;
    showNotification(errorMessage);
    console.error(`Error adding ${type}:`, error);
  }
};
      const [pagination, setPagination] = useState(
    Object.fromEntries(SECTIONS.map((sec) => [sec, 1]))
  );
  const handlePaginate = (section, pageNumber, totalPages) => {
    const clamped = Math.max(1, Math.min(pageNumber, totalPages));
    setPagination(prev => ({ ...prev, [section]: clamped }));
  };
  useEffect(() => {
    setPagination(prev => ({ ...prev, [activeSection]: 1 }));
  }, [activeSection]);
    const showNotification = (message) => setNotification({ shown: true, message });
    const showConfirmation = (message, onConfirmAction) => setConfirmation({ shown: true, message, onConfirm: () => {
        onConfirmAction();
        setConfirmation({ shown: false, message: "", onConfirm: () => {} });
    }});

    const closeMainModal = () => {
        setModal({ shown: false, type: "", title: "", mode: "add", item: null });
        setFormError("");
    };
    
    const API_ENDPOINTS = [
        "users", "employees", "equipment", "materials", 
        "vendors", "dumping_sites", "job-phases"
    ];
    
    const [sidebarWidth, setSidebarWidth] = useState(220);
    const [isResizing, setIsResizing] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [currentDate, setCurrentDate] = useState("");
    


    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setFetchError(null);
            const newData = {};
            let hasError = false;

            for (const endpoint of API_ENDPOINTS) {
                try {
                    const response = await axios.get(`${API_URL}/${endpoint}`);
                    // Map job-phases back to job_phases key for state consistency
                    const key = endpoint === 'job-phases' ? 'job-phases' : endpoint;
                    newData[key] = response.data;
                } catch (error) {
                    // Log the error but continue trying to fetch other data
                    console.error(`Error fetching ${endpoint}:`, error);
                    setFetchError(`Failed to load data for ${endpoint}.`);
                    hasError = true;
                }
            }

            if (!hasError) {
                setData(newData); // Replace initial state with fetched data
            }
            setIsLoading(false);
        };
        
        fetchData();
    }, []);

useEffect(() => {
  console.log("Linked Category →", { selectedCategoryId, selectedCategoryNumber });
}, [selectedCategoryId, selectedCategoryNumber]);


    useEffect(() => {
        const now = new Date();
        const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
        setCurrentDate(now.toLocaleDateString(undefined, options));
    }, []);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (isResizing) {
                const newWidth = Math.max(60, Math.min(e.clientX, 400));
                setSidebarWidth(newWidth);
            }
        };
        const handleMouseUp = () => { if (isResizing) setIsResizing(false); };
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isResizing]);

    const typeToStateKey = { user: "users", employee: "employees", equipment: "equipment", job_phase: "job-phases", material: "materials", vendor: "vendors", dumping_site: "dumping_sites" };

    const onUpdate = (key, newList) => setData(prev => ({ ...prev, [key]: newList }));

// In AdminDashboard.js

const handleSaveJob = async (jobData) => {
    // `jobData` is the payload coming directly from the modal. It's already correct.
    const isEditMode = jobModal.mode === 'edit';
    const url = isEditMode 
        ? `${API_URL}/job-phases/${encodeURIComponent(jobData.job_code)}` 
        : `${API_URL}/job-phases/`;
    const apiCall = isEditMode ? axios.put : axios.post;

    try {
        // ✅ FIX: Send the `jobData` object directly. No need to modify it.
        const response = await apiCall(url, jobData);
        
        setData(prev => {
            const updatedJobs = [...(prev.job_phases || [])];
            const existingIndex = updatedJobs.findIndex(j => j.job_code === jobData.job_code);
            
            if (existingIndex !== -1) {
                updatedJobs[existingIndex] = response.data;
            } else {
                updatedJobs.push(response.data);
            }
            return { ...prev, job_phases: updatedJobs };
        });
        
        setJobModal({ shown: false, mode: "", job: null });
        showNotification(`Job '${jobData.job_code}' was saved successfully!`);

    } catch (err) {
        const errorMessage = err.response?.data?.detail 
            ? JSON.stringify(err.response.data.detail) 
            : err.message;
        showNotification(`Error saving job: ${errorMessage}`);
    }
};



const handleAddOrUpdateItem = async (type, itemData, mode, existingItem = null) => {
    const stateKey = typeToStateKey[type];
    setFormError('');
    setFieldErrors({});

    // This is the raw data from your form
    const formData = { ...itemData };

    // This will hold the final, clean data to be sent to the backend
    let payload;

    // --- START: TYPE-SPECIFIC PAYLOAD PREPARATION ---

    if (type === 'equipment') {
        // 1. For 'equipment', we manually construct the payload
        //    to match the backend's snake_case schema.

        // Client-side validation before constructing the payload
        if (!formData.id || formData.id.trim() === '') {
            setFieldErrors({ id: 'Equipment ID is a required field.' });
            return;
        }
        if (!formData.departmentId) {
            setFieldErrors({ departmentId: 'Department is required.' });
            return;
        }
        if (!formData.categoryid) {
            setFieldErrors({ categorynumber: 'Category Number is required.' });
            return;
        }

        // Build the payload with the exact field names and types the backend expects
        payload = {
            id: formData.id,
            name: formData.name,
            department_id: parseInt(formData.departmentId, 10),
            category_id: parseInt(formData.categoryid, 10),
            vin_number: formData.vinnumber || null,
            status: (formData.status || 'Active').toLowerCase()
        };

    } else if (['user', 'dumpingsite'].includes(type)) {
        // 2. For 'user' and 'dumpingsite', the primary task is converting their ID to a number.

        if (formData.id) {
            const numericId = parseInt(formData.id, 10);
            if (isNaN(numericId)) {
                setFieldErrors({ id: 'ID must be a valid number.' });
                return;
            }
            formData.id = numericId; // Update the ID in the formData object
        }
        payload = { ...formData }; // The rest of the fields are correct

    } else {
        // 3. For 'employee' and all other types, the form data is already in the correct format.
        payload = { ...formData };
    }

    // Normalize status to lowercase if it exists in the final payload
    if (payload.status) {
        payload.status = payload.status.toLowerCase();
    }

    // --- END: PAYLOAD PREPARATION ---


    // --- Client-side duplicate checks ---
    if (mode === 'add') {
        const newErrors = {};
        if (type === 'equipment' && data.equipment.some(equip => equip.id === payload.id)) {
            newErrors.id = 'Equipment ID already exists.';
        } else if (type === 'user' && data.users.some(user => user.id === payload.id)) {
            newErrors.id = 'User ID already exists.';
        } else if (type === 'employee' && data.employees.some(emp => emp.id === payload.id)) {
            newErrors.id = 'Employee ID already exists.';
        } // ... etc.

        if (Object.keys(newErrors).length > 0) {
            setFieldErrors(newErrors);
            return;
        }
    }


    try {
        let response;
        if (mode === "edit" && existingItem) {
            const itemId = existingItem.id;
            response = await axios.put(`${API_URL}/${stateKey}/${encodeURIComponent(itemId)}`, payload);
            onUpdate(stateKey, (data[stateKey] || []).map(it => it.id === itemId ? response.data : it));
        } else {
            response = await axios.post(`${API_URL}/${stateKey}/`, payload);
            onUpdate(stateKey, [response.data, ...(data[stateKey] || [])]);
        }
        closeMainModal();
    } catch (error) {
        // Your existing, excellent error handling logic remains here
        const errorData = error.response?.data?.detail;
        if (error.response?.status === 422 && errorData) {
            const newErrors = {};
            if (Array.isArray(errorData)) {
                errorData.forEach(err => {
                    if (err.loc && err.loc.length > 1) {
                        const backendField = err.loc[1];
                        const frontendField = {
                            'department_id': 'departmentId',
                            'category_id': 'categoryid'
                        }[backendField] || backendField;
                        newErrors[frontendField] = err.msg;
                    }
                });
            }
            setFieldErrors(newErrors);
        } else {
            setFormError('An unexpected error occurred.');
        }
        console.error(`Error processing ${type}:`, error);
    }
};

// const handleToggleStatus = async (type, item, newStatus) => {
//   const stateKey = typeToStateKey[type];
//   const updatedItem = { ...item, status: newStatus.toLowerCase() };

//   // Remove nested relational fields before sending
//   const { category_rel, department_rel, ...cleanPayload } = updatedItem;

//   console.log(`Changing status for ${type} id:${item.id}`, cleanPayload);

//   try {
//     const response = await axios.put(
//       `${API_URL}/${stateKey}/${encodeURIComponent(item.id)}`,
//       cleanPayload
//     );

//     // Update UI immediately
//     setData((prev) => ({
//       ...prev,
//       [stateKey]: (prev[stateKey] || []).map((it) =>
//         it.id === item.id ? response.data : it
//       ),
//     }));
//   } catch (error) {
//     console.error("Error updating status:", error);
//     alert(
//       `Error updating status: ${
//         error.response?.data
//           ? JSON.stringify(error.response.data)
//           : "Unexpected error"
//       }`
//     );
//   }
// };

// In AdminDashboard.js

const handleToggleStatus = async (type, item, newStatus) => {
    const stateKey = typeToStateKey[type];
    if (!stateKey) {
        console.error("Could not find a state key for type:", type);
        return;
    }

    const payload = { status: newStatus.toLowerCase() };
    const isJob = type === 'jobphase';
    const idKey = 'id';
    const itemId = item[idKey];

const resourcePath =
  type.toLowerCase().includes('job') ? 'job-phases/by-id' : stateKey;
const endpoint = `${API_URL}/${resourcePath}/${encodeURIComponent(item.id)}`;



    console.log("🔗 PUT request to:", endpoint);

    try {
const response = await axios.put(endpoint, payload);
setData(prev => {
  const currentList = prev[stateKey] || [];
  const updatedList = currentList.map(it => it.id === item.id ? response.data : it);
  return { ...prev, [stateKey]: updatedList };
});



        if (newStatus.toLowerCase() === 'inactive') {
            setPagination(prev => ({ ...prev, [stateKey]: 1 }));
        }

    } catch (error) {
        const errorDetail = error.response?.data?.detail;
        const errorMessage = errorDetail ? JSON.stringify(errorDetail) : 'An unexpected error occurred.';
        console.error(`Error updating status for ${type}:`, error);
        alert(`Error updating status: ${errorMessage}`);
    }
};


    const handleDeleteItem = async (type, itemId) => {
        const deleteAction = async () => {
            const urlKey = type === 'job_phase' ? 'job-phases' : typeToStateKey[type];
            const dataKey = type === 'job_phase' ? 'job-phases' : typeToStateKey[type];
            try {
                const url = `${API_URL}/${urlKey}/${encodeURIComponent(itemId)}`;
                await axios.delete(url);
                const idKey = type === 'job_phase' ? 'job_code' : 'id';
                onUpdate(dataKey, (data[dataKey] || []).filter(item => item[idKey] !== itemId));
            } catch (error) {
                const errorMessage = error.response?.data ? JSON.stringify(error.response.data) : error.message;
                showNotification(`Error deleting ${type}: ${errorMessage}`);
            }
        };
        const itemLabel = type.replace('_', ' ');
        showConfirmation(`Are you sure you want to delete this ${itemLabel}?`, deleteAction);
    };
    
    const getFormFields = (type) => {
        switch (type) {
            case "user": return [ { name: "id", label: "User ID", required: true },{ name: "username", label: "Username", required: true }, { name: "first_name", label: "First Name", required: true }, { name: "middle_name", label: "Middle Name" }, { name: "last_name", label: "Last Name", required: true }, { name: "email", label: "Email", required: true, type: "email" }, { name: "password", label: "Password", type: "password", required: true }, { name: 'role', label: 'Role', type: 'select', options: [
            { value: 'foreman', label: 'Foreman' },
            { value: 'supervisor', label: 'Supervisor' },
            { value: 'project_engineer', label: 'Project Engineer' },
            { value: 'admin', label: 'Accountant' },
        ], required: true, defaultValue: 'admin' },

        // --- ADD THIS OBJECT ---
        { name: 'status', label: 'Status', type: 'select', options: [
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
        ], required: true, defaultValue: 'active' }
    ];
            case "employee": return [ { name: "id", label: "Employee ID", required: true }, { name: "first_name", label: "First Name", required: true }, { name: "middle_name", label: "Middle Name" }, { name: "last_name", label: "Last Name", required: true }, { name: "class_1", label: "Class Code 1" }, { name: "class_2", label: "Class Code 2" }, { name: "status", label: "Status", type: "select", options: [ { value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" } ], required: true, defaultValue: "Active" } ];
    case 'equipment':
      return [
        { name: 'id', label: 'Equipment ID', required: true },
        { name: 'name', label: 'Equipment Name', required: true },
        {
          name: 'departmentId',
          label: 'Department',
          type: 'select',
          required: true,
          options: [
            { value: '', label: 'Select Department' },
            ...departments.map(d => ({ value: d.id, label: d.name }))
          ],
          onAddNew: () => openSubModal('department', 'Add New Department') // <-- ADD THIS
        },
        {  
            name: 'categorynumber',
          label: 'Category Number',
          type: 'select',
          required: true,
          options: [
            { value: '', label: 'Select Category Number' },
            ...categories.map(c => ({ value: c.number, label: c.number }))
          ],
          onAddNew: () => openSubModal('category', 'Add New Category') // <-- ADD THIS
        },
        { name: 'category', label: 'Category Name', type: 'text', readOnly: true },
        { name: 'vinnumber', label: 'VIN Number' },
        {
          name: 'status', label: 'Status', type: 'select',
          options: [{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }],
          required: true, defaultValue: 'Active'
        }
         ];

    // Case for the sub-modal to add a new department
    case 'department':
      return [
        { name: 'name', label: 'Department Name', required: true }
      ];

    // Case for the sub-modal to add a new category
    case 'category':
      return [
        { name: 'number', label: 'Category Number', required: true },
        { name: 'name', label: 'Category Name', required: true }
      ];

            case "vendor": return [ { name: "name", label: "Work Performed Name", required: true }, { name: "unit", label: "Unit", required: true }, { name: "status", label: "Status", type: "select", options: [ { value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" } ], required: true, defaultValue: "Active" } ];
            case "material": return [ { name: "name", label: "Material/Trucking Name", required: true }, { name: "status", label: "Status", type: "select", options: [ { value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" } ], required: true, defaultValue: "Active" } ];
            case "dumping_site": return [ { name: "id", label: "Site ID", required: true }, { name: "name", label: "Site Name", required: true }, { name: "status", label: "Status", type: "select", options: [ { value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" } ], required: true, defaultValue: "Active" } ];
            default: return [];
        }
    };

// const getEquipmentFormFields = () => {
//   return getFormFields("equipment").map((field) => {
//     if (field.name === "department") {
//       return {
//         ...field,
//         options: [
//           { value: "", label: "Select Department" },  // Default placeholder
//           ...departments.map((d) => ({ value: d.id, label: d.name })),
//         ],
//       };
//     }
//     if (field.name === "category") {
//       return {
//         ...field,
//         options: [
//           { value: "", label: "Select Category" },  // Default placeholder
//           ...categories.map((c) => ({ value: c.id, label: c.name })),
//         ],
//       };
//     }
//     if (field.name === "category_number") {
//       return {
//         ...field,
//         options: [
//           { value: "", label: "Select Category Number" },  // Default placeholder
//           ...categoryNumbers,
//         ],
//       };
//     }
//     return field;
//   });
// };
const getEquipmentFormFields = () => {
  return getFormFields("equipment").map((field) => {
    if (field.name === "department_id") {
      return {
        ...field,
        options: [
          { value: "", label: "Select Department" },
          ...departments.map((d) => ({ value: d.id, label: d.name })),
        ],
        value: selectedDepartmentId,
        onChange: (e) => setSelectedDepartmentId(e.target.value),
      };
    }

    if (field.name === "category") {
      return {
        ...field,
        type: "text",
        options: [
          { value: "", label: "Select Category" },
          ...categories.map((c) => ({ value: c.id, label: c.name })),
        ],
        value: selectedCategoryId,
        onChange: (e) => {
          const selectedId = e.target.value;
          setSelectedCategoryId(selectedId);

          const selectedCat = categories.find((c) => c.id === parseInt(selectedId));
          setSelectedCategoryNumber(selectedCat ? selectedCat.number : "");
        },
      };
    }

    if (field.name === "category_number") {
  return {
    ...field,
    type: "select",
    options: [
      { value: "", label: "Select Category Number" },
      ...categories.map((c) => ({ value: c.number, label: c.number })),
    ],
  };
}



    return field;
  });
};
const equipmentFields = useMemo(() => getEquipmentFormFields(), [
  departments,
  categories,
  categoryNumbers,
  selectedCategoryId,
  selectedCategoryNumber,
  selectedDepartmentId,
]);
// const equipmentFields = useMemo(() => getEquipmentFormFields(), [departments, categories, categoryNumbers]);


// In AdminDashboard.js

const prepareJobForEditModal = (job) => {
    const fixedPhases = ["Admin", "S&SL", "Vacation"];
    // 'job.phase_codes' is now an array of objects: [{ id: 1, code: 'PC-01', ... }]
    const phaseCodeObjects = job.phase_codes || [];

    // ✅ FIX: Filter the objects by accessing their 'code' property
    const editablePhaseObjects = phaseCodeObjects.filter(
        p_obj => !fixedPhases.includes(p_obj.code)
    );
    
    // ✅ FIX: Map the objects to the structure the modal's state expects: { phase_code: 'string' }
    const phasesForModal = editablePhaseObjects.map(p_obj => ({ phase_code: p_obj.code }));

    // Return the job data, overwriting 'phases' with the correctly prepared array
    return { ...job, phases: phasesForModal };
};


    const formatRole = (role) => {
        if (!role) return "";
        return role
            .split('_') 
            .map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
            )
            .join(' ');
    };

    const renderSection = () => {
// In AdminDashboard.js, replace the entire function

const makeTableWithPagination = (type, title, headers, rowRender, itemLabel) => {
    const label = itemLabel || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const key = typeToStateKey[type];
    const dataArr = data[key] || [];

    // This correctly creates a list of ONLY active items
    const activeData = dataArr.filter(item => item.status !== 'inactive');

    const currentPage = pagination[key] || 1;
    const itemsPerPage = ITEMSPERPAGE;

    // --- FIX #1: Calculate total pages based on the FILTERED data ---
    const totalPages = Math.ceil(activeData.length / itemsPerPage);

    // --- FIX #2: Slice the FILTERED data to get the current page's items ---
    const pagedData = activeData.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );

    // This prevents being stuck on an empty page after filtering
    if (pagedData.length === 0 && activeData.length > 0) {
        // If current page is empty but there's still data, go back to page 1
        handlePaginate(key, 1, totalPages);
    }

    return (
        <div>
            <DataTableSection
                title={title}
                headers={headers}
                // --- FIX #3: Pass the correctly filtered and paginated data ---
                data={pagedData}
                renderRow={(item) => <>{rowRender(item)}</>}
                onAdd={() => setModal({ shown: true, type, title: `Add ${label}`, mode: 'add', item: null })}
                onEdit={(item) => setModal({ shown: true, type, title: `Edit ${label}`, mode: 'edit', item })}
                onDelete={(id) => handleDeleteItem(type, id)}
                handleToggleStatus={handleToggleStatus}
                activeSection={type}
            />
            <PaginationControls
                currentPage={currentPage}
                // --- FIX #4: Pass the correct total pages count ---
                totalPages={totalPages}
                onPaginate={(pageNum) => handlePaginate(key, pageNum, totalPages)}
            />
        </div>
    );
};

        switch (activeSection) {
            case 'dashboard':
            return <TimesheetCounts />;
            case "users": 
                return makeTableWithPagination(
                    "user", 
                    "User Management", 
                    ["ID", "Username", "First Name", "Last Name", "Role","Status"], 
                    u => (
                        <>
                    <td key={u.id}>{u.id}</td>

                            <td key={u.username}>{u.username}</td>
                            <td key={u.first_name}>{u.first_name}</td>
                            <td key={u.last_name}>{u.last_name}</td>
                            <td key={u.role}>{formatRole(u.role)}</td>
                                        <td key={u.status}>{capitalizeFirstLetter(u.status)}</td>

                        </>
                    )
                );
            case "employees": 
                return makeTableWithPagination("employee", "Employee Management", ["ID", "Name", "Class", "Status"], e => {
                    const fullName = `${e.first_name} ${e.middle_name ? e.middle_name + ' ' : ''}${e.last_name}`;
                    return (<> 
                        <td key={e.id}>{e.id}</td> 
                        <td key={fullName}>{fullName}</td> 
                        <td key={e.class_1}>{`${e.class_1 || ""}${e.class_2 ? " / " + e.class_2 : ""}`}</td> 
                        {/* <td key={e.status}>{capitalizeFirstLetter(e.status)}</td> */}
                        <td>
  {(() => {
    const statusMap = {
      active: "Active",
      inactive: "Inactive",
      maintenance: "In Maintenance",
      on_leave: "On Leave",
    };
    return statusMap[e.status?.toLowerCase()] || e.status;
  })()}
</td>

                    </>);
                });
// Inside the renderSection function...
// In AdminDashboard.js, inside renderSection...
case "equipment": 
    return makeTableWithPagination(
        "equipment", 
        "Equipment Management", 
        ["ID", "Name", "Category Name", "Department", "Category No.", "VIN No.", "Status"], 
        e => {
            console.log("Equipment row", e.category_rel, e.department_rel);
            return (
                <> 
                    <td key={e.id}>{e.id}</td>
                    <td key={e.name}>{e.name}</td>
                    <td>{e.category_rel?.name || "N/A"}</td>
                    <td>{e.department_rel?.name || "N/A"}</td>
                    <td>{e.category_rel?.number || "N/A"}</td>
                    <td key={e.vin_number}>{e.vin_number}</td>
                    {/* <td key={e.status}>{capitalizeFirstLetter(e.status)}</td> */}
                    <td>
  {(() => {
    const statusMap = {
      active: "Active",
      inactive: "Inactive",
      maintenance: "In Maintenance",
      on_leave: "On Leave",
    };
    return statusMap[e.status?.toLowerCase()] || e.status;
  })()}
</td>

                </>
            );
        }
    );




            case "vendors": 
                return makeTableWithPagination("vendor", "Work Performed", ["Name", "Unit", "Status"], v => <><td key={v.name}>{v.name}</td><td key={v.unit}>{v.unit}</td><td key={v.status}>{capitalizeFirstLetter(v.status)}</td>
</>, "Work Performed");
            case "materials": 
                return makeTableWithPagination("material", "Materials and Trucking", ["Name", "Status"], m => <><td key={m.name}>{m.name}</td><td key={m.status}>{capitalizeFirstLetter(m.status)}</td>
</>, "Material and Trucking");
case "job-phases":
  return (
    <DataTableSection 
      title="Jobs & Phases Management" 
      headers={["Job Code", "Description", "Project Engineer", "Status"]} 
      data={data.job_phases || []} 
      renderRow={job => (
        <>
          <td>{job.job_code}</td> 
          <td>{job.job_description}</td> 
          <td>{job.project_engineer}</td> 
          <td>
            {(() => {
              const statusMap = {
                active: "Active",
                inactive: "Complete",
                on_hold: "On Hold",
                // complete: "Complete",
              };
              return statusMap[job.status?.toLowerCase()] || job.status;
            })()}
          </td>
        </>
      )} 
      onAdd={() => setJobModal({ shown: true, mode: "add", job: null })} 
      onEdit={(job) => setJobModal({ shown: true, mode: "edit", job: prepareJobForEditModal(job) })} 
      onDelete={(job_code) => handleDeleteItem("job_phase", job_code)} 
      extraActions={(job) => (
        <button className="btn btn-view btn-sm" onClick={() => setViewPhasesJob(job)}> View Phases </button>
      )} 
      handleToggleStatus={handleToggleStatus}
      activeSection="job_phase"
    />
  );

            case "dumping_sites": 
                return makeTableWithPagination("dumping_site", "Dumping Site Management", ["Site ID", "Site Name", "Status"], ds => (<><td key={ds.id}>{ds.id}</td><td key={ds.name}>{ds.name}</td><td key={ds.status}>{capitalizeFirstLetter(ds.status)}</td>
</>), "Dumping Site");
            case "crewMapping": 
                const allResources = { 
                            users: (data.users || []).filter(u => u.status === 'active'),
employees: data.employees || [], equipment: data.equipment || [], 
                    materials: data.materials || [], vendors: data.vendors || [], dumping_sites: data.dumping_sites || []
                }; 
                return <CrewMappingManager allResources={allResources} />;
            default: return <div>Section not implemented.</div>;
        }
    };

    return (
        <div className="admin-layout">
            {notification.shown && <NotificationModal message={notification.message} onClose={() => setNotification({ shown: false, message: "" })} />}
            {confirmation.shown && <ConfirmationModal message={confirmation.message} onConfirm={confirmation.onConfirm} onCancel={() => setConfirmation({ shown: false, message: "", onConfirm: () => {} })} />}

            {modal.shown && (
  <Modal title={modal.title} onClose={closeMainModal}>
    <GenericForm
      fields={getFormFields(modal.type)}
      categories={categories} // Pass categories here
      defaultValues={modal.item}
      onSubmit={(formData) => handleAddOrUpdateItem(modal.type, formData, modal.mode, modal.item)}
errorMessage={fieldErrors} // Pass the new state as a prop
  genericErrorMessage={formError}   />
</Modal>

)}
    {subModal.shown && (
      <Modal title={subModal.title} onClose={closeSubModal}>
        <GenericForm
          fields={getFormFields(subModal.type)}
          onSubmit={(formData) => handleAddSubItem(subModal.type, formData)}
        />
      </Modal>
    )}

            {viewPhasesJob && <JobPhasesViewModal job={viewPhasesJob} onClose={() => setViewPhasesJob(null)} />}
            {jobModal.shown && <JobWithPhasesModal mode={jobModal.mode} job={jobModal.job} onSave={handleSaveJob} onClose={() => setJobModal({ shown: false, mode: "", job: null })} showNotification={showNotification} />}
            
            <nav
                className={`admin-sidebar ${sidebarCollapsed ? "collapsed" : ""}`}
                style={{ width: sidebarCollapsed ? 60 : sidebarWidth }}
            >
                <div className="sidebar-top">
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="btn btn-outline btn-sm toggle-sidebar"
                        title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    >
                        {sidebarCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
                    </button>
                </div>
                <div className="sidebar-header">
                    {!sidebarCollapsed && <h3 className="sidebar-title">ADMIN PORTAL</h3>}
                    {!sidebarCollapsed && (
                        <>
                            <div className="current-date">{currentDate}</div>
                            <button
                                onClick={onLogout}
                                className="btn btn-outline btn-sm logout-btn"
                            >
                                Logout
                            </button>
                        </>
                    )}
                </div>

                <ul className="sidebar-nav">
                    {[
                        'dashboard',
                        "users",
                        "employees",
                        "equipment",
                        "job-phases",
                        "materials",
                        "vendors",
                        "dumping_sites",
                        "crewMapping",
                    ].map((sec) => (
                        <li key={sec}>
                            <button
                                onClick={() => setActiveSection(sec)}
                                className={activeSection === sec ? "active" : ""}
                            >
                                <span className="icon">{getIconForSection(sec)}</span>
                                {!sidebarCollapsed && (
                                    <span className="label">
                                         {sec === "dashboard" // <= ADD THIS CONDITION
        ? "Dashboard"
        : sec === "job-phases"
        ? "Jobs & Phases"
                                            : sec === "crewMapping"
                                            ? "Crew Mapping"
                                            : sec === "vendors"
                                            ? "Work Performed"
                                            : sec === "materials"
                                            ? "Materials & Trucking"
                                            : sec === "dumping_sites"
                                            ? "Dumping Sites"
                                            : sec.charAt(0).toUpperCase() + sec.slice(1)}
                                    </span>
                                )}
                            </button>
                        </li>
                    ))}
                </ul>

                {!sidebarCollapsed && (<div className="sidebar-resizer" onMouseDown={() => setIsResizing(true)}/>)}
            </nav>
            
            <main
                className="admin-content"
                style={{ marginLeft: sidebarCollapsed ? 60 : sidebarWidth -220 }}
            >
                {renderSection()}
            </main>
        </div>
    );
};

const getStatusOptions = (type) => {
  switch (type) {
    case "employee":
      return ["active", "on_leave", "inactive"];
    case "equipment":
      return ["active", "maintenance", "inactive"];
    case "job_phase":
      return ["active", "on_hold", "complete"];
    default:
      return ["active", "inactive"];
  }
};

// ✅ FIX: Added handleToggleStatus and activeSection to props
const DataTableSection = ({ title, headers, data = [], renderRow, onDelete, onAdd, onEdit, extraActions, handleToggleStatus, activeSection }) => (
    <div className="data-table-container">
        <div className="section-header"><h2>{title}</h2>{onAdd && <button onClick={onAdd} className="btn btn-primary">Add New</button>}</div>
        <table className="data-table">
            <thead><tr>{headers.map(h => <th key={h}>{h}</th>)}<th>Actions</th></tr></thead>
            <tbody>
                {data.map(item => (
                    <tr key={item.id || item.job_code || item.username}>
                        {renderRow(item)}
                        <td>
    {onEdit && <button onClick={() => onEdit(item)} className="btn-edit btn-sm">Edit</button>}
    {item.status && handleToggleStatus && (
        <>
            {console.log("Status dropdown type:", activeSection)} 
            <select
                value={
  item.status?.toLowerCase() === "inactive" && activeSection === "job_phase"
    ? "complete" // 👈 display Complete when backend sends inactive
    : item.status?.toLowerCase() || "active"
}

                onChange={(e) => {
  const selected = e.target.value === "complete" ? "inactive" : e.target.value;
  handleToggleStatus(activeSection, item, selected);
}}
                className="btn-sm" 
                style={{
                    // --- MODERN STYLING ENHANCEMENTS ---
                    appearance: 'none',
                    
                    // LIGHT, STANDARD DYNAMIC COLOR LOGIC
                    backgroundColor: 
                        item.status?.toLowerCase() === "inactive"
                            ? "#e2e3e5" // Light Grey for Inactive
                            : item.status?.toLowerCase() === "on_leave" ||
                              item.status?.toLowerCase() === "maintenance"
                            ? "#fff3cd" // Light Yellow for Mid-States
                            : "#d4edda", // Light Green for Active
                    
                    color: 
                        item.status?.toLowerCase() === "inactive"
                            ? "#383d41" 
                            : item.status?.toLowerCase() === "on_leave" ||
                              item.status?.toLowerCase() === "maintenance"
                            ? "#856404"
                            : "#155724", // Contrasting dark text for high readability on light backgrounds

                    // Box & Border (Kept sleek and defined)
                    border: "1px solid #c3c3c3", // Neutral light border
                    borderRadius: "6px", 
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)", // Very subtle shadow
                    
                    // Spacing and Alignment
                    padding: "6px 6px", 
                    marginRight: "4px",
                    cursor: "pointer",
                    outline: 'none', 
                    transition: 'all 0.2s ease-in-out', 
                    fontSize: '14px', 
                    fontWeight: '500',
                    textAlign: 'center',
                    // minWidth: '150px' 
                }}
            >
                {getStatusOptions(activeSection).map((status) => {
                    const statusKey = status.toLowerCase();
                    const formattedLabel = {
                        active: "Active",
                        inactive: "Inactive",
                        maintenance: "In Maintenance",
                        on_leave: "On Leave",
                        on_hold: "On Hold",
                        complete: "Complete",
                    }[statusKey] || status;

                    // Option styling: pure white background for list readability
                    return (
                        <option 
                            key={status} 
                            value={status}
                            style={{
                                backgroundColor: '#ffffff',
                                color: '#212529',
                                fontSize: '14px', 
                            }}
                        >
                            {formattedLabel}
                        </option>
                    );
                })}
            </select>
        </>
    )}
</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

export default AdminDashboard;
