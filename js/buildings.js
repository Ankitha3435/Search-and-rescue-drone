// Building generation for the environment
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.1/three.module.min.js';

export function createBuildings(scene, terrainSize, getTerrainHeightAt) {
    const buildings = [];
    
    // Different building types
    const buildingTypes = [
        {
            type: 'house',
            width: 4,
            length: 5,
            height: 3,
            color: 0xD2B48C, // Tan
            roofColor: 0x8B4513, // Brown
            probability: 0.7
        },
        {
            type: 'apartment',
            width: 8,
            length: 12,
            height: 10,
            color: 0xCD853F, // Peru
            roofColor: 0x708090, // Slate gray
            probability: 0.15
        },
        {
            type: 'skyscraper',
            width: 10,
            length: 10,
            height: 30,
            color: 0x87CEFA, // Light sky blue (glass)
            roofColor: 0x2F4F4F, // Dark slate gray
            probability: 0.05
        },
        {
            type: 'warehouse',
            width: 15,
            length: 25,
            height: 6,
            color: 0xA9A9A9, // Dark gray
            roofColor: 0x696969, // Dim gray
            probability: 0.1
        }
    ];
    
    // Create a building at the specified location
    function createBuilding(x, z) {
        // Determine building type based on probability
        const rand = Math.random();
        let typeIndex = 0;
        let cumProb = 0;
        
        for (let i = 0; i < buildingTypes.length; i++) {
            cumProb += buildingTypes[i].probability;
            if (rand < cumProb) {
                typeIndex = i;
                break;
            }
        }
        
        const buildingType = buildingTypes[typeIndex];
        const buildingGroup = new THREE.Group();
        
        // Get height at position for the building foundation
        const heightOffset = getTerrainHeightAt(x, z);
        
        // Randomize dimensions slightly
        const width = buildingType.width * (0.8 + Math.random() * 0.4);
        const length = buildingType.length * (0.8 + Math.random() * 0.4);
        const height = buildingType.height * (0.8 + Math.random() * 0.4);
        
        // Main building geometry
        const buildingGeometry = new THREE.BoxGeometry(width, height, length);
        const buildingMaterial = new THREE.MeshStandardMaterial({
            color: buildingType.color,
            roughness: 0.7,
            metalness: 0.2
        });
        
        const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
        building.position.y = height / 2;
        building.castShadow = true;
        building.receiveShadow = true;
        buildingGroup.add(building);
        
        // Add windows for larger buildings
        if (buildingType.type !== 'house' && buildingType.type !== 'warehouse') {
            addWindows(building, width, height, length);
        }
        
        // Add a roof based on building type
        if (buildingType.type === 'house') {
            // Pitched roof for houses
            const roofGeometry = new THREE.ConeGeometry(width * 0.7, height * 0.5, 4);
            const roofMaterial = new THREE.MeshStandardMaterial({
                color: buildingType.roofColor,
                roughness: 0.8,
                metalness: 0.1
            });
            
            const roof = new THREE.Mesh(roofGeometry, roofMaterial);
            roof.rotation.y = Math.PI / 4; // Rotate to align with building
            roof.position.y = height + (height * 0.25);
            roof.castShadow = true;
            buildingGroup.add(roof);
        } else if (buildingType.type === 'warehouse') {
            // Flat roof with a slight slope for warehouses
            const roofGeometry = new THREE.BoxGeometry(width, height * 0.1, length);
            const roofMaterial = new THREE.MeshStandardMaterial({
                color: buildingType.roofColor,
                roughness: 0.9,
                metalness: 0.1
            });
            
            const roof = new THREE.Mesh(roofGeometry, roofMaterial);
            roof.position.y = height + (height * 0.05);
            roof.castShadow = true;
            buildingGroup.add(roof);
        } else if (buildingType.type === 'skyscraper') {
            // Antenna/spire for skyscrapers
            const spireGeometry = new THREE.CylinderGeometry(0.5, 0.5, height * 0.2, 8);
            const spireMaterial = new THREE.MeshStandardMaterial({
                color: 0x888888,
                roughness: 0.5,
                metalness: 0.8
            });
            
            const spire = new THREE.Mesh(spireGeometry, spireMaterial);
            spire.position.y = height + (height * 0.1);
            spire.castShadow = true;
            buildingGroup.add(spire);
        }
        
        // Position the building group on the terrain
        buildingGroup.position.set(x, heightOffset, z);
        
        // Randomly rotate the building
        buildingGroup.rotation.y = Math.random() * Math.PI * 2;
        
        scene.add(buildingGroup);
        return buildingGroup;
    }
    
    // Add windows to a building
    function addWindows(building, width, height, length) {
        // Create window material (emissive to make it glow slightly)
        const windowMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,
            emissive: 0xFFFF99,
            emissiveIntensity: Math.random() > 0.5 ? 0.4 : 0, // Some windows lit, some not
            roughness: 0.1,
            metalness: 0.9
        });
        
        // Window dimensions
        const windowWidth = 0.5;
        const windowHeight = 0.8;
        const windowDepth = 0.1;
        
        // How many windows per floor and how many floors
        const windowsPerWidth = Math.max(1, Math.floor(width / 2));
        const windowsPerLength = Math.max(1, Math.floor(length / 2));
        const floors = Math.max(1, Math.floor(height / 3));
        
        // Space between windows
        const spacingWidth = width / (windowsPerWidth + 1);
        const spacingLength = length / (windowsPerLength + 1);
        const spacingHeight = height / (floors + 1);
        
        // Create windows for front and back faces
        for (let floor = 1; floor <= floors; floor++) {
            const y = floor * spacingHeight - height / 2;
            
            for (let i = 1; i <= windowsPerWidth; i++) {
                const x = i * spacingWidth - width / 2;
                
                // Front windows
                const frontWindow = new THREE.Mesh(
                    new THREE.BoxGeometry(windowWidth, windowHeight, windowDepth),
                    windowMaterial
                );
                frontWindow.position.set(x, y, length / 2 + 0.01);
                building.add(frontWindow);
                
                // Back windows
                const backWindow = new THREE.Mesh(
                    new THREE.BoxGeometry(windowWidth, windowHeight, windowDepth),
                    windowMaterial
                );
                backWindow.position.set(x, y, -length / 2 - 0.01);
                building.add(backWindow);
            }
            
            // Create windows for left and right faces
            for (let i = 1; i <= windowsPerLength; i++) {
                const z = i * spacingLength - length / 2;
                
                // Left windows
                const leftWindow = new THREE.Mesh(
                    new THREE.BoxGeometry(windowDepth, windowHeight, windowWidth),
                    windowMaterial
                );
                leftWindow.position.set(width / 2 + 0.01, y, z);
                building.add(leftWindow);
                
                // Right windows
                const rightWindow = new THREE.Mesh(
                    new THREE.BoxGeometry(windowDepth, windowHeight, windowWidth),
                    windowMaterial
                );
                rightWindow.position.set(-width / 2 - 0.01, y, z);
                building.add(rightWindow);
            }
        }
    }
    
    // Create a small town with buildings clustered in certain areas
    function createTown(centerX, centerZ, size, buildingCount) {
        const townBuildings = [];
        
        for (let i = 0; i < buildingCount; i++) {
            // Position buildings with higher density near center
            const distance = Math.pow(Math.random(), 2) * size;
            const angle = Math.random() * Math.PI * 2;
            
            const x = centerX + Math.cos(angle) * distance;
            const z = centerZ + Math.sin(angle) * distance;
            
            // Don't place buildings in water
            if (getTerrainHeightAt(x, z) > -1) {
                const building = createBuilding(x, z);
                townBuildings.push(building);
                buildings.push(building);
            }
        }
        
        return townBuildings;
    }
    
    // Create a few towns scattered across the map
    const townCount = 3 + Math.floor(Math.random() * 2); // 3-4 towns
    const towns = [];
    
    for (let i = 0; i < townCount; i++) {
        const x = (Math.random() * 0.7 + 0.15) * terrainSize - terrainSize/2;
        const z = (Math.random() * 0.7 + 0.15) * terrainSize - terrainSize/2;
        const size = 15 + Math.random() * 25;
        const buildingCount = 10 + Math.floor(Math.random() * 20);
        
        towns.push(createTown(x, z, size, buildingCount));
    }
    
    // Add some isolated buildings (farms, etc.)
    const isolatedBuildingCount = 5 + Math.floor(Math.random() * 10);
    
    for (let i = 0; i < isolatedBuildingCount; i++) {
        const x = Math.random() * terrainSize - terrainSize/2;
        const z = Math.random() * terrainSize - terrainSize/2;
        
        // Don't place buildings in water
        if (getTerrainHeightAt(x, z) > -1) {
            buildings.push(createBuilding(x, z));
        }
    }
    
    return buildings;
} 