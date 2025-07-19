// Environment objects like trees, rocks, etc.
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.1/three.module.min.js';

// Create trees function
export function createTrees(scene, terrainSize, getTerrainHeightAt) {
    const trees = [];
    
    function createTree(x, z, scale = 1) {
        const treeGroup = new THREE.Group();

        // Get height at position
        const heightOffset = getTerrainHeightAt(x, z);

        // Tree trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.2 * scale, 0.3 * scale, 2 * scale, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.castShadow = true;
        trunk.position.y = 1 * scale;
        treeGroup.add(trunk);

        // Tree top
        const topGeometry = new THREE.ConeGeometry(1 * scale, 3 * scale, 8);
        const topMaterial = new THREE.MeshStandardMaterial({ color: 0x2E8B57 });
        const top = new THREE.Mesh(topGeometry, topMaterial);
        top.position.y = (3 * scale);
        top.castShadow = true;
        treeGroup.add(top);

        treeGroup.position.set(x, heightOffset, z);
        scene.add(treeGroup);

        return treeGroup;
    }
    
    // Create trees and vegetation
    for (let i = 0; i < 200; i++) {
        const x = Math.random() * terrainSize - terrainSize/2;
        const z = Math.random() * terrainSize - terrainSize/2;
        const scale = Math.random() * 0.5 + 0.7;

        // Don't place trees in water
        if (getTerrainHeightAt(x, z) > -1.5) {
            trees.push(createTree(x, z, scale));
        }
    }
    
    return trees;
}

// Create rocks
export function createRocks(scene, terrainSize, getTerrainHeightAt) {
    const rocks = [];
    
    function createRock(x, z, scale) {
        const rockGeometry = new THREE.DodecahedronGeometry(scale, 0);
        const rockMaterial = new THREE.MeshStandardMaterial({
            color: 0x888888,
            roughness: 0.9
        });
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);

        // Position it on the terrain
        const heightOffset = getTerrainHeightAt(x, z);
        rock.position.set(x, heightOffset + scale/2, z);

        rock.castShadow = true;
        rock.receiveShadow = true;
        scene.add(rock);

        return rock;
    }
    
    // Add rocks
    for (let i = 0; i < 100; i++) {
        const x = Math.random() * terrainSize - terrainSize/2;
        const z = Math.random() * terrainSize - terrainSize/2;
        const scale = Math.random() * 0.8 + 0.5;

        // Don't place rocks in water
        if (getTerrainHeightAt(x, z) > -1.5) {
            rocks.push(createRock(x, z, scale));
        }
    }
    
    return rocks;
} 