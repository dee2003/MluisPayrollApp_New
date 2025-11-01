import React, { useEffect, useState, useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaArrowLeft,
  FaChevronLeft,
  FaChevronRight,
  FaRegEdit, // Corresponds to 'createTimesheet'
  FaClipboardList, // Corresponds to 'viewTimesheets'
} from "react-icons/fa";
import "./ApplicationAdmin.css"; // Reuse your form/dashboard CSS

const API_URL = "http://127.0.0.1:8000/api";

const TimesheetDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // --- State for Timesheet Data (Original) ---
  const [ts, setTs] = useState(location.state?.timesheet || null);
  const [foremanData, setForemanData] = useState(null);

  // --- State and Logic for Sidebar (Copied from the provided code) ---
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Set the active section based on the current route/context. 
  // Since we are viewing a timesheet, we'll keep 'viewTimesheets' active.
  const activeSection = 'viewTimesheets'; 

  const currentDate = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    // In a real application, you'd navigate to the login page after clearing the token.
    // For this example, we'll navigate to the root or reload.
    window.location.reload(); 
    // navigate('/login'); 
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
  // --- End Sidebar Logic ---

  // --- Data Fetching Logic (Original) ---

  useEffect(() => {
    if (!ts) {
      axios.get(`${API_URL}/timesheets/${id}/`)
  .then((res) => {
    console.log("Full Timesheet Response:", res.data);
    setForemanData(res.data.data); // ✅ set only the nested 'data' field
  })
  .catch((err) => console.error("Failed to fetch timesheet details:", err));

    }
  }, [id, ts]);

  useEffect(() => {
    if (ts?.foreman_id) {
      axios
        .get(`${API_URL}/crew-mapping/by-foreman/${ts.foreman_id}`)
        .then((res) => {
  console.log("Foreman Data API response:", res.data);
  setForemanData(res.data);
})
        .catch((err) => console.error("Failed to fetch foreman data:", err));
    }
  }, [ts]);

  if (!ts) return <p>Loading...</p>;

  // --- Render Layout with Sidebar and Main Content ---

  return (
    <div className="admin-layout">
      {/* --- Sidebar (Copied Structure) --- */}
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
                // Modified: Navigate using react-router-dom instead of just setting local state
                onClick={() => {
if (sec === "viewTimesheets") {
  navigate("/", { state: { section: "viewTimesheets", refresh: Date.now() } });
} else if (sec === "createTimesheet") {
  navigate("/", { state: { section: "createTimesheet", refresh: Date.now() } });
}

}}

                className={activeSection === sec ? "active" : ""}
              >
                {getIconForSection(sec)}
                {!sidebarCollapsed && (
                  <span className="label">
                    {sec === "createTimesheet"
                      ? "Create Timesheet"
                      : "View Timesheets"}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* --- Main Content (Original TimesheetDetails) --- */}
      <div 
        className="main-content"
        // Ensure the main content shifts based on the sidebar state
        style={{ marginLeft: sidebarCollapsed ? 60 : 30 }}
      >
        <div className="page-header">
         <button 
  className="back-btn" 
 onClick={() => 
                    navigate("/", { 
                        state: { 
                            section: "viewTimesheets", 
                            refresh: Date.now() 
                        } 
                    })
                }
            >
  <FaArrowLeft /> Back
</button>

          <h2 className="page-title">{ts.timesheet_name}</h2>
        </div>

        {/* Job Info */}
        <div className="section">
          <h3 className="section-title">Job Information</h3>
          <table className="details-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Foreman</th>
                <th>Job Code</th>
                <th>Job Name</th>
              </tr>
            </thead>
            
            <tbody>
              <tr>
                <td>{new Date(ts.date).toLocaleDateString()}</td>
                <td>{ts.foreman_name || "N/A"}</td>
                <td>{ts.data?.job?.job_code || "N/A"}</td>
                <td>{ts.job_name || ts.data?.job?.job_name || "N/A"}</td>
              </tr>
            </tbody>
          </table>
        </div>
        {/* Additional Job Details */}
<div className="section">
  {/* <h3 className="section-title">Additional Job Details</h3> */}
  <table className="details-table">
    <thead>
      <tr>
        <th>Contract No</th>
        <th>Location</th>
        <th>Work Description</th>
        <th>Day or Night</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>{ts.data?.contract_no || "N/A"}</td>
        <td>{ts.data?.location || "N/A"}</td>
        <td>{ts.data?.work_description || "N/A"}</td>
        <td>{ts.data?.time_of_day || "N/A"}</td>
      </tr>
    </tbody>
  </table>
</div>

        {/* Crew Info */}
        {foremanData && (
          <div className="section">
            <h3 className="section-title">Crew Information</h3>
            <table className="details-table">
              <thead>
                <tr>
                  <th>Employees</th>
                  <th>Equipment</th>
                  <th>Materials</th>
                  <th>Vendors</th>
                  <th>Dumping Sites</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <ul>
                      {foremanData.employees?.length ? (
                        foremanData.employees.map((e, i) => (
                          <li key={i}>
                            {e.first_name} {e.last_name}
                          </li>
                        ))
                      ) : (
                        <li>N/A</li>
                      )}
                    </ul>
                  </td>
                  <td>
                    <ul>
                      {foremanData.equipment?.length ? (
                        foremanData.equipment.map((eq, i) => (
                          <li key={i}>{eq.name}</li>
                        ))
                      ) : (
                        <li>N/A</li>
                      )}
                    </ul>
                  </td>
                  <td>
                    <ul>
                      {foremanData.materials?.length ? (
                        foremanData.materials.map((mat, i) => (
                          <li key={i}>{mat.name}</li>
                        ))
                      ) : (
                        <li>N/A</li>
                      )}
                    </ul>
                  </td>
                  <td>
                    <ul>
                      {foremanData.vendors?.length ? (
                        foremanData.vendors.map((ven, i) => (
                          <li key={i}>{ven.name}</li>
                        ))
                      ) : (
                        <li>N/A</li>
                      )}
                    </ul>
                  </td>
                  <td>
                    <ul>
                      {foremanData.dumping_sites?.length ? (
                        foremanData.dumping_sites.map((site, i) => (
                          <li key={i}>{site.name}</li>
                        ))
                      ) : (
                        <li>N/A</li>
                      )}
                    </ul>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Concrete Details */}
        <div className="section">
          <h3 className="section-title">Concrete Details</h3>
          <table className="details-table">
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Order Details</th>
                <th>On Time</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{ts.data?.concrete_supplier || "N/A"}</td>
                <td>{ts.data?.concrete_order_details || "N/A"}</td>
                <td>{ts.data?.concrete_on_time || "N/A"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Asphalt Details */}
       <div className="section-row">
  {/* Asphalt Details */}
  <div className="section half">
    <h3 className="section-title">Asphalt Details</h3>
    <table className="details-table">
      <thead>
        <tr>
          <th>Supplier</th>
          <th>Order Details</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>{ts.data?.asphalt_supplier || "N/A"}</td>
          <td>{ts.data?.asphalt_order_details || "N/A"}</td>
        </tr>
      </tbody>
    </table>
  </div>

  {/* Aggregate Details */}
  <div className="section half">
    <h3 className="section-title">Aggregate Details</h3>
    <table className="details-table">
      <thead>
        <tr>
          <th>Supplier</th>
          <th>Order Details</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>{ts.data?.aggregate_supplier || "N/A"}</td>
          <td>{ts.data?.aggregate_order_details || "N/A"}</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>


        {/* Top Soil Details */}
        <div className="section">
          <h3 className="section-title">Top Soil Details</h3>
          <table className="details-table">
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Order Details</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{ts.data?.top_soil_supplier || "N/A"}</td>
                <td>{ts.data?.top_soil_order_details || "N/A"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Other Details */}
        <div className="section">
          <h3 className="section-title">Other Details</h3>
          <table className="details-table">
            <thead>
              <tr>
                <th>Trucking Schedule by Priority</th>
                <th>Trucking Details</th>
                <th>Sweeping Details</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{ts.data?.trucking_schedule_by_priority || "N/A"}</td>
                <td>{ts.data?.trucking_details || "N/A"}</td>
                <td>{ts.data?.sweeping_details || "N/A"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TimesheetDetails;