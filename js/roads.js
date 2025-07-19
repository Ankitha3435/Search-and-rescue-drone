// Road generation for connecting buildings and towns
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.1/three.module.min.js';

export function createRoads(scene, terrainSize, getTerrainHeightAt, buildings) {
    const roads = [];
    
    // Road properties
    const roadWidth = 2;
    const roadThickness = 0.05;
    const roadColor = 0x444444; // Dark gray
    const roadMaterial = new THREE.MeshStandardMaterial({
        color: roadColor,
        roughness: 0.9,
        metalness: 0.1,
    });
    
    // Find building centers for road connections
    const buildingCenters = [];
    buildings.forEach(building => {
        buildingCenters.push({
            x: building.position.x,
            z: building.position.z,
            y: building.position.y
        });
    });
    
    // Group buildings into clusters/towns
    const clusters = [];
    const maxClusterDistance = 40;
    
    // Assign each building to a cluster
    buildingCenters.forEach(building => {
        let assignedToCluster = false;
        
        // Check if the building belongs to an existing cluster
        for (let i = 0; i < clusters.length; i++) {
            const cluster = clusters[i];
            for (let j = 0; j < cluster.length; j++) {
                const clusterBuilding = cluster[j];
                const distance = Math.sqrt(
                    Math.pow(building.x - clusterBuilding.x, 2) +
                    Math.pow(building.z - clusterBuilding.z, 2)
                );
                
                if (distance < maxClusterDistance) {
                    cluster.push(building);
                    assignedToCluster = true;
                    break;
                }
            }
            
            if (assignedToCluster) break;
        }
        
        // If not assigned to any cluster, create a new one
        if (!assignedToCluster) {
            clusters.push([building]);
        }
    });
    
    // Function to create a road between two points
    function createRoad(start, end) {
        // Calculate road length and orientation
        const dx = end.x - start.x;
        const dz = end.z - start.z;
        const length = Math.sqrt(dx * dx + dz * dz);
        const angle = Math.atan2(dz, dx);
        
        // Create the road geometry
        const roadGeometry = new THREE.PlaneGeometry(length, roadWidth);
        const road = new THREE.Mesh(roadGeometry, roadMaterial);
        
        // Position the road at the average height of the terrain
        const avgY = (start.y + end.y) / 2 + roadThickness;
        
        // Position and rotate the road
        road.position.set(
            (start.x + end.x) / 2,
            avgY,
            (start.z + end.z) / 2
        );
        road.rotation.x = -Math.PI / 2; // Make it horizontal
        road.rotation.z = -angle; // Align with direction
        
        // Make sure the road renders above the terrain
        road.renderOrder = 1;
        road.receiveShadow = true;
        
        scene.add(road);
        roads.push(road);
        
        // Add road markings
        if (length > 10) {
            const dashLength = 1;
            const dashSpacing = 2;
            const numDashes = Math.floor(length / (dashLength + dashSpacing));
            
            // Create center white line
            const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
            const lineGeometry = new THREE.PlaneGeometry(dashLength, 0.1);
            
            for (let i = 0; i < numDashes; i++) {
                const dash = new THREE.Mesh(lineGeometry, lineMaterial);
                
                // Position each dash along the road
                const dashOffset = i * (dashLength + dashSpacing) - length / 2 + dashLength / 2;
                
                dash.position.set(0, 0.01, 0); // Slightly above the road
                dash.rotation.x = 0;
                
                // Apply the same transformations as the road
                dash.position.x += dashOffset;
                
                road.add(dash);
            }
        }
        
        return road;
    }
    
    // Create main roads connecting clusters (towns)
    if (clusters.length > 1) {
        for (let i = 0; i < clusters.length - 1; i++) {
            // Connect this cluster to the next one
            const currentCluster = clusters[i];
            const nextCluster = clusters[i + 1];
            
            if (currentCluster.length > 0 && nextCluster.length > 0) {
                // Find the closest buildings between clusters
                let minDistance = Infinity;
                let startBuilding = null;
                let endBuilding = null;
                
                for (const building1 of currentCluster) {
                    for (const building2 of nextCluster) {
                        const distance = Math.sqrt(
                            Math.pow(building1.x - building2.x, 2) +
                            Math.pow(building1.z - building2.z, 2)
                        );
                        
                        if (distance < minDistance) {
                            minDistance = distance;
                            startBuilding = building1;
                            endBuilding = building2;
                        }
                    }
                }
                
                if (startBuilding && endBuilding) {
                    createRoad(startBuilding, endBuilding);
                }
            }
        }
    }
    
    // Create local roads within clusters
    clusters.forEach(cluster => {
        if (cluster.length > 1) {
            // Find a central building (town center)
            const center = {
                x: 0,
                z: 0,
                y: 0
            };
            
            cluster.forEach(building => {
                center.x += building.x;
                center.z += building.z;
                center.y += building.y;
            });
            
            center.x /= cluster.length;
            center.z /= cluster.length;
            center.y /= cluster.length;
            
            // Find the building closest to the center
            let centerBuilding = cluster[0];
            let minDistance = Math.sqrt(
                Math.pow(centerBuilding.x - center.x, 2) +
                Math.pow(centerBuilding.z - center.z, 2)
            );
            
            for (let i = 1; i < cluster.length; i++) {
                const distance = Math.sqrt(
                    Math.pow(cluster[i].x - center.x, 2) +
                    Math.pow(cluster[i].z - center.z, 2)
                );
                
                if (distance < minDistance) {
                    minDistance = distance;
                    centerBuilding = cluster[i];
                }
            }
            
            // Connect all buildings to the center
            for (const building of cluster) {
                if (building !== centerBuilding) {
                    // Only create roads for buildings that are closer than a certain distance
                    const distance = Math.sqrt(
                        Math.pow(building.x - centerBuilding.x, 2) +
                        Math.pow(building.z - centerBuilding.z, 2)
                    );
                    
                    if (distance < 40) {
                        createRoad(centerBuilding, building);
                    }
                }
            }
            
            // Create some additional random connections for a more realistic road network
            const numExtraRoads = Math.floor(cluster.length * 0.3); // About 30% extra roads
            
            for (let i = 0; i < numExtraRoads; i++) {
                const building1 = cluster[Math.floor(Math.random() * cluster.length)];
                const building2 = cluster[Math.floor(Math.random() * cluster.length)];
                
                if (building1 !== building2) {
                    const distance = Math.sqrt(
                        Math.pow(building1.x - building2.x, 2) +
                        Math.pow(building1.z - building2.z, 2)
                    );
                    
                    if (distance < 30) {
                        createRoad(building1, building2);
                    }
                }
            }
        }
    });
    
    return roads;
} 