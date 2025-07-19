// Main entry point for the application
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.1/three.module.min.js';
import { setupScene, mainCamera, dronePOVCamera } from './scene.js';
import { createDrone } from './drone.js';
import { createTerrain, getTerrainHeightAt } from './terrain.js';
import { createPeople } from './people.js';
import { createTrees, createRocks } from './environment.js';
import { updateThermalDisplay } from './thermal.js';
import { updateMissionStatus } from './mission.js';
import { createBuildings } from './buildings.js';
import { createRoads } from './roads.js';

// Initialize scene
const { scene, renderer, ambientLight, directionalLight } = setupScene();

// Current active camera
let activeCamera = mainCamera;

// Create terrain
const { terrain, terrainSize } = createTerrain(scene);

// Create water
const waterGeometry = new THREE.PlaneGeometry(terrainSize, terrainSize);
const waterMaterial = new THREE.MeshStandardMaterial({
    color: 0x1E90FF,
    transparent: true,
    opacity: 0.8,
    roughness: 0.2,
    metalness: 0.1
});

const water = new THREE.Mesh(waterGeometry, waterMaterial);
water.rotation.x = -Math.PI / 2;
water.position.y = -2; // Below most of the terrain
scene.add(water);

// Create drone with rotors
const { droneGroup, rotors, spotlight, spotlightTarget } = createDrone(scene, dronePOVCamera);

// Set initial drone height to be higher, safely above trees and buildings
droneGroup.position.y = 40; // Increased from default 5 to 40 meters

// Create trees and rocks
const trees = createTrees(scene, terrainSize, getTerrainHeightAt);
const rocks = createRocks(scene, terrainSize, getTerrainHeightAt);

// Create buildings and towns
const buildings = createBuildings(scene, terrainSize, getTerrainHeightAt);

// Create road network connecting buildings
const roads = createRoads(scene, terrainSize, getTerrainHeightAt, buildings);

// Create people to rescue
const people = createPeople(scene, terrainSize, getTerrainHeightAt);

// Controls
const keys = {};
const moveSpeed = 0.2;
const rotateSpeed = 0.05;

// Heights for different modes
const DEFAULT_FLIGHT_HEIGHT = 40;
const MIN_SAFE_HEIGHT = 35;    // Minimum safe height above terrain
const SEARCH_PATTERN_HEIGHT = 50; // Height for automated search patterns
const INVESTIGATION_HEIGHT = 30; // Height for investigating heat sources

// Search speed settings
const NORMAL_SEARCH_SPEED = 1.5; // Faster speed for normal search (was 0.5)
const INVESTIGATION_SPEED = 0.8; // Slower speed for investigating heat sources

// Heat source detection settings
const HEAT_DETECTION_RANGE = 40; // Maximum range for heat detection
const HOVER_TIME = 5; // Time to hover over a heat source in seconds
let hoverTimer = 0; // Timer for hovering
let heatSourceTarget = null; // Current heat source being investigated
let isInvestigating = false; // Flag to indicate if the drone is investigating a heat source
let investigationComplete = false; // Flag to indicate if the current investigation is complete

document.addEventListener('keydown', (event) => {
    keys[event.key] = true;
});

document.addEventListener('keyup', (event) => {
    keys[event.key] = false;
});

