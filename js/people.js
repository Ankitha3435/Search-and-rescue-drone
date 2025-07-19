// People creation for search and rescue
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.1/three.module.min.js';

// Create people to rescue with heat signatures
export function createPeople(scene, terrainSize, getTerrainHeightAt) {
    // Create a person to rescue function with heat signature
    function createPerson(x, z, pose = 'standing', heatLevel = 37) {
        const personGroup = new THREE.Group();

        // Get height at position
        const heightOffset = getTerrainHeightAt(x, z);

        // Body
        const bodyGeometry = new THREE.CapsuleGeometry(0.3, 1, 4, 8);
        // Color based on heat level (higher = more red)
        const heatColor = new THREE.Color(
            Math.min(1, 0.6 + (heatLevel-36)/10),
            Math.max(0, 0.6 - (heatLevel-36)/10),
            Math.max(0, 0.6 - (heatLevel-36)/10)
        );

        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0xDB4437, // Red jacket
            emissive: heatColor,
            emissiveIntensity: 0.2
        });

        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);

        if (pose === 'standing') {
            body.position.y = 0.8;
            body.rotation.x = 0;
        } else if (pose === 'laying') {
            body.position.y = 0.3;
            body.rotation.x = Math.PI / 2; // Person is laying down
        } else if (pose === 'sitting') {
            body.position.y = 0.5;
            body.rotation.x = Math.PI / 4; // Person is sitting
        }

        personGroup.add(body);

        // Head
        const headGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: 0xF5DEB3, // Skin tone
            emissive: heatColor,
            emissiveIntensity: 0.2
        });

        const head = new THREE.Mesh(headGeometry, headMaterial);

        if (pose === 'standing') {
            head.position.set(0, 1.8, 0);
        } else if (pose === 'laying') {
            head.position.set(0, 0.3, 0.8);
        } else if (pose === 'sitting') {
            head.position.set(0, 1.2, 0.5);
        }

        personGroup.add(head);

        // Add limbs for better recognition
        if (pose === 'standing') {
            // Arms
            const armGeometry = new THREE.CapsuleGeometry(0.15, 0.7, 4, 8);
            const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
            leftArm.position.set(0.5, 1.2, 0);
            leftArm.rotation.z = -Math.PI / 6;
            personGroup.add(leftArm);

            const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
            rightArm.position.set(-0.5, 1.2, 0);
            rightArm.rotation.z = Math.PI / 6;
            personGroup.add(rightArm);

            // Legs
            const legGeometry = new THREE.CapsuleGeometry(0.2, 1, 4, 8);
            const leftLeg = new THREE.Mesh(legGeometry, bodyMaterial);
            leftLeg.position.set(0.3, 0.1, 0);
            personGroup.add(leftLeg);

            const rightLeg = new THREE.Mesh(legGeometry, bodyMaterial);
            rightLeg.position.set(-0.3, 0.1, 0);
            personGroup.add(rightLeg);
        }

        personGroup.position.set(x, heightOffset, z);
        scene.add(personGroup);

        // Store properties with the person
        personGroup.userData.heatLevel = heatLevel;
        personGroup.userData.pose = pose;
        personGroup.userData.detected = false;

        return personGroup;
    }

    const people = [];

    // Group 1: Hikers lost in woods
    people.push(createPerson(30, 40, 'standing', 37.2));
    people.push(createPerson(31, 39, 'standing', 37.5));

    // Group 2: Injured campers
    people.push(createPerson(-40, 25, 'sitting', 38.1)); // Slight fever
    people.push(createPerson(-42, 26, 'laying', 39.2)); // Higher fever, injured

    // Group 3: Someone in water (hypothermia)
    people.push(createPerson(-15, -30, 'laying', 32.5)); // Hypothermia

    // Group 4: Hidden in dense forest
    people.push(createPerson(50, -45, 'sitting', 37.0));

    // Lone lost person
    people.push(createPerson(-70, -60, 'laying', 36.5));

    return people;
} 