import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api";

const TimesheetForm = ({ onClose }) => {
    const [foremen, setForemen] = useState([]);
    const [jobCodes, setJobCodes] = useState([]);
    const [selectedForemanId, setSelectedForemanId] = useState("");
    const [foremanData, setForemanData] = useState(null);
    const [selectedJobCode, setSelectedJobCode] = useState("");
    const [jobData, setJobData] = useState(null);
    const [selectedPhases, setSelectedPhases] = useState([]);
    const [supervisors, setSupervisors] = useState([]);
    const [selectedSupervisorId, setSelectedSupervisorId] = useState("");

    // --- Additional fields ---
    const [jobName, setJobName] = useState("");
    const [timeOfDay, setTimeOfDay] = useState("");
    const [weather, setWeather] = useState("");
    const [temperature, setTemperature] = useState("");
    const [locations, setLocations] = useState([]);   // list of all locations
const [location, setLocation] = useState(""); 
    const [projectEngineer, setProjectEngineer] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [loading, setLoading] = useState(false);
    const [selectedJobPhaseId, setSelectedJobPhaseId] = useState(null);
    const [unit, setUnit] = useState('C');
    
    const timeOfDayOptions = ["Day", "Night"];
    const weatherOptions = ["Sunny", "Cloudy", "Rainy", "Snowy", "Windy"];

    const [workDescription, setWorkDescription] = useState("");
    const [concreteSupplier, setConcreteSupplier] = useState("");
    const [concreteOrderDetails, setConcreteOrderDetails] = useState("");
    const [concreteOnTime, setConcreteOnTime] = useState("");
    const [asphaltOrderDetails, setAsphaltOrderDetails] = useState("");
    const [asphaltSupplier, setAsphaltSupplier] = useState("");
    const [aggregateOrderDetails, setAggregateOrderDetails] = useState("");
    const [aggregateSupplier, setAggregateSupplier] = useState("");
    const [topSoilOrderDetails, setTopSoilOrderDetails] = useState("");
    const [topSoilSupplier, setTopSoilSupplier] = useState("");
    const [truckingScheduleByPriority, setTruckingScheduleByPriority] = useState("");
    const [truckingDetails, setTruckingDetails] = useState("");
    const [sweepingDetails, setSweepingDetails] = useState("");
    const [contract, setContract] = useState("");
    const [suppliers, setSuppliers] = useState([]);

useEffect(() => {
  axios.get(`${API_URL}/suppliers/`)
    .then(res => {
      console.log("Fetched suppliers:", res.data);
      setSuppliers(res.data);
    })
    .catch(err => console.error('Error fetching suppliers:', err));
}, []);


// In TimesheetForm.jsx

// --- Load initial data (Foremen and Job Codes) ---
useEffect(() => {
  // Fetch foremen
  axios.get(`${API_URL}/users/role/foreman`)
    .then(res => {
      setForemen(res.data);
    })
    .catch(err => {
      console.error("Failed to load foremen:", err);
      setForemen([]); // fallback to empty
    });

  // Fetch supervisors
  axios.get(`${API_URL}/users/role/supervisor`)
    .then(res => {
      setSupervisors(res.data);
    })
    .catch(err => {
      console.error("Failed to load supervisors:", err);
      setSupervisors([]); // fallback to empty
    });

  // Fetch job phases
  axios.get(`${API_URL}/job-phases/active`)
    .then(res => {
      setJobCodes(res.data);
    })
    .catch(err => {
      console.error("Failed to load job codes:", err);
      setJobCodes([]);
    });
}, []);



    // --- Load foreman's crew mapping ---
    useEffect(() => {
        if (!selectedForemanId) {
            setForemanData(null);
            return;
        }

        axios.get(`${API_URL}/crew-mapping/`)
            .then((res) => {
                const crewForForeman = res.data.find(
                    (crew) => crew.foreman_id === parseInt(selectedForemanId, 10)
                );

                if (crewForForeman) {
                    setForemanData(crewForForeman);
                } else {
                    console.error(`No crew mapping found for foreman ID ${selectedForemanId}`);
                    setForemanData(null);
                }
            })
            .catch((err) => {
                console.error("Error fetching crew mappings:", err);
                setForemanData(null);
            });
    }, [selectedForemanId]);


    useEffect(() => {
    setLoading(true);
    axios
      .get(`${API_URL}/locations/`)
      .then((res) => setLocations(res.data))
      .catch((err) => console.error("Error fetching locations:", err))
      .finally(() => setLoading(false));
  }, []);
    // --- Load job details ---
    useEffect(() => {
        if (!selectedJobCode) {
            setJobData(null);
            setJobName("");
            setProjectEngineer("");
            setSelectedJobPhaseId(null);
            return;
        }
        axios.get(`${API_URL}/job-phases/${selectedJobCode}`)
            .then((res) => {
                setJobData(res.data);
                setSelectedPhases([]);
                setJobName(res.data.job_description || "");
                setProjectEngineer(res.data.project_engineer || "");
                setContract(res.data.contract_no || "");
                setSelectedJobPhaseId(res.data.id);
            })
            .catch(() => {
                setJobData(null);
                setJobName("");
                setProjectEngineer("");
                setSelectedJobPhaseId(null);
            });
    }, [selectedJobCode]);

    const handlePhaseChange = (phase) => {
        setSelectedPhases((prev) =>
            prev.includes(phase) ? prev.filter((p) => p !== phase) : [...prev, phase]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedForemanId || !selectedJobCode) {
            alert("Please select both Foreman and Job Code before submitting.");
            return;
        }
        const selectedSupervisor = supervisors.find(
    (sup) => sup.id === parseInt(selectedSupervisorId, 10)
  );
        const timesheetData = {
            job_name: jobName,
            job: {
                job_code: selectedJobCode,
                phase_codes: selectedPhases,
            },
            time_of_day: timeOfDay,
            weather,
            temperature: `${temperature}°${unit}`,
            location,
            contract_no: contract,
            project_engineer: projectEngineer,
            supervisor: selectedSupervisor
      ? {
          id: selectedSupervisor.id,
          name: `${selectedSupervisor.first_name} ${selectedSupervisor.last_name}`,
        }
      : null,
            ...foremanData,
            work_description: workDescription,
  concrete_supplier: concreteSupplier,
  concrete_order_details: concreteOrderDetails,
  concrete_on_time: concreteOnTime,
  asphalt_order_details: asphaltOrderDetails,
  asphalt_supplier: asphaltSupplier,
  aggregate_order_details: aggregateOrderDetails,
  aggregate_supplier: aggregateSupplier,
  top_soil_order_details: topSoilOrderDetails,
  top_soil_supplier: topSoilSupplier,
  trucking_schedule_by_priority: truckingScheduleByPriority,
  trucking_details: truckingDetails,
  sweeping_details: sweepingDetails,
        };

        const payload = {
            foreman_id: parseInt(selectedForemanId, 10),
            // supervisor_id: selectedSupervisorId ? parseInt(selectedSupervisorId, 10) : null,
            date,
            job_phase_id: selectedJobPhaseId,
            data: timesheetData,
            status: "Pending" 
        };

        console.log("📦 Sending Payload:", payload);
        setLoading(true);

        try {
            await axios.post(`${API_URL}/timesheets/`, payload);
            alert("Timesheet sent successfully!");
            onClose();
        } catch (err) {
            console.error("❌ Error sending timesheet:", err.response?.data);
            alert(`Error: ${JSON.stringify(err.response?.data?.detail || err.message)}`);
        } finally {
            setLoading(false);
        }
    };
const concreteSupplierOptions = suppliers
  .map(s => s.concrete_supplier)
  .filter(name => name && name.trim() !== "");

const asphaltSupplierOptions = suppliers
  .map(s => s.asphalt_supplier)
  .filter(name => name && name.trim() !== "");

const aggregateSupplierOptions = suppliers
  .map(s => s.aggregate_supplier)
  .filter(name => name && name.trim() !== "");

const topSoilSupplierOptions = suppliers
  .map(s => s.top_soil_supplier)
  .filter(name => name && name.trim() !== "");
    return (
        <div className="timesheet-page-container">
            <header className="page-header">
                <h2>Create Timesheet</h2>
                <button onClick={onClose} className="modal-close-btn">&times;</button>
            </header>
            <form onSubmit={handleSubmit} className="form-content">
                {/* Job Name and Date */}
                <div className="grid-2-cols">
                    <div className="form-group">
                        <label htmlFor="jobName">Job Name</label>
                        <input id="jobName" type="text" value={jobName} onChange={(e) => setJobName(e.target.value)} placeholder="Job name is auto-filled" required disabled className="form-input" />
                    </div>
                     <div className="form-group">
                            <label htmlFor="date">Date</label>
                            <input
                                id="date" type="date" value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="form-input" disabled={loading}
                                max={new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
                                min={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]} // optional: allow 30 days in past
                                // max={new Date().toISOString().split("T")[0]}
                            />
                        </div>
                </div>

                {/* Foreman Selection */}
                <div className="form-group">
                    <label htmlFor="foreman">Foreman</label>
                    <select id="foreman" className="form-select" value={selectedForemanId} onChange={(e) => setSelectedForemanId(e.target.value)} disabled={loading} required>
                        <option value="">-- Select Foreman --</option>
                        {foremen.map((fm) => (<option key={fm.id} value={fm.id}>{fm.first_name} {fm.last_name}</option>))}
                    </select>
                </div>
                
                {/* Crew Info Boxes */}
                {foremanData && (
                    <div className="crew-info-grid">
                        <aside className="crew-info-box box-indigo"><h3>Assigned Employees</h3><p>{foremanData.employees?.map((e) => `${e.first_name} ${e.last_name}`).join(", ") || "N/A"}</p></aside>
                        <aside className="crew-info-box box-indigo"><h3>Assigned Equipment</h3><p>{foremanData.equipment?.map((eq) => eq.name).join(", ") || "N/A"}</p></aside>
                        <aside className="crew-info-box box-green"><h3>Assigned Materials</h3><p>{foremanData.materials?.map((mat) => mat.name).join(", ") || "N/A"}</p></aside>
                        <aside className="crew-info-box box-yellow"><h3>Assigned Work Performed</h3><p>{foremanData.vendors?.map((ven) => ven.name).join(", ") || "N/A"}</p></aside>
                        <aside className="crew-info-box box-red"><h3>Assigned Dumping Sites</h3><p>{foremanData.dumping_sites?.map((site) => site.name).join(", ") || "N/A"}</p></aside>
                    </div>
                )}

                {/* Job Code and Phases */}
                <div className="form-group">
                    <label htmlFor="jobCode">Job Code</label>
                    <select id="jobCode" className="form-select" value={selectedJobCode} onChange={(e) => setSelectedJobCode(e.target.value)} disabled={loading} required>
                        <option value="">-- Select Job Code --</option>
                        {jobCodes.map((job) => (<option key={job.job_code} value={job.job_code}>{job.job_code}</option>))}
                    </select>
                    {jobData?.phase_codes?.length > 0 && (
                        <fieldset className="phase-selection-fieldset">
                            <legend>Select Phases:</legend>
                            <div className="phase-list">
                                {jobData.phase_codes.map((phaseObject) => (
                                    <label
                                        key={phaseObject.id}
                                        className={selectedPhases.includes(phaseObject.code) ? "selected-phase" : ""}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedPhases.includes(phaseObject.code)}
                                            onChange={() => handlePhaseChange(phaseObject.code)}
                                            disabled={loading}
                                        />
                                        <span>{phaseObject.code}</span>
                                    </label>
                                ))}
                            </div>
                        </fieldset>
                    )}
                </div>

                {/* ... other form fields are unchanged ... */}
                    <div className="grid-2-cols">
                        <div className="form-group">
  <label htmlFor="contract">Contract</label>
  <input
    id="contract"
    type="text"
    className="form-input"
    value={contract}
    onChange={(e) => setContract(e.target.value)}
    disabled={true} // if it should be read-only
  />
</div>
                                <div className="form-group">
                            <label htmlFor="projectEngineer">Project Engineer</label>
                            <input
                                id="projectEngineer" type="text" className="form-input"
                                value={projectEngineer} onChange={(e) => setProjectEngineer(e.target.value)}
                                disabled={true}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="timeOfDay">Time of Day</label>
                            <select
                                id="timeOfDay" className="form-select" value={timeOfDay}
                                onChange={(e) => setTimeOfDay(e.target.value)} disabled={loading}
                            >
                                <option value="">-- Select Time of Day --</option>
                                {timeOfDayOptions.map((option) => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="weather">Weather</label>
                            <select
                                id="weather" className="form-select" value={weather}
                                onChange={(e) => setWeather(e.target.value)} disabled={loading}
                            >
                                <option value="">-- Select Weather --</option>
                                {weatherOptions.map((option) => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="temperature">
                                Temperature ({unit === 'C' ? '°C' : '°F'})
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    id="temperature" type="number" className="form-input flex-1"
                                    value={temperature} onChange={(e) => setTemperature(e.target.value)}
                                    disabled={loading} placeholder={`Enter temperature in ${unit === 'C' ? 'Celsius' : 'Fahrenheit'}`}
                                />
                                <select
                                    value={unit} onChange={(e) => setUnit(e.target.value)}
                                    disabled={loading} className="form-select"
                                >
                                    <option value="C">°C</option>
                                    <option value="F">°F</option>
                                </select>
                            </div>
                        </div>
                        {/* <div className="form-group">
                            <label htmlFor="location">Location</label>
                            <input
                                id="location" type="text" className="form-input"
                                value={location} onChange={(e) => setLocation(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                         */}
                    
                        <div className="form-group">
  <label htmlFor="location">Location</label>
  <select
    id="location"
    className="form-input"
    value={location}
    onChange={(e) => setLocation(e.target.value)}
    disabled={loading}
  >
    <option value="">Select Location</option>
    {locations.map((loc) => (
      <option key={loc.id} value={loc.name}>
        {loc.name}
      </option>
    ))}
  </select>
</div>
<div className="form-group">
  <label htmlFor="supervisor">Supervisor</label>
  <select
    id="supervisor"
    className="form-select"
    value={selectedSupervisorId}
    onChange={(e) => setSelectedSupervisorId(e.target.value)}
    disabled={loading}
  >
    <option value="">-- Select Supervisor --</option>
    {supervisors.map((sup) => (
      <option key={sup.id} value={sup.id}>
        {sup.first_name} {sup.last_name}
      </option>
    ))}
  </select>
</div>


                        <div className="form-group">
                        <label htmlFor="workDescription">Work description</label>
                        <input
                            type="text"
                            id="workDescription"
                            value={workDescription}
                            onChange={(e) => setWorkDescription(e.target.value)}
                            className="form-input"
                        />
                        </div>

</div>
<h3>Concrete Details</h3>
<div className="grid-2-cols">
  <div className="form-group">
    <label>Supplier</label>
   <select
      className="form-input"
      value={concreteSupplier}
      onChange={(e) => setConcreteSupplier(e.target.value)}
    >
    
      <option value="">Select Concrete Supplier</option>
      {concreteSupplierOptions.length === 0 && <option disabled>No suppliers available</option>}
      {concreteSupplierOptions.map((name, index) => (
        <option key={index} value={name}>{name}</option>
        
      ))}
    </select>
    
</div>
  <div className="form-group">
    <label>Order Details</label>
    <input type="text" value={concreteOrderDetails}
      onChange={(e) => setConcreteOrderDetails(e.target.value)}
      className="form-input" />
  </div>
  <div className="form-group">
    <label>On Time</label>
    <input type="text" value={concreteOnTime}
      onChange={(e) => setConcreteOnTime(e.target.value)}
      className="form-input" />
  </div>
</div>

<h3>Asphalt Details</h3>
<div className="grid-2-cols">
  <div className="form-group">
    <label>Supplier</label>
     <select
      className="form-input"
      value={asphaltSupplier}
      onChange={(e) => setAsphaltSupplier(e.target.value)}
    >
      <option value="">Select Asphalt Supplier</option>
      {asphaltSupplierOptions.length === 0 && <option disabled>No suppliers available</option>}
      {asphaltSupplierOptions.map((name, index) => (
        <option key={index} value={name}>{name}</option>
      ))}
    </select>
  </div>
  <div className="form-group">
    <label>Order Details</label>
    <input type="text" value={asphaltOrderDetails}
      onChange={(e) => setAsphaltOrderDetails(e.target.value)}
      className="form-input" />
  </div>
</div>

<h3>Aggregate Details</h3>
<div className="grid-2-cols">
  <div className="form-group">
    <label>Supplier</label>
    <select
      className="form-input"
      value={aggregateSupplier}
      onChange={(e) => setAggregateSupplier(e.target.value)}
    >
      <option value="">Select Aggregate Supplier</option>
      {aggregateSupplierOptions.length === 0 && <option disabled>No suppliers available</option>}
      {aggregateSupplierOptions.map((name, index) => (
        <option key={index} value={name}>{name}</option>
      ))}
    </select>
  </div>
  <div className="form-group">
    <label>Order Details</label>
    <input type="text" value={aggregateOrderDetails}
      onChange={(e) => setAggregateOrderDetails(e.target.value)}
      className="form-input" />
  </div>
</div>

<h3>Top Soil Details</h3>
<div className="grid-2-cols">
  <div className="form-group">
    <label>Supplier</label>
    <select
      className="form-input"
      value={topSoilSupplier}
      onChange={(e) => setTopSoilSupplier(e.target.value)}
    >
      <option value="">Select Top Soil Supplier</option>
      {topSoilSupplierOptions.length === 0 && <option disabled>No suppliers available</option>}
      {topSoilSupplierOptions.map((name, index) => (
        <option key={index} value={name}>{name}</option>
      ))}
    </select>
  </div>
  <div className="form-group">
    <label>Order Details</label>
    <input type="text" value={topSoilOrderDetails}
      onChange={(e) => setTopSoilOrderDetails(e.target.value)}
      className="form-input" />
  </div>
</div>

<h3>Other Details</h3>
<div className="grid-2-cols">
<div className="form-group">
  <label>Trucking Schedule by Priority</label>
  <input type="text"
    value={truckingScheduleByPriority}
    onChange={(e) => setTruckingScheduleByPriority(e.target.value)}
    className="form-input"
  />
</div>
<div className="form-group">
  <label>Trucking Details</label>
  <input type="text"
    value={truckingDetails}
    onChange={(e) => setTruckingDetails(e.target.value)}
    className="form-input"
  />
</div>
<div className="form-group">
  <label>Sweeping Details</label>
  <input type="text"
    value={sweepingDetails}
    onChange={(e) => setSweepingDetails(e.target.value)}
    className="form-input"
  />
</div>
</div>

                {/* Submit Actions */}
                <div className="form-actions">
                    <button type="submit" disabled={loading} className={`btn ${loading ? "btn-secondary" : "btn-primary"}`}>
                        {loading ? "Sending..." : "Submit"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TimesheetForm;
