import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUserShield, FaUserTie, FaUserCog } from 'react-icons/fa';

const API_URL = 'http://127.0.0.1:8000/api';

// === 🌷 ELEGANT LIGHT COLORS STYLES ===
const styles = {
    container: {
        padding: '40px',
        marginBottom: '30px',
        maxWidth: '1200px',
        margin: '0 auto',
        fontFamily: "'Inter', 'Segoe UI', sans-serif", 
        backgroundColor: '#fcfcfc', // Near-white background
        borderRadius: '12px',
    },
    header: {
        marginBottom: '50px',
        textAlign: 'center',
        color: '#34495e', // Professional dark gray
        fontWeight: '700', 
        fontSize: '2.4em', 
        paddingBottom: '10px',
        borderBottom: '4px solid #b39ddb', // Soft Lavender primary color
        width: 'fit-content', 
        margin: '0 auto 50px auto', 
        letterSpacing: '1px', 
        textTransform: 'uppercase', 
    },
    cardContainer: {
        display: 'flex',
        justifyContent: 'center',
        gap: '30px', 
        flexWrap: 'wrap',
    },
    // Base Card Style
    card: {
        position: 'relative',
        backgroundColor: '#ffffff', 
        borderRadius: '10px', 
        textAlign: 'center',
        flexBasis: '300px',
        flexGrow: 1,
        maxWidth: '360px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', // Even softer shadow
        overflow: 'hidden', 
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        color: '#546e7a', // Medium gray body text
        border: '1px solid #e0e0e0', // Subtle border
    },
    // Hover Effect: Slight lift and shadow enhancement
    cardHover: {
        transform: 'translateY(-4px)',
        boxShadow: '0 8px 18px rgba(0, 0, 0, 0.1)',
    },
    
    // Header Bar Styles
    cardHeaderBar: {
        padding: '12px 10px', // Slightly smaller bar
        fontWeight: '700', // Bold text on light bar
        fontSize: '1.0em',
        textTransform: 'uppercase',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        letterSpacing: '0.5px',
    },
    
    // Role-Specific Light/Elegant Themes
    foremanTheme: { 
        backgroundColor: '#e6ee9c', // Pale Lime (Soft Action)
        color: '#558b2f', // Dark Green Text for contrast
    },
    supervisorTheme: {
        backgroundColor: '#fff9c4', // Pale Yellow (Soft Review)
        color: '#ff8f00', // Dark Orange Text for contrast
    },
    projectEngineerTheme: { 
        backgroundColor: '#ffccbc', // Pale Peach (Soft Alert)
        color: '#e64a19', // Dark Red Text for contrast
    },

    icon: {
        fontSize: '20px', 
    },
    
    // Body Content (below the bar)
    cardBody: {
        padding: '30px 30px 25px 30px',
    },
    
    count: {
        fontSize: '4.0em', // Larger count for focus
        fontWeight: '800', 
        margin: '10px 0 5px 0',
    },
    countText: {
        fontSize: '0.9em',
        color: '#90a4ae', // Very subdued descriptor text
    },

    loadingState: {
        textAlign: 'center',
        padding: '60px',
        color: '#78909c',
        fontSize: '1.3em',
        fontWeight: '500',
    },
    errorState: {
        textAlign: 'center',
        padding: '40px',
        color: '#d32f2f',
        backgroundColor: '#ffebee',
        border: '1px solid #ef9a9a',
        borderRadius: '8px',
        fontSize: '1.1em',
        fontWeight: '600',
    }
};

// ---

const TimesheetCounts = () => {
    const [counts, setCounts] = useState({
        foreman: 0,
        supervisor: 0,
        project_engineer: 0, 
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hoveredCard, setHoveredCard] = useState(null); 

    useEffect(() => {
        const fetchTimesheetCounts = async () => {
            setIsLoading(true);
            try {
                const response = await axios.get(`${API_URL}/timesheets/counts-by-status`);
                setCounts(response.data);
                setError(null);
            } catch (err) {
                console.error("Error fetching timesheet counts:", err);
                setError("Failed to load timesheet counts. Check API connection.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchTimesheetCounts();
    }, []);

    // Function to merge styles, including hover
    const getCardStyle = (cardName) => {
        return hoveredCard === cardName 
            ? {...styles.card, ...styles.cardHover}
            : styles.card;
    };

    // Helper to extract the accent color (text color of the header bar) for the count text
    const getAccentColor = (role) => {
        if (role === 'foreman') return styles.foremanTheme.color;
        if (role === 'supervisor') return styles.supervisorTheme.color;
        if (role === 'project_engineer') return styles.projectEngineerTheme.color;
        return '#374151'; 
    };

    if (isLoading) {
        return <div style={styles.loadingState}>⏳ Loading Timesheet Counts...</div>;
    }

    if (error) {
        return <div style={styles.errorState}>🛑 Error: {error}</div>;
    }

    return (
        <div className="timesheet-counts-container" style={styles.container}>
            <h3 style={styles.header}>Timesheet Approval Status</h3>
            <div style={styles.cardContainer}>
                
                {/* Card 1: Foreman - Pale Lime */}
                <div 
                    style={getCardStyle('foreman')}
                    onMouseEnter={() => setHoveredCard('foreman')}
                    onMouseLeave={() => setHoveredCard(null)}
                >
                    <div style={{...styles.cardHeaderBar, ...styles.foremanTheme}}>
                        <FaUserTie size={styles.icon.fontSize} style={styles.icon} />
                        With Foreman
                    </div>
                    <div style={styles.cardBody}>
                        <p style={{...styles.count, color: getAccentColor('foreman')}}>{counts.foreman}</p>
                        <p style={styles.countText}>Pending Timesheets</p>
                    </div>
                </div>

                {/* Card 2: Supervisor - Pale Yellow */}
                <div 
                    style={getCardStyle('supervisor')}
                    onMouseEnter={() => setHoveredCard('supervisor')}
                    onMouseLeave={() => setHoveredCard(null)}
                >
                    <div style={{...styles.cardHeaderBar, ...styles.supervisorTheme}}>
                        <FaUserShield size={styles.icon.fontSize} style={styles.icon} />
                        With Supervisor
                    </div>
                    <div style={styles.cardBody}>
                        <p style={{...styles.count, color: getAccentColor('supervisor')}}>{counts.supervisor}</p>
                        <p style={styles.countText}>Pending Timesheets</p>
                    </div>
                </div>

                {/* Card 3: Project Engineer - Pale Peach */}
                <div 
                    style={getCardStyle('project_engineer')}
                    onMouseEnter={() => setHoveredCard('project_engineer')}
                    onMouseLeave={() => setHoveredCard(null)}
                >
                    <div style={{...styles.cardHeaderBar, ...styles.projectEngineerTheme}}>
                        <FaUserCog size={styles.icon.fontSize} style={styles.icon} />
                        With Project Engineer
                    </div>
                    <div style={styles.cardBody}>
                        <p style={{...styles.count, color: getAccentColor('project_engineer')}}>{counts.project_engineer}</p>
                        <p style={styles.countText}>Pending Timesheets</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimesheetCounts;