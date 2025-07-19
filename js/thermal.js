// Thermal imaging display functionality

// Update the thermal imaging display
export function updateThermalDisplay(thermalViewActive, droneGroup, people) {
    const thermalView = document.getElementById('thermal-view');
    const statusIndicator = thermalView.querySelector('.status-indicator');
    const coordinates = thermalView.querySelector('.coordinates');
    const heatReading = thermalView.querySelector('.heat-reading');

    // Clear existing heat signatures
    const existingSignatures = thermalView.querySelectorAll('.heat-signature');
    existingSignatures.forEach(sig => sig.remove());

    if (thermalViewActive) {
        // Update status
        statusIndicator.textContent = "STATUS: ACTIVE - THERMAL SCAN";
        statusIndicator.style.color = "#ff0000";

        // Update coordinates
        coordinates.textContent = "POS: " + droneGroup.position.x.toFixed(1) + ", " + droneGroup.position.z.toFixed(1);

        // Detect heat signatures within range
        const maxDetectionRange = 30; // meters
        let closestPersonDistance = Infinity;
        let closestPerson = null;

        people.forEach(person => {
            const dx = person.position.x - droneGroup.position.x;
            const dz = person.position.z - droneGroup.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            // Check if person is within detection range
            if (distance < maxDetectionRange) {
                // Convert 3D world position to 2D screen position
                const screenX = (dx / maxDetectionRange) * 160 + 160; // Center in the 320px wide display
                const screenY = (dz / maxDetectionRange) * 100 + 100; // Center in the ~200px high display

                // Create a heat signature blob
                const heatSig = document.createElement('div');
                heatSig.className = 'heat-signature';

                // Size and intensity based on distance
                const size = Math.max(5, 20 - (distance / maxDetectionRange) * 15);

                // Color based on temperature
                const temp = person.userData.heatLevel;
                let color;

                if (temp < 35) {
                    // Hypothermia - blue
                    color = 'rgba(0, 0, 255, 0.8)';
                } else if (temp < 36.5) {
                    // Cool - blue-green
                    color = 'rgba(0, 255, 200, 0.8)';
                } else if (temp < 37.5) {
                    // Normal - yellow-orange
                    color = 'rgba(255, 200, 0, 0.8)';
                } else if (temp < 38.5) {
                    // Fever - orange
                    color = 'rgba(255, 150, 0, 0.8)';
                } else {
                    // High fever - red
                    color = 'rgba(255, 0, 0, 0.8)';
                }

                heatSig.style.width = size + 'px';
                heatSig.style.height = size + 'px';
                heatSig.style.backgroundColor = color;
                heatSig.style.left = screenX + 'px';
                heatSig.style.top = screenY + 'px';

                thermalView.appendChild(heatSig);

                // Track closest person
                if (distance < closestPersonDistance) {
                    closestPersonDistance = distance;
                    closestPerson = person;
                }
            }
        });

        // Update heat reading for the closest person
        if (closestPerson) {
            heatReading.textContent = "HEAT: " + closestPerson.userData.heatLevel.toFixed(1) + "°C";
            heatReading.style.color = "#ff0000";
        } else {
            heatReading.textContent = "HEAT: --°C";
            heatReading.style.color = "#00ff00";
        }
    } else {
        // Thermal view inactive
        statusIndicator.textContent = "STATUS: STANDBY";
        statusIndicator.style.color = "#00ff00";
        coordinates.textContent = "POS: --, --";
        heatReading.textContent = "HEAT: --°C";
        heatReading.style.color = "#00ff00";
    }

    // Animate scan line
    const scanLine = thermalView.querySelector('.scan-line');
    const scanPosition = (Date.now() % 2000) / 2000; // 2 second cycle
    scanLine.style.top = (scanPosition * 204) + 'px';
} 