// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import LoginScreen from './components/LoginScreen';
// import AdminDashboard from './components/AdminDashboard';
// import MobileDashboard from './components/MobileDashboard';
// import ApplicationAdminPage from './components/ApplicationAdminPage';


// // Define the base URL for your backend API
// const API_URL = 'http://127.0.0.1:8000/api';

// function App() {
//     const [data, setData] = useState(null);
//     const [currentUser, setCurrentUser] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState('');
    

//     // Fetch all initial data from the backend when the app loads
//     const fetchData = async () => {
//         try {
//             const response = await axios.get(`${API_URL}/data`);
//             setData(response.data);
//             setError('');
//         } catch (err) {
//             setError("Could not connect to the backend. Please ensure the server is running.");
//             console.error(err);
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         fetchData();
//     }, []);

//     const handleLogin = (user) => {
//         setCurrentUser(user);
//     };

//     const handleLogout = () => {
//         setCurrentUser(null);
//     };

//     // This function allows child components to update the main app's data state
//     const handleDataUpdate = (dataType, newValues) => {
//         setData(prev => ({
//             ...prev,
//             [dataType]: newValues,
//         }));
//     };

//     if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Application Data...</div>;
//     if (error) return <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>{error}</div>;

//     let content;
// if (!currentUser) {
//     content = <LoginScreen onLogin={handleLogin} users={data?.users || []} />;
// } else if (currentUser.role === "admin") {
//     content = <AdminDashboard data={data} onLogout={handleLogout} onUpdate={handleDataUpdate} />;
// } else if (currentUser.role === "foreman") {
//     content = <MobileDashboard data={data} currentUser={currentUser} onLogout={handleLogout} />;
// } else if (currentUser.role === "appadmin") {
//     content = <ApplicationAdminPage user={currentUser} />;
// } else {
//     content = <div>This role is not yet supported. <button onClick={handleLogout}>Logout</button></div>;
// }

// return <div>{content}</div>;
// }

// export default App;




import React, { useState, useEffect } from "react";
import axios from "axios";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginScreen from "./components/LoginScreen";
import AdminDashboard from "./components/AdminDashboard";
import MobileDashboard from "./components/MobileDashboard";
import ApplicationAdminPage from "./components/ApplicationAdminPage";
import TimesheetDetails from "./components/TimesheetDetails.jsx";

const API_URL = "http://127.0.0.1:8000/api";

function App() {
  const [data, setData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_URL}/data`);
      setData(response.data);
      setError("");
    } catch (err) {
      setError("Could not connect to the backend. Please ensure the server is running.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogin = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleDataUpdate = (dataType, newValues) => {
    setData((prev) => ({
      ...prev,
      [dataType]: newValues,
    }));
  };

  if (loading)
    return <div style={{ padding: "2rem", textAlign: "center" }}>Loading Application Data...</div>;

  if (error)
    return <div style={{ padding: "2rem", textAlign: "center", color: "red" }}>{error}</div>;

  return (
    <Router>
      <Routes>
        {!currentUser ? (
          <Route
            path="/"
            element={<LoginScreen onLogin={handleLogin} users={data?.users || []} />}
          />
        ) : currentUser.role === "admin" ? (
          <Route
            path="/"
            element={<AdminDashboard data={data} onLogout={handleLogout} onUpdate={handleDataUpdate} />}
          />
        ) : currentUser.role === "foreman" ? (
          <Route
            path="/"
            element={<MobileDashboard data={data} currentUser={currentUser} onLogout={handleLogout} />}
          />
        ) : currentUser.role === "appadmin" ? (
          <>
            <Route path="/" element={<ApplicationAdminPage user={currentUser} />} />
            <Route path="/timesheet/:id" element={<TimesheetDetails />} />
            
          </>
        ) : (
          <Route
            path="/"
            element={
              <div>
                This role is not yet supported. <button onClick={handleLogout}>Logout</button>
              </div>
            }
          />
        )}
      </Routes>
    </Router>
  );
}

export default App;
