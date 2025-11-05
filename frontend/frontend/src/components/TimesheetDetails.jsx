import React, { useEffect, useState, useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaArrowLeft,
  FaChevronLeft,
  FaChevronRight,
  FaRegEdit,
  FaClipboardList,
} from "react-icons/fa";
import "./ApplicationAdmin.css";

const API_URL = "http://127.0.0.1:8000/api";

const TimesheetDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [ts, setTs] = useState(null); // Start with null to ensure fresh data is fetched
  const [foremanData, setForemanData] = useState(null);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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

  // Fetch data whenever the component mounts or the ID changes
  useEffect(() => {
    if (id) {
      axios.get(`${API_URL}/timesheets/${id}/`)
        .then((res) => {
          console.log("API Response for Timesheet:", res.data.data);
          setTs(res.data.data);
        })
        .catch((err) => console.error("Failed to fetch timesheet details:", err));
    }
  }, [id]);

  useEffect(() => {
    if (ts?.foreman_id) {
      axios.get(`${API_URL}/crew-mapping/by-foreman/${ts.foreman_id}`)
        .then((res) => {
          setForemanData(res.data);
        })
        .catch((err) => console.error("Failed to fetch foreman data:", err));
    }
  }, [ts]);

  if (!ts) {
    return <p>Loading...</p>;
  }

  return (
    <div className="admin-layout">
      {/* Sidebar Section */}
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
                onClick={() => navigate("/", { state: { section: sec, refresh: Date.now() } })}
                className={activeSection === sec ? "active" : ""}
              >
                {getIconForSection(sec)}
                {!sidebarCollapsed && (
                  <span className="label">
                    {sec === "createTimesheet" ? "Create Timesheet" : "View Timesheets"}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Main Content Section */}
      <div
        className="main-content"
        style={{ marginLeft: sidebarCollapsed ? 60 : 250 }}
      >
        <div className="page-header">
          <button
            className="back-btn"
            onClick={() => navigate("/", { state: { section: "viewTimesheets", refresh: Date.now() } })}
          >
            <FaArrowLeft /> Back
          </button>
          <h2 className="page-title">{ts.timesheet_name}</h2>
        </div>

        <div className="section">
          <h3 className="section-title">Job Information</h3>
          <table className="details-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Foreman</th>
                <th>Supervisor</th>
                <th>Job Code</th>
                <th>Job Name</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{new Date(ts.date).toLocaleDateString()}</td>
                <td>{ts.foreman_name || "N/A"}</td>
                <td>{ts.supervisor?.name || "N/A"}</td>
                <td>{ts.job?.job_code || "N/A"}</td>
                <td>{ts.job_name || ts.job?.job_name || "N/A"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="section">
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
                <td>{ts.contract_no || "N/A"}</td>
                <td>{ts.location || "N/A"}</td>
                <td>{ts.work_description || "N/A"}</td>
                <td>{ts.time_of_day || "N/A"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="section">
          <h3 className="section-title">Phase Details</h3>
          <table className="details-table">
            <thead>
              <tr>
                <th>Phase Codes</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <ul>
                    {ts.job?.phase_codes?.length > 0 ? (
                      ts.job.phase_codes.map((code, index) => (
                        <li key={index}>{code}</li>
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
                          <li key={i}>{e.first_name} {e.last_name}</li>
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

        {/* Asphalt and Aggregate Details */}
        <div className="section-row">
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
