// Terrain generation and height functions
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.1/three.module.min.js';

export function createTerrain(scene) {
    const terrainSize = 200;
    const terrainResolution = 100;
    const terrainGeometry = new THREE.PlaneGeometry(terrainSize, terrainSize, terrainResolution, terrainResolution);
    const terrainMaterial = new THREE.MeshStandardMaterial({
        color: 0x3B7A57, // Forest green
        roughness: 0.8,
        metalness: 0.2,
    });

    // Create a heightmap for the terrain
    const vertices = terrainGeometry.getAttribute('position').array;

    // Generate some mountains and valleys
    for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i];
        const z = vertices[i + 2];

        // Apply Perlin-like noise (simplified)
        let height = Math.sin(x * 0.05) * Math.cos(z * 0.05) * 3;
        height += Math.sin(x * 0.1 + 10) * Math.cos(z * 0.1) * 2;
        height += Math.sin(x * 0.2 + 30) * Math.cos(z * 0.2 + 5) * 1;

        // Add some random small variations
        height += Math.random() * 0.5;

        // Set the height (y value)
        vertices[i + 1] = height;
    }

    terrainGeometry.getAttribute('position').needsUpdate = true;
    terrainGeometry.computeVertexNormals();

    const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
    terrain.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    terrain.receiveShadow = true;
    scene.add(terrain);

    return { terrain, terrainSize };
}

// Function to get terrain height at a specific position
export function getTerrainHeightAt(x, z) {
    // Simplified height calculation (approximation)
    let height = Math.sin(x * 0.05) * Math.cos(z * 0.05) * 3;
    height += Math.sin(x * 0.1 + 10) * Math.cos(z * 0.1) * 2;
    height += Math.sin(x * 0.2 + 30) * Math.cos(z * 0.2 + 5) * 1;

    return height;
} 