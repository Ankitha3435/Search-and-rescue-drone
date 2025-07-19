// Mission status display and control

// Update the mission status display
export function updateMissionStatus(missionStatus, searchPattern, peopleDetected, altitude) {
    const statusElem = document.getElementById('mission-status');
    statusElem.innerHTML = `
        <h3>Mission Status: ${missionStatus}</h3>
        <p>Search pattern: ${searchPattern}</p>
        <p>People detected: ${peopleDetected}</p>
        <p>Drone altitude: ${altitude.toFixed(1)}m</p>
    `;
} 