// Drone creation and configuration
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.1/three.module.min.js';

export function createDrone(scene, dronePOVCamera) {
    const droneGroup = new THREE.Group();

    // Main body
    const bodyGeometry = new THREE.BoxGeometry(2, 0.5, 2);
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0xFF5733, // Orange/red for visibility
        roughness: 0.5,
        metalness: 0.7
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    droneGroup.add(body);

    // Create arms for the rotors
    const armGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.5, 8);
    const armMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });

    // Four arms
    const positions = [
        { x: 1, y: 0, z: 1, rotation: Math.PI / 4 },
        { x: -1, y: 0, z: 1, rotation: -Math.PI / 4 },
        { x: -1, y: 0, z: -1, rotation: Math.PI / 4 },
        { x: 1, y: 0, z: -1, rotation: -Math.PI / 4 }
    ];

    // Create rotors and arms
    const rotors = [];
    positions.forEach((pos, i) => {
        // Arm
        const arm = new THREE.Mesh(armGeometry, armMaterial);
        arm.position.set(pos.x * 0.7, 0, pos.z * 0.7);
        arm.rotation.z = pos.rotation;
        arm.castShadow = true;
        droneGroup.add(arm);

        // Rotor
        const rotorGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 16);
        const rotorMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
        const rotor = new THREE.Mesh(rotorGeometry, rotorMaterial);
        rotor.position.set(pos.x, 0.1, pos.z);
        rotor.rotation.x = Math.PI / 2;
        rotor.castShadow = true;
        droneGroup.add(rotor);
        rotors.push(rotor);
    });

    // Camera equipment (search and rescue camera)
    const cameraGeometry = new THREE.CylinderGeometry(0.2, 0.3, 0.5, 12);
    const cameraMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const droneCamera = new THREE.Mesh(cameraGeometry, cameraMaterial);
    droneCamera.position.y = -0.4;
    droneCamera.rotation.x = Math.PI / 2;
    droneCamera.castShadow = true;
    droneGroup.add(droneCamera);

    // Thermal Camera/Sensor
    const thermalSensorGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    const thermalSensorMaterial = new THREE.MeshStandardMaterial({
        color: 0x990000,
        emissive: 0x990000,
        emissiveIntensity: 0.5
    });
    const thermalSensor = new THREE.Mesh(thermalSensorGeometry, thermalSensorMaterial);
    thermalSensor.position.set(0.4, -0.4, 0);
    droneGroup.add(thermalSensor);

    // Lens
    const lensGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const lensMaterial = new THREE.MeshStandardMaterial({
        color: 0x3333ff,
        metalness: 0.9,
        roughness: 0.1
    });
    const lens = new THREE.Mesh(lensGeometry, lensMaterial);
    lens.position.y = -0.65;
    droneGroup.add(lens);

    // Add drone POV camera
    dronePOVCamera.position.set(0, -0.2, 0);
    dronePOVCamera.rotation.x = Math.PI / 2;
    droneGroup.add(dronePOVCamera);

    // Spotlight to represent the search light
    const spotlight = new THREE.SpotLight(0xFFFFFF, 2);
    spotlight.position.set(0, -0.5, 0);
    spotlight.angle = 0.3;
    spotlight.penumbra = 0.2;
    spotlight.castShadow = true;
    spotlight.distance = 30;

    const spotlightTarget = new THREE.Object3D();
    spotlightTarget.position.set(0, -10, 0);
    scene.add(spotlightTarget);
    spotlight.target = spotlightTarget;

    droneGroup.add(spotlight);

    // Position the drone
    droneGroup.position.y = 5;
    scene.add(droneGroup);

    return { droneGroup, rotors, spotlight, spotlightTarget };
} 