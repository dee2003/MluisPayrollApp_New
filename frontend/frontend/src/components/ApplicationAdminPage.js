import React, { useState, useEffect } from "react";
import {
  FaChevronLeft,
  FaChevronRight,
  FaRegEdit,
  FaClipboardList,
  FaTrash,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import TimesheetForm from "./TimesheetForm.jsx";
import axios from "axios";
import "./ApplicationAdmin.css";

const TIMESHEETS_PER_PAGE = 2;
const API_URL = "http://127.0.0.1:8000/api";
export default function ApplicationAdmin() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState("projects");
  const [timesheets, setTimesheets] = useState([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");
  
  const [currentPage, setCurrentPage] = useState(1);
  const timesheetsPerPage = TIMESHEETS_PER_PAGE;

  // 🟢 Key: totalPages is now always computed, never in state!
  const totalPages = Math.ceil(timesheets.length / timesheetsPerPage);

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  
  const [mappings, setMappings] = useState({});
  const [loadingMappings, setLoadingMappings] = useState({});
  const navigate = useNavigate();
  // const [expandedCardId, setExpandedCardId] = useState(null);
  // const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'
  const handleLogout = () => {
    localStorage.removeItem("authToken");
    window.location.reload();
  };
  const sections = ["createTimesheet", "viewTimesheets"];
  const getIconForSection = (section) => {
    switch (section) {
      case "createTimesheet":
        return <FaRegEdit className="icon" />;
      case "viewTimesheets":
        return <FaClipboardList className="icon" />;
      default:
        return <FaRegEdit className="icon" />;
    }
  };

  const handleSectionClick = (sec) => {
    setActiveSection(sec);
  };
  // --- Fetch all timesheets ---
  // --- Fetch all timesheets ---
  const fetchTimesheets = async () => {
    setError("");
    try {
      const res = await axios.get(`${API_URL}/timesheets/`);
      const sorted = res.data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setTimesheets(sorted);

      // Adjust page if needed (after fetch or delete)
      const computedTotalPages = Math.ceil(sorted.length / timesheetsPerPage);
      if (currentPage > computedTotalPages && computedTotalPages > 0) {
        setCurrentPage(computedTotalPages);
      } else if (sorted.length === 0) {
        setCurrentPage(1);
      }
    } catch (err) {
      console.error("Fetch Timesheets Error:", err);
      setError("Could not fetch timesheets");
    }
  };
    useEffect(() => {
    if (activeSection === "viewTimesheets") {
      fetchTimesheets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection]); 

  // --- Fetch crew mapping for a foreman ---
  const fetchMapping = async (foremanId) => {
    if (!foremanId || mappings[foremanId] || loadingMappings[foremanId]) return;
    try {
      setLoadingMappings((prev) => ({ ...prev, [foremanId]: true }));
      const res = await axios.get(`${API_URL}/crew-mapping/by-foreman/${foremanId}`);
      setMappings((prev) => ({ ...prev, [foremanId]: res.data }));
    } catch (err) {
      console.error(
        `Error fetching mapping for foreman ID ${foremanId}:`,
        err.response ? err.response.data : err.message
      );
    } finally {
      setLoadingMappings((prev) => ({ ...prev, [foremanId]: false }));
    }
  };
   // ⭐️ EVENT HANDLERS ⭐️
  const handleRowClick = (ts, e) => {
    if (e.target.closest("button")) return;
    navigate(`/timesheet/${ts.id}`, { state: { timesheet: ts } });
  };

  const handleDeleteClick = (id) => {
    setSelectedId(id);
    setShowConfirm(true); // show custom popup
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`${API_URL}/timesheets/${selectedId}/`);
      // Update state efficiently without refetch
      const updatedTimesheets = timesheets.filter((t) => t.id !== selectedId);
      setTimesheets(updatedTimesheets);

      setSuccessMessage("Timesheet deleted successfully.");
      // Adjust page if last item deleted
      const computedTotalPages = Math.ceil(updatedTimesheets.length / timesheetsPerPage);
      if (updatedTimesheets.length > 0 && currentPage > computedTotalPages) {
        setCurrentPage(currentPage - 1);
      }
    } catch (error) {
      console.error("Error deleting timesheet:", error);
      setError("Failed to delete timesheet.");
    } finally {
      setShowConfirm(false);
      setSelectedId(null);
      setTimeout(() => {
        setSuccessMessage("");
        setError("");
      }, 3000);
    }
  };

  const cancelDelete = () => {
    setShowConfirm(false);
    setSelectedId(null);
  };

  // ⭐️ PAGINATION LOGIC ⭐️
  const indexOfLastTimesheet = currentPage * timesheetsPerPage;
  const indexOfFirstTimesheet = indexOfLastTimesheet - timesheetsPerPage;
  const currentTimesheets = timesheets.slice(indexOfFirstTimesheet, indexOfLastTimesheet);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // ⭐️ PAGINATION CONTROLS COMPONENT ⭐️
  const PaginationControls = () => {
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
    if (totalPages <= 1) return null;

    return (
      <nav className="pagination-controls">
        {/* PREVIOUS BUTTON */}
        <button
          onClick={() => paginate(currentPage - 1)}
          disabled={currentPage === 1}
          className="btn btn-sm"
        >
          <FaChevronLeft /> Previous
        </button>
        {/* NUMBERED PAGE LINKS */}
        <ul className="pagination-list">
          {pageNumbers.map(number => (
            <li key={number} className="page-item">
              <button
                onClick={() => paginate(number)}
                className={`page-link ${currentPage === number ? 'active' : ''}`}
              >
                {number}
              </button>
            </li>
          ))}
        </ul>
        {/* NEXT BUTTON */}
        <button
          onClick={() => paginate(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="btn btn-sm"
        >
          Next <FaChevronRight />
        </button>
      </nav>
    );
  };

  return (
    <div className="admin-layout">
      <nav
        className={`admin-sidebar ${sidebarCollapsed ? "collapsed" : ""}`}
        style={{ width: sidebarCollapsed ? 60 : 250 }}
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
          {!sidebarCollapsed && <h3 className="sidebar-title">APPLICATION ADMIN</h3>}
          {!sidebarCollapsed && (
            <>
              <div className="current-date">{currentDate}</div>
              <button onClick={handleLogout} className="btn btn-outline btn-sm logout-btn">
                Logout
              </button>
            </>
          )}
        </div>
        <ul className="sidebar-nav">
          {sections.map((sec) => (
            <li key={sec}>
              <button
                onClick={() => handleSectionClick(sec)}
                className={activeSection === sec ? "active" : ""}
              >
                {getIconForSection(sec)}
                {!sidebarCollapsed && (
                  <span className="label">
                    {sec === "createTimesheet"
                      ? "Create Timesheet"
                      : sec === "viewTimesheets"
                      ? "View Timesheets"
                      : sec.charAt(0).toUpperCase() + sec.slice(1)}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <main className="admin-content" style={{ marginLeft: sidebarCollapsed ? 60 : 0 }}>
        {activeSection === "createTimesheet" && (
          <div className="timesheet-page-content">
            <TimesheetForm onClose={() => setActiveSection("projects")} />
          </div>
        )}
        {activeSection === "viewTimesheets" && (
          <div className="timesheet-page-content">
            <h2 className="view-title">
              <FaClipboardList /> View Timesheets
            </h2>
            {error && <div className="alert alert-error">{error}</div>}
            {successMessage && <div className="alert alert-success">{successMessage}</div>}
            {timesheets.length ? (
              <div className="timesheet-list-container">
                <div className="timesheet-header-row">
                  <span className="col date-col">Date</span>
                  <span className="col foreman-col">Foreman</span>
                  <span className="col job-name-col">Job Name</span>
                  <span className="col job-code-col">Job Code</span>
                  <span className="col contract-col">Contract No</span>
                  <span className="col engineer-col">Project Engineer</span>
                  <span className="col actions-col">Actions</span>
                </div>
                <div className="timesheet-list">
                  {currentTimesheets.map((ts) => (
                    <div
                      key={ts.id}
                      className="timesheet-row"
                      onClick={(e) => handleRowClick(ts, e)}
                    >
                      <span className="col date-col">
                        {new Date(ts.date).toLocaleDateString()}
                      </span>
                      <span className="col foreman-col">{ts.foreman_name || "N/A"}</span>
                      <span className="col job-name-col">
                        {ts.job_name || ts.data?.job?.job_name || "N/A"}
                      </span>
                      <span className="col job-code-col">
                        {ts.data?.job?.job_code || "N/A"}
                      </span>
                      <span className="col contract-col">
                        {ts.data?.contract_no || "N/A"}
                      </span>
                      <span className="col engineer-col">
                        {ts.data?.project_engineer || "N/A"}
                      </span>
                      <span className="col actions-col">
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(ts.id);
                          }}
                        >
                          <FaTrash /> Delete
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
                <PaginationControls />
              </div>
            ) : (
              <p className="empty-message">No timesheets available.</p>
            )}
          </div>
        )}
        {/* --- Confirmation Modal --- */}
        {showConfirm && (
          <div className="confirm-overlay">
            <div className="confirm-box">
              <h4>Confirm Deletion</h4>
              <p>Are you sure you want to delete this timesheet?</p>
              <div className="confirm-actions">
                <button className="btn btn-danger" onClick={confirmDelete}>
                  Yes, Delete
                </button>
                <button className="btn btn-secondary" onClick={cancelDelete}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        {/* --- Global Alert Message --- */}
        {alertMessage && (
          <div className={`alert ${alertType === "success" ? "alert-success" : "alert-error"}`}>
            {alertMessage}
          </div>
        )}
      </main>
    </div>
  );
}