// Handle window resize
window.addEventListener('resize', () => {
    mainCamera.aspect = window.innerWidth / window.innerHeight;
    mainCamera.updateProjectionMatrix();
    dronePOVCamera.aspect = window.innerWidth / window.innerHeight;
    dronePOVCamera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Toggle camera view
document.getElementById('toggle-view').addEventListener('click', () => {
    activeCamera = activeCamera === mainCamera ? dronePOVCamera : mainCamera;
});

// Thermal view toggle
let thermalViewActive = false;
document.getElementById('toggle-thermal').addEventListener('click', () => {
    thermalViewActive = !thermalViewActive;
    updateThermalDisplay(thermalViewActive, droneGroup, people);
});

// Mission control
let autoMode = false;
let missionPath = [];
let currentPathIndex = 0;
let missionStatus = "Standby";
let searchPattern = "None";
let peopleDetected = 0;

// Automatic search mode
document.getElementById('start-auto').addEventListener('click', () => {
    autoMode = true;
    manualMode = false;
    thermalViewActive = true; // Automatically activate thermal view for search
    updateThermalDisplay(thermalViewActive, droneGroup, people);

    // Generate a search pattern starting from the drone's current position
    missionPath = generateGridSearchPattern(droneGroup.position.x, droneGroup.position.z);
    currentPathIndex = 0;
    missionStatus = "Searching";
    searchPattern = "Grid Search";
    isInvestigating = false;
    investigationComplete = false;
    heatSourceTarget = null;
    updateMissionStatus(missionStatus, searchPattern, peopleDetected, droneGroup.position.y);
});

// Manual control mode
let manualMode = true;
document.getElementById('manual-control').addEventListener('click', () => {
    autoMode = false;
    manualMode = true;
    missionStatus = "Manual Control";
    searchPattern = "None";
    isInvestigating = false;
    updateMissionStatus(missionStatus, searchPattern, peopleDetected, droneGroup.position.y);
});

// Generate a grid search pattern (straight lines back and forth) starting from the current position
function generateGridSearchPattern(startX, startZ) {
    const path = [];
    const gridSize = 180; // Search area size
    const lineSpacing = 20; // Distance between search lines
    
    // Calculate grid boundaries centered around the starting position
    const halfGrid = gridSize / 2;
    const gridMinX = startX - halfGrid;
    const gridMaxX = startX + halfGrid;
    const gridMinZ = startZ - halfGrid;
    const gridMaxZ = startZ + halfGrid;
    
    // Add the first point at the current position but at search height
    path.push({ 
        x: startX, 
        y: SEARCH_PATTERN_HEIGHT, 
        z: startZ
    });
    
    // Start from the current position and move to the bottom-left of the grid
    path.push({
        x: gridMinX,
        y: SEARCH_PATTERN_HEIGHT,
        z: gridMinZ
    });
    
    // Simple back-and-forth pattern starting from the bottom-left corner
    let goingRight = true;
    
    // Create a zigzag pattern through the grid
    for (let z = gridMinZ; z <= gridMaxZ; z += lineSpacing) {
        if (goingRight) {
            // Left to right line
            path.push({ 
                x: gridMaxX, 
                y: SEARCH_PATTERN_HEIGHT, 
                z: z 
            });
            
            // If not at the end, move up to the next Z line
            if (z + lineSpacing <= gridMaxZ) {
                path.push({ 
                    x: gridMaxX, 
                    y: SEARCH_PATTERN_HEIGHT, 
                    z: z + lineSpacing 
                });
            }
        } else {
            // Right to left line
            path.push({ 
                x: gridMinX, 
                y: SEARCH_PATTERN_HEIGHT, 
                z: z 
            });
            
            // If not at the end, move up to the next Z line
            if (z + lineSpacing <= gridMaxZ) {
                path.push({ 
                    x: gridMinX, 
                    y: SEARCH_PATTERN_HEIGHT, 
                    z: z + lineSpacing 
                });
            }
        }
        
        goingRight = !goingRight;
    }
    
    // Log the generated path for debugging
    console.log("Search path generated with " + path.length + " points");
    
    return path;
}

// Function to find the nearest heat source (person) to investigate
function findNearestHeatSource() {
    let closestPerson = null;
    let minDistance = HEAT_DETECTION_RANGE;
    
    people.forEach(person => {
        // Skip already detected people
        if (person.userData.detected) return;
        
        const dx = person.position.x - droneGroup.position.x;
        const dz = person.position.z - droneGroup.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        if (distance < minDistance) {
            minDistance = distance;
            closestPerson = person;
        }
    });
    
    return closestPerson;
}

// Function to handle investigation of a heat source
function investigateHeatSource(heatSource, delta) {
    if (!heatSource) return false;
    
    // Change mission status to investigating
    if (missionStatus !== "Investigating Heat Source") {
        missionStatus = "Investigating Heat Source";
        updateMissionStatus(missionStatus, searchPattern, peopleDetected, droneGroup.position.y);
    }
    
    // Calculate position directly above the heat source
    const targetX = heatSource.position.x;
    const targetZ = heatSource.position.z;
    const targetY = heatSource.position.y + INVESTIGATION_HEIGHT;
    
    // Calculate distance to the target
    const dx = targetX - droneGroup.position.x;
    const dz = targetZ - droneGroup.position.z;
    const dy = targetY - droneGroup.position.y;
    const distance = Math.sqrt(dx * dx + dz * dz + dy * dy);
    
    // If we've arrived at the target position, start hovering
    if (distance < 1) {
        hoverTimer += delta;
        
        // Mark person as detected after we've hovered long enough
        if (hoverTimer >= HOVER_TIME && !heatSource.userData.detected) {
            heatSource.userData.detected = true;
            peopleDetected++;
            updateMissionStatus(missionStatus, searchPattern, peopleDetected, droneGroup.position.y);
            investigationComplete = true;
            return true;
        }
        
        return false;
    } 
    else {
        // Move toward the target
        droneGroup.position.x += dx * INVESTIGATION_SPEED * delta;
        droneGroup.position.z += dz * INVESTIGATION_SPEED * delta;
        droneGroup.position.y += dy * INVESTIGATION_SPEED * delta;
        
        // Point the drone at the heat source
        const angleToTarget = Math.atan2(dz, dx);
        droneGroup.rotation.y = angleToTarget - Math.PI / 2;
        
        return false;
    }
}

// Animation loop
const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    // Rotate the rotors for effect
    rotors.forEach((rotor, i) => {
        rotor.rotation.y += (i % 2 ? 0.5 : -0.5);
    });

    // Handle automatic search mode
    if (autoMode) {
        // If we're currently investigating a heat source
        if (isInvestigating && heatSourceTarget) {
            const investigationDone = investigateHeatSource(heatSourceTarget, delta);
            
            // If investigation is complete, resume normal search
            if (investigationDone) {
                isInvestigating = false;
                heatSourceTarget = null;
                hoverTimer = 0;
                investigationComplete = false;
                missionStatus = "Searching";
                updateMissionStatus(missionStatus, searchPattern, peopleDetected, droneGroup.position.y);
            }
        } 
        // Normal search pattern
        else {
            // First, check if there's a heat source nearby to investigate
            if (!isInvestigating) {
                heatSourceTarget = findNearestHeatSource();
                if (heatSourceTarget) {
                    isInvestigating = true;
                    hoverTimer = 0;
                    investigationComplete = false;
                }
            }
            
            // If no heat source to investigate, continue with search pattern
            if (!isInvestigating && currentPathIndex < missionPath.length) {
                const target = missionPath[currentPathIndex];
                
                // Make sure target is defined
                if (target && 'x' in target && 'y' in target && 'z' in target) {
                    const dx = target.x - droneGroup.position.x;
                    const dz = target.z - droneGroup.position.z;
                    const dy = target.y - droneGroup.position.y;
                    const distance = Math.sqrt(dx * dx + dz * dz + dy * dy);

                    if (distance > 1) {
                        // Move toward the target point
                        droneGroup.position.x += dx * NORMAL_SEARCH_SPEED * delta;
                        droneGroup.position.z += dz * NORMAL_SEARCH_SPEED * delta;
                        droneGroup.position.y += dy * NORMAL_SEARCH_SPEED * delta;
                        
                        // Point the drone in the direction of movement if movement is significant
                        if (Math.abs(dx) > 0.1 || Math.abs(dz) > 0.1) {
                            const angleToTarget = Math.atan2(dz, dx);
                            droneGroup.rotation.y = angleToTarget - Math.PI / 2;
                        }
                    } else {
                        // We've reached the target point, move to the next one
                        currentPathIndex++;
                        console.log("Moving to path point: " + currentPathIndex);
                    }
                } else {
                    // Skip invalid target points
                    console.warn("Invalid target point at index " + currentPathIndex);
                    currentPathIndex++;
                }
            } else if (!isInvestigating) {
                missionStatus = "Search Complete";
                updateMissionStatus(missionStatus, searchPattern, peopleDetected, droneGroup.position.y);
            }
        }
    }

    // Handle manual controls
    if (manualMode) {
        if (keys['ArrowUp']) {
            droneGroup.position.z -= moveSpeed;
        }
        if (keys['ArrowDown']) {
            droneGroup.position.z += moveSpeed;
        }
        if (keys['ArrowLeft']) {
            droneGroup.position.x -= moveSpeed;
        }
        if (keys['ArrowRight']) {
            droneGroup.position.x += moveSpeed;
        }
        if (keys['w']) {
            droneGroup.position.y += moveSpeed;
        }
        if (keys['s']) {
            droneGroup.position.y -= moveSpeed;
            // Don't let the drone go below minimum safe height above terrain
            const currentTerrainHeight = getTerrainHeightAt(droneGroup.position.x, droneGroup.position.z);
            const minHeight = currentTerrainHeight + MIN_SAFE_HEIGHT;
            if (droneGroup.position.y < minHeight) {
                droneGroup.position.y = minHeight;
            }
        }
        if (keys['q']) {
            droneGroup.rotation.y += rotateSpeed;
        }
        if (keys['e']) {
            droneGroup.rotation.y -= rotateSpeed;
        }
    }

    // Update spotlight direction to match drone rotation
    spotlightTarget.position.x = droneGroup.position.x + 5 * Math.sin(droneGroup.rotation.y);
    spotlightTarget.position.z = droneGroup.position.z - 5 * Math.cos(droneGroup.rotation.y);
    spotlightTarget.position.y = -5;

    // Update camera to follow drone
    if (activeCamera === mainCamera) {
        mainCamera.position.x = droneGroup.position.x + 10 * Math.sin(droneGroup.rotation.y);
        mainCamera.position.z = droneGroup.position.z + 10 * Math.cos(droneGroup.rotation.y);
        mainCamera.position.y = droneGroup.position.y + 5;
        mainCamera.lookAt(droneGroup.position);
    }

    // Update thermal display
    updateThermalDisplay(thermalViewActive, droneGroup, people);

    renderer.render(scene, activeCamera);
}

animate();

// Export key components
export { 
    scene, 
    droneGroup, 
    people, 
    terrainSize, 
    missionStatus, 
    searchPattern, 
    peopleDetected,
    getTerrainHeightAt,
    buildings,
    roads
}; 